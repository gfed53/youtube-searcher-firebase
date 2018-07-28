/*jshint esversion: 6 */

(function(){
	angular
	.module('myApp')
	.factory('ytTrustSrc', ['$sce', ytTrustSrc])
	.factory('ytSearchYouTube', ['$q', '$http', 'ytChanSearch', 'ytTranslate', 'ytModalGenerator', 'ytDateHandler', 'ytInitAPIs', ytSearchYouTube])
	.factory('ytChanSearch', ['$q', '$http', 'ytModalGenerator', 'ytInitAPIs', ytChanSearch])
	.factory('ytCurrentVideo', ['$q', '$http', 'ytModalGenerator', 'ytInitAPIs', ytCurrentVideo])
	.factory('ytCurrentChannel', ['$q', '$http', 'ytModalGenerator', 'ytInitAPIs', ytCurrentChannel])
	.factory('ytSetChannelAndNavigate', ['$state', 'ytCurrentChannel', 'ytSearchParams', ytSetChannelAndNavigate])
	.factory('ytComputeCssClass', [ytComputeCssClass])
	.factory('ytScrollTo', ['$location', '$anchorScroll', ytScrollTo])
	.factory('ytCheckScrollBtnStatus', ['$state', ytCheckScrollBtnStatus])
	.factory('ytCheckScrollDir', [ytCheckScrollDir])
	.factory('ytCheckScrollY', [ytCheckScrollY])
	.factory('ytInitMap', [ytInitMap])
	.factory('ytFilters', ['ytDateHandler', ytFilters])
	.factory('ytModalGenerator', ['$q', '$uibModal', ytModalGenerator])
	.factory('ytDateHandler', [ytDateHandler])
	.factory('ytUtilities', [ytUtilities])
	.factory('ytFocus', ['$timeout', '$window', ytFocus])
	.service('ytChanFilter', [ytChanFilter])
	.service('ytSearchParams', ['ytTranslate', ytSearchParams])
	.service('ytResults', [ytResults])
	.service('ytVideoItems', ['$q', '$state', '$stateParams', 'ytModalGenerator', 'ytUtilities', ytVideoItems])
	.service('ytVideoItemsFB', ['$q', '$timeout', '$state', '$stateParams', 'ytModalGenerator', 'ytUtilities', 'ytFirebase', 'ytVideoItems', ytVideoItemsFB])
	.service('ytSearchHistory', ['$q', 'ytModalGenerator', 'ytSearchParams', 'ytUtilities', ytSearchHistory])
	.service('ytSearchHistoryFB', ['$q', 'ytModalGenerator', 'ytSearchParams', 'ytUtilities', 'ytFirebase', ytSearchHistoryFB])
	.service('ytTranslate', ['$http', '$q', 'ytModalGenerator', 'ytInitAPIs', ytTranslate])
	.service('ytSortOrder', [ytSortOrder])
	.service('ytPlaylistView', [ytPlaylistView])
	.service('ytPlaylistSort', ['ytSettings', ytPlaylistSort])
	.service('ytInitAPIs', ['$http', '$q', 'ytModalGenerator', ytInitAPIs])
	.service('ytSettings', ['$q', 'ytInitAPIs', 'ytFirebase', 'ytModalGenerator', ytSettings])
	.service('ytFirebase', ['ytModalGenerator', 'ytInitAPIs', '$q', '$state', '$firebaseArray', '$firebaseObject', ytFirebase]);

	// Used to follow security measures with YouTube video links in particular 
	function ytTrustSrc($sce){
		return (src) => {
			return $sce.trustAsResourceUrl(src);
		};
	}

	// Searches the API for videos based on search params
	function ytSearchYouTube($q, $http, ytChanSearch, ytTranslate, ytModalGenerator, ytDateHandler, ytInitAPIs) {
		return (params, pageToken, direction) => {
			
			// Ensures that we take the previously searched keyword during page navigation.
			let query = (pageToken ? params.searchedKeyword : params.keyword);
			let url = 'https://www.googleapis.com/youtube/v3/search';
			let apisObj = ytInitAPIs.apisObj;

			// Moment.js parsing
			let parsedAfter = (params.after ? ytDateHandler().getDate(params.after, 'M/D/YYYY') : undefined),
			parsedBefore = (params.before ? ytDateHandler().getDate(params.before, 'M/D/YYYY') : undefined);

			let request = {
				key: apisObj.googKey,
				part: 'snippet',
				maxResults: 50,
				order: params.order,
				publishedAfter: parsedAfter,
				publishedBefore: parsedBefore,
				location: params.location,
				locationRadius: params.locationRadius,
				q: query,
				type: 'video',
				channelId: params.channelId,
				videoEmbeddable: true,
			};

			if(pageToken){
				request.pageToken = pageToken;
			}

			let errorModalObj = ytModalGenerator().getTemp('searchTemp');

			let services = {
				checkTrans: checkTrans,
				getResults: getResults,
				transAndResults: transAndResults,
				search: search
			};

			return services;

			function getResults(){
				return $http({
					method: 'GET',
					url: url,
					params: request
				})
				.then((response) => {
					return $q.when(response);
				},
				(response) => {
					ytModalGenerator().openModal(errorModalObj);
				});
			}

			// Checks to see if a language to which the query should be translated is selected
			function checkTrans(_keyword_, _lang_){
				let deferred = $q.defer();
				if(_lang_){
					ytTranslate.translate(_keyword_, _lang_)
					.then((response) => {
						deferred.resolve(response.data.text[0]);
					});
				} else {
					deferred.resolve(_keyword_);
				}
				return deferred.promise;
			}
			// Translates query if necessary, then runs search
			function transAndResults(){
				let deferred = $q.defer();
				checkTrans(query, params.lang.value).then((response) => {
					request.q = response;
					getResults().then((response) => {
						deferred.resolve(response);
					});
				});
				return deferred.promise;
			}

			function search(){
				let deferred = $q.defer();
				if(params.searchType === 'video'){
					transAndResults()
					.then((response) => {
						// Value created to display page number in view
						response.pageDirection = direction;

						deferred.resolve(response);
					});
				} else {
					ytChanSearch(query).getResults()
					.then((response) => {
						deferred.resolve(response);
					});
				}
				return deferred.promise;
			}
		};
	}

	// Searches the API for channels based on search query
	function ytChanSearch($q, $http, ytModalGenerator, ytInitAPIs){
		return (channel) => {
			let url = 'https://www.googleapis.com/youtube/v3/search';
			let request = {
				key: ytInitAPIs.apisObj.googKey,
				part: 'snippet',
				maxResults: 50,
				order: 'relevance',
				q: channel,
				type: 'channel'
			};

			let errorModalObj = ytModalGenerator().getTemp('searchTemp');

			let services = {
				getResults: getResults
			};

			return services;

			function getResults(){
				return $http({
					method: 'GET',
					url: url,
					params: request
				})
				.then((response) => {
					let results = response;
					return $q.when(response);
				},
				(response) => {
					ytModalGenerator().openModal(errorModalObj);
				});
			}
		};
	}

	// Filters a video search by channel
	function ytChanFilter(){
		this.id = '';
		this.image = '';
		this.set = set;
		this.clear = clear;

		function set(id, image){
			this.id = id;
			this.image = image;
		}

		function clear(){
			this.id = '';
			this.image = '';
		}

	}

	//Used to retrieve necessary data from a particular video (in video player section)
	function ytCurrentVideo($q, $http, ytModalGenerator, ytInitAPIs){
		return (id) => {
			let url = 'https://www.googleapis.com/youtube/v3/videos',
			request = {
				key: ytInitAPIs.apisObj.googKey,
				part: 'snippet, contentDetails',
				// contentDetails contains the duration property.
				id: id
			},
			errorModalObj = ytModalGenerator().getTemp('videoTemp'),

			services = {
				getVideo: getVideo
			};
			return services;

			function getVideo(){
				return $http({
					method: 'GET',
					url: url,
					params: request
				})
				.then((response) => {
					return $q.when(response);
				},
				(response) => {
					ytModalGenerator().openModal(errorModalObj);
				});	
			}	
		};
	}

	// Used to get back a video's channel data (which requires a different call from ytCurrentVideo)
	function ytCurrentChannel($q, $http, ytModalGenerator, ytInitAPIs){
		return (id) => {
			let url = "https://www.googleapis.com/youtube/v3/channels",
			request = {
				key: ytInitAPIs.apisObj.googKey,
				part: 'snippet',
				id: id
			},
			errorModalObj = ytModalGenerator().getTemp('videoTemp'),
			services = {
				getChannel: getChannel
			};

			return services;

			function getChannel(){
				return $http({
					method: 'GET',
					url: url,
					params: request
				})
				.then((response) => {
					return $q.when(response);
				},
				(response) => {
					ytModalGenerator().openModal(errorModalObj);
				});	
			}	
		};
	}

	function ytSetChannelAndNavigate($state, ytCurrentChannel, ytSearchParams) {
		return (channelId) => {
			let params = ytSearchParams.get();
			ytCurrentChannel(channelId).getChannel()
				.then((response) => {
					let channel = response.data.items[0];
					params.channelId = channel.id;
					params.image = channel.snippet.thumbnails.default.url;
					ytSearchParams.set(params);
					$state.go('search');
				});
		}
	}

	//Used for saving videos to the user's local storage (in the playlist/saved content section)
	function ytVideoItems($q, $state, $stateParams, ytModalGenerator, ytUtilities){
		let videoIdObj = {videoId : $stateParams.videoId};
		let items = [];

		this.services = {
			init: init,
			getItems: getItems,
			setItem: setItem,
			clearItem: clearItem,
			clearAllItems: clearAllItems,
			getVideoId: getVideoId,
			setVideoId: setVideoId,
			isSaved: isSaved
		};

		// Automatically grabs items from localStorage and saves them to variable 'items'
		// Should this be executed on app init, and not in playlist init?
		function init(){
			if(localStorage.length){
				for(let key in localStorage){
					if(key.includes('uytp')){
						let obj = JSON.parse(localStorage[key]);
						//Legacy fallback?
						if(obj.$$hashKey){
							delete obj.$$hashKey;
						}
						obj.name = obj.snippet.title;
						obj.codeName = key;
						if(ytUtilities().getIndexIfObjWithAttr(items, 'name', obj.name) === -1){
							items.push(obj);
						}
					}
				}
			}
		}

		function getItems(){
			if(!items.length){
				init();
			}
			return items;
		}

		function setItem(result){
			let dateAdded = Date.now(),
					content = result,
					itemName = result.snippet.title+'-'+content.id.videoId+'-uytp',
					deferred = $q.defer();

			delete content.$$hashKey;

			content.dateAdded = dateAdded;
			content.name = content.snippet.title;
			content.codeName = itemName;

			if(ytUtilities().getIndexIfObjWithAttr(items, 'codeName', content.codeName) === -1){

				// We're pushing to the items array here. This is a conflict because items.length will be greater than 0, causing the init method not to run, which would skip the grabbing of already saved videos in local storage. 
				items.push(content);

				content = JSON.stringify(content);

				localStorage.setItem(itemName, content);

				deferred.resolve(content);
			} else{
				let errorVideoExistsTemp = ytModalGenerator().getTemp('errorVideoExistsTemp');
				//Call modal
				ytModalGenerator().openModal(errorVideoExistsTemp)
					.then(()=> {
						deferred.reject();
					});
			}
			
			return deferred.promise;

		}

		function clearItem(item, isWarnActive){
			let warnTemp = ytModalGenerator().getTemp('warnTemp'),
			itemRemovedTemp = ytModalGenerator().getTemp('itemRemovedTemp'),
			deferred = $q.defer();
			function initClear(){
				var index = items.indexOf(item);
				items.splice(index, 1);
				localStorage.removeItem(item.codeName);
			}
			if(item.codeName){ //This would take place in the playlist section
				if(isWarnActive){
					ytModalGenerator().openModal(warnTemp)
					.then(()=> {
						initClear();
						ytModalGenerator().openModal(itemRemovedTemp);
						deferred.resolve();
					});
				} else {
					initClear();
					ytModalGenerator().openModal(itemRemovedTemp);
					deferred.resolve();
				}
				
			} else if(item) { //This would take place in the video section.
				items.forEach((_item_) => {
					if(_item_.id.videoId === item.id){
						let current = _item_;
						//Remove both from localStorage and items array within this service.
						localStorage.removeItem(current.codeName);
						let currentIndex = items.indexOf(current);
						items.splice(currentIndex, 1);
						deferred.resolve();
					}
				});
				

			}
			return deferred.promise;
		}

		//TODO: improve logic
		function clearAllItems(){
			let deferred = $q.defer();
			let dangerTemp = ytModalGenerator().getTemp('dangerTemp');
			ytModalGenerator().openModal(dangerTemp)
			.then(() => {
				items = [];
				for(let key in localStorage){
					if(key.includes('uytp')){
						localStorage.removeItem(key);
					}
				}

				deferred.resolve(items);
			}, () => {
				deferred.reject();
			});

			return deferred.promise;
		}

		//Check url params when loading page in video player state
		function getVideoId(){
			return videoIdObj;
		}

		function setVideoId(videoId){
			videoIdObj.videoId = videoId;
		}

		//Check if video item is saved()
		function isSaved(id){
			let bool;
			if(items.length){
				items.forEach((_item_) => {
					if(_item_.id.videoId === id){
						bool = true;
					}
				});
			}

			return bool;
		}

	}

	// Firebase Version
	function ytVideoItemsFB($q, $timeout, $state, $stateParams, ytModalGenerator, ytUtilities, ytFirebase, ytVideoItems){

		let videoIdObj = {videoId : null};
		
		var items = null;

		this.services = {
			init: init,
			getItems: getItems,
			setItem: setItem,
			clearItem: clearItem,
			clearAllItems: clearAllItems,
			getVideoId: getVideoId,
			setVideoId: setVideoId,
			isSaved: isSaved
		};

		// Automatically syncs to FB and saves them to variable 'items'
		function init(){
			if(ytFirebase.services.getCurrent()){
				var ref = ytFirebase.services.getCurrent();
				items = ytFirebase.services.getRefArray('savedVideos');
			} else {
				// Execute what we need to when user uses local storage
				ytVideoItems.services.init();
			}
		}

		function getItems(){
			if(!items.length){
				init();
			}
			return items;
		}

		function setItem(result){

			let dateAdded = Date.now(),
					content = result,
					itemName = result.snippet.title+'-'+content.id.videoId+'-uytp',
					deferred = $q.defer();
			
			delete content.$$hashKey;

			content.dateAdded = dateAdded;
			content.name = content.snippet.title;
			content.codeName = itemName;

			// Check if video already exists!
			if(ytUtilities().getIndexIfObjWithAttr(items, 'codeName', content.codeName) === -1){
					items.$add(content)
					.then((ref) => {
						ytFirebase.services.hotSave();
						deferred.resolve(content);
					});
				} else {
					let errorVideoExistsTemp = ytModalGenerator().getTemp('errorVideoExistsTemp');
					// Call modal
					ytModalGenerator().openModal(errorVideoExistsTemp)
						.then(()=> {
							deferred.reject();
						});
					
				}

				return deferred.promise;
		}

		function clearItem(item, isWarnActive){
			let warnTemp = ytModalGenerator().getTemp('warnTemp'),
			itemRemovedTemp = ytModalGenerator().getTemp('itemRemovedTemp'),
			deferred = $q.defer();
			function initClear(_item_){
				items.$remove(_item_)
				.then((ref) => {
					ytFirebase.services.hotSave();
				});
			}
			if(item.codeName){ //This would take place in the playlist section
				if(isWarnActive){
					ytModalGenerator().openModal(warnTemp)
					.then(()=> {
						initClear(item);
						ytModalGenerator().openModal(itemRemovedTemp);
						deferred.resolve();
					});
				} else {
					initClear(item);
					ytModalGenerator().openModal(itemRemovedTemp);
					deferred.resolve();
				}
				
			} else if(item) { //This would take place in the video section.
				items.forEach((_item_) => {
					if(_item_.id.videoId === item.id){
						let current = _item_;
						//Remove both from localStorage and items array within this service.
						initClear(current);
						deferred.resolve();
					}
				});
				

			}
			return deferred.promise;
		}

		//TODO: improve logic
		function clearAllItems(){
			let deferred = $q.defer();
			let dangerTemp = ytModalGenerator().getTemp('dangerTemp');
			ytModalGenerator().openModal(dangerTemp)
			.then(() => {
				var objRef = ytFirebase.services.getRefObj('savedVideos');
				objRef.$remove()
				.then(()=>{
					ytFirebase.services.hotSave();
					deferred.resolve(items);
				});
			}, () => {
				deferred.reject();
			});

			return deferred.promise;
		}

		//Check url params when loading page in video player state
		function getVideoId(){
			return videoIdObj;
		}

		function setVideoId(videoId){
			videoIdObj.videoId = videoId;
		}

		//Check if video item is saved()
		//Bug: this will not always be retrieved in time if loading page from video state. It would depend on how quickly fbase loads up. Make async/use promise?
		function isSaved(id){
			let bool;
			if(items.length){
				items.forEach((_item_) => {
					if(_item_.id.videoId === id){
						bool = true;
					}
				});
			}

			return bool;
		}

	}

	//Where saved search params are stored (so while switching views/controllers, changes in search params will be kept)
	function ytSearchParams(ytTranslate){
		let params = {
			keyword: null,
			searchedKeyword: null,
			searchType: 'video',
			channel: null,
			channelId: null,
			image: null,
			order: 'relevance',
			after: null,
			before: null,
			safeSearch: null,
			location: null,
			locationRadius: null,
			lat: null,
			lng: null,
			radius: null,
			currentPage: null,
			prevPageToken: null,
			nextPageToken: null,
			name: null,
			date: null,
			lang: ytTranslate.langs[0]
		};

		let searchTypePrev = 'video';

		//This is used for page traversal. We store the previous search params. That way, we can adjust/update the queries all we want, and grab new page tokens from the last search all we want.
		let paramsPrev = {};

		let original = Object.assign({}, params);

		let currentPage = 1;

		this.get = get;
		this.getPrev = getPrev;
		this.set = set;
		this.setPrev = setPrev;
		this.getSTP = getSTP;
		this.setSTP = setSTP;
		this.reset = reset;
		this.updateCurrentPage = updateCurrentPage;
		this.getCurrentPage = getCurrentPage;

		function get(){
			return params;
		}

		function getPrev(){
			return paramsPrev;
		}

		function set(newParams){

			newParams.after = (newParams.after ? new Date(newParams.after) : undefined);
			newParams.before = (newParams.before ? new Date(newParams.before) : undefined);

			for(let item in params){
				//To avoid conflict with page traversal of prev search after retrieving a new search
				if(item === 'searchedKeyword'){
				} else {
					params[item] = newParams[item];

					if(newParams[item] === 'Invalid Date'){
						newParams[item] = null;
					}
				}
			}
			params.keyword = newParams.searchedKeyword;

		}

		function setPrev(_params_, direction){
			//This will not execute if it's page traversal..
			if(!direction){
				for(let key in _params_){
					paramsPrev[key] = _params_[key];
				}
			} else {
				//..But the new page tokens are required
				paramsPrev['prevPageToken'] = _params_['prevPageToken'];
				paramsPrev['nextPageToken'] = _params_['nextPageToken'];
			}
		}

		// STP: searchTypePrev
		function getSTP(){
			return searchTypePrev;
		}

		function setSTP(_val_){
			searchTypePrev = _val_;
		}

		function reset(){
			for(let key in params){
				if(key in original){
					params[key] = original[key];
				}
			}
		}

		function updateCurrentPage(step){
			if(step === 'next'){
				currentPage++;
			} else if(step === 'prev'){
				currentPage--;
			} else {
				currentPage = 1;
			}
		}

		function getCurrentPage(){
			return currentPage;
		}
	}

	//Where video and channel results are stored (so while switching views/controllers, these will be kept)
	function ytResults(){
		this.results = [];
		this.chanResults = [];
		this.currentVideo;
		this.status = {
			videosCollapsed: true,
			channelsCollapsed: true,
			videoButtonValue: '',
			channelButtonValue: ''
		};
		this.getResults = getResults;
		this.getChanResults = getChanResults;
		this.setResults = setResults;
		this.setChanResults = setChanResults;
		this.getStatus = getStatus;
		this.setStatus = setStatus;
		this.checkStatus = checkStatus;

		//TODO just easier method to toggle button text (like <span>)
		function checkStatus(newVal, oldVal, buttonValue, showText, hideText){
			if(newVal === true){
				buttonValue = showText;
			} else {
				buttonValue = hideText;
			}
			return buttonValue;	
		}

		function getStatus(){
			return this.status;
		}

		function setStatus(status){
			this.status = status;
		}

		function getResults(){
			return this.results;
		}

		function getChanResults(){
			return this.chanResults;
		}

		function setResults(results){
			this.results = results;
		}

		function setChanResults(chanResults){
			this.chanResults = chanResults;
		}
	}

	// Used for saving past searches to the user's local storage (in the playlist/saved content section)
	function ytSearchHistory($q, ytModalGenerator, ytSearchParams, ytUtilities){
		let pastSearches = [];
		this.get = get;
		this.set = set;
		this.clearItem = clearItem;
		this.clearAll = clearAll;

		function get(){
			if(localStorage.length > 0){
				for(let key in localStorage){
					if(key.includes('uyts')){
						let obj = localStorage.getItem(key);
						obj = JSON.parse(obj);
						//Fix for searches with date, correcting format to be used in search. 
						if(obj.name){
							if(obj.after && obj.after !== null){
								obj.after = new Date(obj.after);
							}
							if(obj.before && obj.before !== null){
								obj.before = new Date(obj.before);
							}
							//This is here to avoid existent objects getting reappended to the array within the session when they shouldn't be
							if(ytUtilities().getIndexIfObjWithAttr(pastSearches, 'name', obj.name) === -1){
								pastSearches.push(obj);
							}
						}
					}
				}
			}
			return pastSearches;
		}

		function set(params, service){
			let searchSavedTemp = ytModalGenerator().getTemp('searchSavedTemp');
			ytModalGenerator().openModal(searchSavedTemp)
			.then((name) => {
				
				params.name = name;
				if(params.name === 'cancel'){
					// Aborted
				} else if(params.name){

					params.nameShrt = params.name;
					params.name = params.name+'-uyts';
					params.date = Date.now();
					pastSearches.push(params);
					localStorage.setItem(params.name, JSON.stringify(params));
				} else {
					service.set(params, service);
				}
			});
		}

		function clearItem(search, isWarnActive){
			let removedTemp = ytModalGenerator().getTemp('itemRemovedTemp');

			function initClear(){
				let searchIndex = pastSearches.indexOf(search);
				pastSearches.splice(searchIndex, 1);
				localStorage.removeItem(search.name);
			}

			if(isWarnActive){
				let warnTemp = ytModalGenerator().getTemp('warnTemp');
				ytModalGenerator().openModal(warnTemp)
				.then(()=> {
					initClear();
					ytModalGenerator().openModal(removedTemp);
				});
			} else {
				initClear();
				ytModalGenerator().openModal(removedTemp);
			}
		}

		function clearAll(){
			// Clears all past searches
			let deferred = $q.defer();
			let dangerTemp = ytModalGenerator().getTemp('dangerTemp');
			ytModalGenerator().openModal(dangerTemp)
			.then(() => {
				pastSearches = [];
				for(let key in localStorage){
					if(key.includes('uyts')){
						localStorage.removeItem(key);
					}
				}
				deferred.resolve(pastSearches);
			}, () => {
				deferred.reject();
			});
			return deferred.promise;
		}
	}

	// Firebase Version
	function ytSearchHistoryFB($q, ytModalGenerator, ytSearchParams, ytUtilities, ytFirebase){
		let pastSearches = null;
		this.init = init;
		this.get = get;
		this.set = set;
		this.clearItem = clearItem;
		this.clearAll = clearAll;

		function init(){
			if(ytFirebase.services.getCurrent()){
				var ref = ytFirebase.services.getCurrent();
				pastSearches = ytFirebase.services.getRefArray('savedSearches');
			}
		}

		function get(){
			return pastSearches;
		}

		function set(_params, service){
			let searchSavedTemp = ytModalGenerator().getTemp('searchSavedTemp');
			let params = Object.assign({}, _params);
			ytModalGenerator().openModal(searchSavedTemp)
			.then((name) => {
				params.name = name;
				if(params.name === 'cancel'){
					//Aborted
				} else if(params.name){
					for(var key in params){
						if(params[key] === undefined){
							params[key] = null;
						}
					}
					params.after = (params.after ? params.after.getTime() : null);
					params.before = (params.before ? params.before.getTime() : null);

					params.nameShrt = params.name;
					params.name = params.name+'-uyts';
					params.date = Date.now();
					pastSearches.$add(params)
					.then((ref)=>{
						ytFirebase.services.hotSave();
					});
				} else {
					service.set(params, service);
				}
			});
		}

		function clearItem(search, isWarnActive){
			let removedTemp = ytModalGenerator().getTemp('itemRemovedTemp');

			function initClear(){
				pastSearches.$remove(search)
				.then((ref) => {
					ytFirebase.services.hotSave();
				});
			}

			if(isWarnActive){
				let warnTemp = ytModalGenerator().getTemp('warnTemp');
				ytModalGenerator().openModal(warnTemp)
				.then(()=> {
					initClear();
					ytModalGenerator().openModal(removedTemp);
				});
			} else {
				initClear();
				ytModalGenerator().openModal(removedTemp);
			}
		}

		// Clears all past searches
		function clearAll(){
			let deferred = $q.defer();
			let dangerTemp = ytModalGenerator().getTemp('dangerTemp');
			ytModalGenerator().openModal(dangerTemp)
			.then(() => {
				var objRef = ytFirebase.services.getRefObj('savedSearches');
				objRef.$remove()
				.then(()=>{
					ytFirebase.services.hotSave();
					deferred.resolve(pastSearches);
				});
			}, () => {
				deferred.reject();
			});
			return deferred.promise;
		}
	}

	function ytUtilities(){
		return () => {
			let services = {
				getIndexIfObjWithAttr: getIndexIfObjWithAttr
			};

			function getIndexIfObjWithAttr(array, attr, value) {
				for(let i = 0; i < array.length; i++) {
					if(array[i][attr] === value) {
						return i;
					}
				}
				return -1;
			}

			return services;

		};
	}


	// A style tweak for the outer border of the results div. This will ensure thick borders all around, but in between each result, only thin borders (ngRepeat conflict)
	function ytComputeCssClass(){
		return (first, last) => {
			let val;
			if(first){
				val = 'first';
			} else if(last){
				val = 'last';
			} else {
				val = null;
			}
			return val;
		};
	}


	// Used on the bottom scroll button to scroll to the top of the results div
	function ytScrollTo($location, $anchorScroll){
		return (scrollLocation) => {
			let services = {
				scrollToElement: scrollToElement,
				checkScrollBtnStatus: checkScrollBtnStatus
			};

			return services;

			function scrollToElement(scrollLocation){
				$anchorScroll.yOffset = 70;
				let element = document.getElementById(scrollLocation);
				if(element){
					$anchorScroll(scrollLocation);
				} else {
					window.scroll(0,0);
				}
			}

			function checkScrollBtnStatus(){
				// if(window.scrollY > 100){
				// 	return true;
				// } else {
				// 	return false;
				// }
				return window.scrollY > 100;
			}	
		};
	}

	// Displays the scroll button (in results section) depending on appropriate conditions
	function ytCheckScrollBtnStatus($state){
		
		return () => {
			function checkVisible(elm) {
				let rect = elm.getBoundingClientRect();
				let viewHeight = Math.max(document.documentElement.clientHeight, window.innerHeight);
				return !(rect.bottom < 0 || rect.top - viewHeight >= -500);
			}

			function check(videos, channels){
				if($state.current.name === 'search'){
					if(videos.length > 0 || channels.length > 0){
						let elem = document.getElementById('results-container');
						let scrollTop = document.getElementsByClassName('scroll-top');
						if(checkVisible(elem)){
							return true;
						} else {
							return false;
						}
					} else {
						return false;
					}
				}
			}

			let services = {
				check: check
			};

			return services;
		};
	}

	// TODO: Refactor this to use ytCheckScrollY. Make ytCheckScrollY looser so it can be used in both situations
	function ytCheckScrollDir(){
		return () => {
			let services = {
				init: init,
				check: check,
				checkB
			};

			// Match cb's that will be used in each situation. Navbar will be hidden if user scrolls down OR if page loads in middle of screen.
			function check(scrollDownCB, scrollUpCB){
				let scroll = window.scrollY;
				window.addEventListener('scroll', () => {
					if(window.scrollY > scroll){
						scrollDownCB();
					} else {
						scrollUpCB();
					}
					scroll = window.scrollY;
				});
			}

			function checkB(){
				return window.scrollY === 0;
				
			}

			function init(scrolledCB, atTopCB){
				let scroll = window.scrollY;
				if(scroll > 0){
					scrolledCB();
				} else {
					atTopCB();
				}
				return scroll;
			}

			return services;
		};
	}


	// Checks to see if user scrolled down from top, so navbar style can change appropriately
	function ytCheckScrollY(){
		return () => {
			let services = {
				init: init
			};

			function init(callback){
				window.addEventListener('scroll', () => {
					if(window.scrollY === 0){
						callback(true);
					} else {
						callback(false);
					}
				}); 
			}

			return services;
		};
	}

	// Initializes the map used in the search section
	function ytInitMap(){
		return (callback) => {
			let map = new google.maps.Map(document.getElementById('map'), {
				center: {lat: 39, lng: -99},
				zoom: 4
			});

			let circle = new google.maps.Circle({
				center: {lat: 39, lng: -99},
				radius: 100000,
				editable: true,
				draggable: true
			});

			circle.setMap(map);
			circle.addListener('center_changed', () => {
				callback();
			});

			circle.addListener('radius_changed', () => {
				callback();
			});

			let services = {
				map: map,
				circle: circle
			};

			return services;
		};
	}

	// Handles all of the translation functionality used in the search section
	function ytTranslate($http, $q, ytModalGenerator, ytInitAPIs){

		let langs = [{
			label: 'None',
			value: ''
		}, {
			label: 'Arabic',
			value: 'ar'
		}, {
			label: 'Chinese',
			value: 'zh'
		}, {
			label: 'French',
			value: 'fr'
		}, {
			label: 'Hindi',
			value: 'hi'
		}, {
			label: 'Italian',
			value: 'it'
		}, {
			label: 'Japanese',
			value: 'ja'
		}, {
			label: 'Russian',
			value: 'ru'
		}, {
			label: 'Spanish',
			value: 'es'
		}];

		let errorModalObj = ytModalGenerator().getTemp('transTemp');
		

		function translate(text, lang){
			let apisObj = ytInitAPIs.apisObj;
			let url = 'https://translate.yandex.net/api/v1.5/tr.json/translate',
			request = {
				key: apisObj.translateKey,
				text: text,
				lang: 'en-'+lang
			};

			return $http({
				method: 'GET',
				url: url,
				params: request
			})
			.then((response) => {
				return $q.when(response);
			}, () => {
				ytModalGenerator().openModal(errorModalObj);
			});
		}

		function translateAll(tag, list){
			let deferred = $q.defer();
			let tagList = tag;
			let langArray = [];
			for(let lang in list){
				if(list[lang] != 'en' && list[lang]){
					langArray.push(list[lang]);
				}
			}
			let counter = langArray.length;

			if(langArray.length === 0){
				deferred.reject('No translations were necessary.');
			}

			for(let i = 0; i<langArray.length; i++){
				translate(tag, langArray[i]).then((response) => {
					tagList += ', '+response.data.text[0]+', ';
					counter--;
					if(counter <= 0){
						deferred.resolve(tagList);
					}
				});
			}

			return deferred.promise;
		}

		this.langs = langs;
		this.translate = translate;
		this.translateAll = translateAll;
	}

	// Handles the result sorting in the search section
	function ytSortOrder(){
		let sortObj = {
			predicate: undefined,
			reverse: false
		};

		this.videosReverse = false;
		this.order = order;
		this.get = get;

		function order(current, _predicate) {
			sortObj.reverse = (_predicate === current) ? !reverse : false;
			sortObj.predicate = _predicate;
			return sortObj;
		}

		function get(){
			return sortObj;
		}
	}

	// Keeps track of collapsed/expanded sections in saved/playlist section
	function ytPlaylistView(){
		this.obj = {
			videosCollapsed: true,
			searchesCollapsed: true,
			videosSortCollapsed: true,
			videosFilterCollapsed: true,
			searchesSortCollapsed: true,
			searchesFilterCollapsed: true
		};

		this.get = get;

		function get(){
			return this.obj;
		}
	}

	// Handles the saved videos and searches sorting in the saved content section 
	function ytPlaylistSort(ytSettings){
		// Grab object containing sort settings, either from localStorage, or default
		let obj = ytSettings.getSortOpts();
		this.videos = obj.videos;

		this.searches = obj.searches;

		
		this.order = order;
		this.get = get;

		function order(current, _predicate, type) {
			type.reverse = (_predicate === current) ? !type.reverse : false;
			type.predicate = _predicate;
			let sortObj = {
				reverse: type.reverse,
				predicate: type.predicate
			};
			return sortObj;
		}

		function get(){
			return sortObj;
		}
	}

	// Handles the filtering functionality of the saved content in the saved content section
	function ytFilters(ytDateHandler){
		return () => {
			let services = {
				addedAfterVideos: addedAfterVideos,
				addedBeforeVideos: addedBeforeVideos,
				addedAfterSearches: addedAfterSearches,
				addedBeforeSearches: addedBeforeSearches
			};

			return services;

			function addedAfterVideos(item, filter){
				let bool;
				if(filter && filter.addedAfter){
					if(item.dateAdded){
						let dateAdded = parseInt(moment(ytDateHandler().getDate(item.dateAdded, 'M/D/YYYY')).format('X'), 10),
							after = parseInt(moment(ytDateHandler().getDate(filter.addedAfter, 'M/D/YYYY')).format('X'), 10);
						bool = (dateAdded >= after);
					} else {
						bool = false;
					}
				} else {
					bool = true;
				}
				return bool;
			}

			function addedBeforeVideos(video, videoFilter){
				let bool;
				if(videoFilter && videoFilter.addedBefore){
					if(video.dateAdded){
						let dateAdded = parseInt(moment(ytDateHandler().getDate(video.dateAdded, 'M/D/YYYY')).format('X'), 10),
							before = parseInt(moment(ytDateHandler().getDate(videoFilter.addedBefore, 'M/D/YYYY')).format('X'), 10);
						bool = (dateAdded < before);
					} else {
						bool = false;
					}
				} else {
					bool = true;
				}
				return bool;
			}

			function addedAfterSearches(item, filter){
				let bool;
				if(filter && filter.addedAfter){
					let dateAdded = parseInt(moment(ytDateHandler().getDate(item.date, 'M/D/YYYY')).format('X'), 10),
					after = parseInt(moment(ytDateHandler().getDate(filter.addedAfter, 'M/D/YYYY')).format('X'), 10);
					bool = (dateAdded >= after);
				} else {
					bool = true;
				}
				return bool;
			}

			function addedBeforeSearches(item, filter){
				let bool;
				if(filter && filter.addedBefore){
					let dateAdded = parseInt(moment(ytDateHandler().getDate(item.date, 'M/D/YYYY')).format('X'), 10),
					before = parseInt(moment(ytDateHandler().getDate(filter.addedBefore, 'M/D/YYYY')).format('X'), 10);
					bool = (dateAdded < before);
				} else {
					bool = true;
				}
				return bool;
			}
		};
	}

	function ytModalGenerator($q, $uibModal){
		return () => {
			let services = {
				openModal: openModal,
				getTemp: getTemp
			};

			let newSegTemp = {
				templateUrl: './partials/playlist/playlist-partials/modals/new-seg-modal.html',
				controller: 'AlertModalController',
				controllerAs: 'alertModal'
			};

			let searchTemp = {
				templateUrl: './partials/search/search-partials/modals/error-modal.html',
				controller: 'ErrorModalController',
				controllerAs: 'errorModal'
			};

			let searchSavedTemp = {
				templateUrl: './partials/search/search-partials/modals/search-saved-modal.html',
				controller: 'SearchSavedModalController',
				controllerAs: 'searchModal'
			};

			let videoTemp = {
				templateUrl: './partials/video/video-partials/modals/error-modal.html',
				controller: 'ErrorModalController',
				controllerAs: 'errorModal'
			};

			let transTemp = {
				templateUrl: './partials/search/search-partials/modals/translate-error-modal.html',
				controller: 'ErrorModalController',
				controllerAs: 'errorModal'
			};

			let warnTemp = {
				templateUrl: './partials/playlist/playlist-partials/modals/warn-modal.html',
				controller: 'DangerModalController',
				controllerAs: 'dangerModal'
			};

			let itemRemovedTemp = {
				templateUrl: './partials/playlist/playlist-partials/modals/item-removed-modal.html',
				controller: 'ItemRemovedModalController',
				controllerAs: 'removedModal'
			};

			let dangerTemp = {
				templateUrl: './partials/playlist/playlist-partials/modals/danger-modal.html',
				controller: 'DangerModalController',
				controllerAs: 'dangerModal'
			};

			let errorVideoExistsTemp = {
				templateUrl: './partials/search/search-partials/modals/error-video-exists-modal.html',
				controller: 'ErrorModalController',
				controllerAs: 'errorModal'
			};

			let initFirebaseTemp = {
				templateUrl: './partials/playlist/playlist-partials/modals/init-firebase-modal.html',
				controller: 'InitFirebaseModalController',
				controllerAs: 'initFirebaseModal'
			};

			let storageSettingsTemp = {
				templateUrl: './partials/playlist/playlist-partials/modals/storage-settings-modal.html',
				controller: 'StorageSettingsModalController',
				controllerAs: 'storageSettingsModal'
			};

			let temps = {
				newSegTemp: newSegTemp,
				searchTemp: searchTemp,
				searchSavedTemp: searchSavedTemp,
				videoTemp: videoTemp,
				transTemp: transTemp,
				warnTemp: warnTemp,
				itemRemovedTemp: itemRemovedTemp,
				dangerTemp: dangerTemp,
				errorVideoExistsTemp: errorVideoExistsTemp,
				initFirebaseTemp: initFirebaseTemp,
				storageSettingsTemp: storageSettingsTemp
			};

			function openModal(modalObj){
				let deferred = $q.defer();
				let modalInstance = $uibModal.open({
					templateUrl: modalObj.templateUrl,
					controller: modalObj.controller,
					controllerAs: modalObj.controllerAs
				});

				modalInstance.result.then((result) => {
					deferred.resolve(result);
				}, (error) => {
					deferred.reject(error);
				});

				return deferred.promise;
			}

			function getTemp(temp){
				return temps[temp];
			}

			return services;
		};
	}

	// For cross-browser compatibility, this will convert a stringified date into a date object. Date inputs don't exist in certain browsers such as Firefox, so we use Moment.js to create our own object to be used.
	function ytDateHandler(){
		return () => {

			let services = {
				check: check,
				getDate: getDate
			};

			function getDate(date, format){
				return (typeof date === 'string') ? moment(date, format)._d : date;
			}

			function check(){
				let supported = {date: false, number: false, time: false, month: false, week: false},
				tester = document.createElement('input');

				tester.type = 'date';

				if(tester.type === 'date'){
					return true;
				} else {
					return false;
				}
			}

			return services;
		};
	}

	function ytInitAPIs($http, $q, ytModalGenerator){

		this.init = init;
		this.initKeys = initKeys;
		this.updateMapsScript = updateMapsScript;

		function init(){
			let deferred = $q.defer();
			initKeys()
			.then((data)=> {
				this.apisObj = data;
				updateDOM(this.apisObj.googKey);
				this.apisObj.fBaseDB = localStorage['uyt-fBaseDB'] ? JSON.parse(localStorage['uyt-fBaseDB']) : this.apisObj.fBaseDB;
				deferred.resolve();
			});

			return deferred.promise;
		}

		function initKeys(){
			return $http.get('/access')
					.then((res) => {
						return res.data;
					});
		}

		function updateDOM(key){
			if(key){
				updateMaps(key);
			} else {
				updateMaps('');
			}
		}

		// Construct url with saved Google Maps API key, then run loadScript()
		function updateMaps(key){
			let src = 'https://maps.googleapis.com/maps/api/js?key='+key;
			loadScript(src)
			.then(() => {
				// Success
			}, ()=> {
				// Error
			});

		}

		// Appends a script tag
		function loadScript(src) {
			return new Promise((resolve, reject) => {
				let s;
				s = document.createElement('script');

				s.src = src;
				s.async = "async";
				s.onload = resolve;
				s.onerror = reject;
				document.body.appendChild(s);
			});
		}

		function updateMapsScript(key) {
			let t = document.getElementsByTagName('script')[0];
			t.src = 'https://maps.googleapis.com/maps/api/js?key='+key;
		}
	}
	
	// The API key for the Firebase database **itself** will be stored in the user's local storage. 
	function ytFirebase(ytModalGenerator, ytInitAPIs, $q, $state, $firebaseArray, $firebaseObject){
		let services = {
			save: save,
			init: init,
			initApp: initApp,
			grabCluster: grabCluster,
			checkValid: checkValid,
			getReference: getReference,
			getCurrent: getCurrent,
			getRefObj: getRefObj,
			getRefArray: getRefArray,
			getCredObj: getCredObj,
			getSegName: getSegName,
			hotSave: hotSave,
			isLoggedIn: isLoggedIn,
			canUseFBase: canUseFBase,
			addCreds: addCreds,
			clearCreds: clearCreds
		};

		let list = null,
			current = null,
			currentObj = null,
			canUse = false,
			loggedIn = false,
			credObj = null;

		function save(){
			let initFirebaseTemp = ytModalGenerator().getTemp('initFirebaseTemp');
			ytModalGenerator().openModal(initFirebaseTemp)
			.then((obj) => {
				if(obj){
					addCreds(obj);
				} else {
					clearCreds();
				}
			});
		}

		function init(){
			if(ytInitAPIs.apisObj.googKey &&
			ytInitAPIs.apisObj.fBaseDB){
				if(localStorage['uyt-firebase']){
					credObj = JSON.parse(localStorage['uyt-firebase']);
					loggedIn = true;
				}
				
				initApp(credObj);
			} 
			
		}

		function initApp(_credObj){
				let config = {
					apiKey: ytInitAPIs.apisObj.googKey,
					authDomain: ytInitAPIs.apisObj.fBaseDB+'.firebaseapp.com',
					databaseURL: 'https://'+ytInitAPIs.apisObj.fBaseDB+'.firebaseio.com/',
					storageBucket: ytInitAPIs.apisObj.fBaseDB+'.appspot.com'
				};
				firebase.initializeApp(config);

				// Whether or not we're 'logged in', this lets us know that we're at least connected to FBase
				canUse = true;
				// This would occur when we already have our firebase creds stored in our localStorage. This means the creds we have are legit - we are locked into a cluster with the correct password.
				if(_credObj){
					grabCluster(_credObj);
				}
			
		}

		// Lets the app know which cluster the user will be assigned to. This will run assuming the app is already initialized
		function grabCluster(_credObj){
			let deferred = $q.defer();
			current = getReference(_credObj.username);
			currentObj = $firebaseObject(current);
			currentObj.$loaded()
			.then((data)=>{
				deferred.resolve();
			});

			return deferred.promise;

		}

		function checkValid(obj,res,err){
			if(currentObj.password){
				if(currentObj.password !== obj.password){
					err();
				} else {
					res();
				}
				
			} else {
				currentObj.username = obj.username;
				currentObj.password = obj.password;
				currentObj.$save()
				.then((ref)=>{
					let newSegTemp = ytModalGenerator().getTemp('newSegTemp');

					// Here we can prompt user that a new cluster has been made, using modal
					ytModalGenerator().openModal(newSegTemp)
					.then(()=>{
						res();
					});
				});
			}
		}

		function getReference(child){
			return new firebase.database().ref(child);
		}

		function getRefObj(child) {
			let ref = current.child(child);
			return $firebaseObject(ref);
		}

		// We will convert our lists (savedVideos, savedSearches) into arrays
		// We may just use 'current' since that is our saved user object that we'll only be interacting with anyways
		function getRefArray(child) {
			var refChild = current.child(child);
			return $firebaseArray(refChild);
		}

		function getCredObj(){
			return credObj;
		}

		function getSegName(){
			return credObj ? credObj.username : null;
		}

		//On app load, we will have a reference to the user's Firebase partition, stored in 'current'
		function getCurrent() {
			return current;
		}

		function hotSave() {
			currentObj.$save();
		}

		function isLoggedIn(){
			return loggedIn;
		}

		function canUseFBase(){
			return canUse;
		}

		function addCreds(obj){
			var string = JSON.stringify(obj);
			localStorage.setItem('uyt-firebase', string);
			location.reload();
		}

		function clearCreds(){
			localStorage.removeItem('uyt-firebase');
			location.reload();
		}

		this.services = services;

	}

	function ytSettings($q, ytInitAPIs, ytFirebase, ytModalGenerator){

		let storageSettingsTemp = ytModalGenerator().getTemp('storageSettingsTemp');

		this.warnActive = getWarn();

		this.handleStorageSettings = handleStorageSettings;

		this.getWarn = getWarn;
		this.setWarn = setWarn;
		this.getSortOpts = getSortOpts;
		this.setSortOpts = setSortOpts;
		this.getVideoFilter = getVideoFilter;
		this.setVideoFilter = setVideoFilter;
		this.getSearchFilter = getSearchFilter;
		this.setSearchFilter = setSearchFilter;

		function handleStorageSettings(){
			// Saving instance of this.
			let self = this;
			let deferred = $q.defer();

			ytModalGenerator().openModal(storageSettingsTemp)
			.then((res) => {

				// Running setWarn from service object allows function to access it as 'this' so it can access service properties. This wasn't an issue until we minified code, so for builds, this seems to be necessary for now.
				self.setWarn(res.warnVal);
				
				if(res.setDefault){
					setFBaseDB('second-app-afad9');
					location.reload();
				} else if(res.fBaseDB){
					setFBaseDB(res.fBaseDB);	
				}

				if(res.setDefault || res.fBaseDB){
					// Automatically clear saved creds when switching to a different database.
					ytFirebase.services.clearCreds();
				}
				deferred.resolve(res);
			},(err)=>{
				deferred.reject();
			});

			return deferred.promise;
		}

		function getWarn(){
			if(localStorage['uyt-warn']){
				return JSON.parse(localStorage['uyt-warn']);
			} else {
				return true;
			}
		}

		function setWarn(val){
			localStorage.setItem('uyt-warn', JSON.stringify(val));
			this.warnActive = this.getWarn();
		}

		function setFBaseDB(val){
			localStorage.setItem('uyt-fBaseDB', JSON.stringify(val));
		}

		function getSortOpts(){
			if(localStorage['uyt-sort-opts']){
				return JSON.parse(localStorage['uyt-sort-opts']);
			} else {
				return {
					videos: {
						predicate: 'snippet.title',
						reverse: false
					},
					searches: {
						predicate: 'name',
						reverse: false
					}
				};
			}
		}

		function setSortOpts(obj){
			localStorage.setItem('uyt-sort-opts', JSON.stringify(obj));
		}

		function getVideoFilter(){
			if(localStorage['uyt-video-filter']){
				let dateObj = JSON.parse(localStorage['uyt-video-filter']);

				// Create a moment from around 2005, and check each date obj to make sure it's after this moment. Otherwise set to null. This is to combat partially typed dates being converted to arbitrary old years.
				let turnPoint = moment('02-01-2005', 'MM-DD-YYYY');

				if(dateObj.addedAfter){
					//Convert to date object using service/moment.js
					let momentObj = moment(dateObj.addedAfter);

					//If date obj is past turning point, pass it thru. If not, null.
					dateObj.addedAfter = momentObj > turnPoint ? moment(dateObj.addedAfter)._d : null;
				}
				if(dateObj.addedBefore){
					let momentObj = moment(dateObj.addedBefore);
					dateObj.addedBefore = momentObj > turnPoint ? moment(dateObj.addedBefore)._d : null;
				}

				return dateObj;

			} else {
				return {
					keyword: '',
					addedAfter: null,
					addedBefore: null
				};
			}
		}

		function setVideoFilter(obj){
			localStorage.setItem('uyt-video-filter', JSON.stringify(obj));
		}

		function getSearchFilter(){
			if(localStorage['uyt-search-filter']){
				let dateObj = JSON.parse(localStorage['uyt-search-filter']);

				let turnPoint = moment('02-01-2005', 'MM-DD-YYYY');

				if(dateObj.addedAfter){
					let momentObj = moment(dateObj.addedAfter);
					dateObj.addedAfter = momentObj > turnPoint ? moment(dateObj.addedAfter)._d : null;
				}
				if(dateObj.addedBefore){
					let momentObj = moment(dateObj.addedBefore);
					dateObj.addedBefore = momentObj > turnPoint ? moment(dateObj.addedBefore)._d : null;
				}

				return dateObj;

			} else {
				return {
					keyword: '',
					addedAfter: null,
					addedBefore: null
				};
			}
		}

		function setSearchFilter(obj){
			localStorage.setItem('uyt-search-filter', JSON.stringify(obj));
		}
	}

	function ytFocus($timeout, $window) {
		return function(id) {
      // timeout makes sure that it is invoked after any other event has been triggered.
      // e.g. click events that need to run before the focus or
      // inputs elements that are in a disabled state but are enabled when those events
      // are triggered.
      $timeout(function() {
        var element = $window.document.getElementById(id);
        if(element)
          element.focus({preventScroll: true});
      });
    };
	}




})();





