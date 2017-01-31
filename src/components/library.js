(function(){
	angular
	.module('myApp')
	.factory('ytTrustSrc', ['$sce', ytTrustSrc])
	.factory('ytSearchYouTube', ['$q', '$http', 'ytChanSearch', 'ytTranslate', 'ytModalGenerator', 'ytDateHandler', 'ytInitAPIs', ytSearchYouTube])
	.factory('ytChanSearch', ['$q', '$http', 'ytModalGenerator', 'ytInitAPIs', ytChanSearch])
	.factory('ytCurrentVideo', ['$q', '$http', 'ytModalGenerator', 'ytInitAPIs', ytCurrentVideo])
	.factory('ytCurrentChannel', ['$q', '$http', 'ytModalGenerator', 'ytInitAPIs', ytCurrentChannel])
	.factory('ytComputeCssClass', [ytComputeCssClass])
	.factory('ytScrollTo', ['$location', '$anchorScroll', ytScrollTo])
	.factory('ytCheckScrollBtnStatus', ['$state', ytCheckScrollBtnStatus])
	.factory('ytCheckScrollY', [ytCheckScrollY])
	.factory('ytInitMap', [ytInitMap])
	.factory('ytFilters', ['ytDateHandler', ytFilters])
	.factory('ytSearchSavedModal', ['$q', '$uibModal', ytSearchSavedModal])
	.factory('ytDangerModal', ['$q', '$uibModal', ytDangerModal])
	.factory('ytErrorModal', ['ytModalGenerator', ytErrorModal])
	.factory('ytModalGenerator', ['$q', '$uibModal', ytModalGenerator])
	.factory('ytDateHandler', [ytDateHandler])
	.factory('ytUtilities', [ytUtilities])
	.service('ytChanFilter', [ytChanFilter])
	.service('ytSearchParams', ['ytTranslate', ytSearchParams])
	.service('ytResults', [ytResults])
	.service('ytVideoItems', ['$q', '$state', '$stateParams',  'ytDangerModal', 'ytUtilities', ytVideoItems])
	.service('ytSearchHistory', ['$q', 'ytSearchSavedModal', 'ytDangerModal', 'ytSearchParams', 'ytUtilities', ytSearchHistory])
	.service('ytTranslate', ['$http', '$q', 'ytModalGenerator', 'ytInitAPIs', ytTranslate])
	.service('ytSortOrder', [ytSortOrder])
	.service('ytPlaylistView', [ytPlaylistView])
	.service('ytPlaylistSort', [ytPlaylistSort])
	.service('ytInitAPIs', ['$q', 'ytModalGenerator', ytInitAPIs]);

	//Used to follow security measures with YouTube video links in particular 
	function ytTrustSrc($sce){
		return function(src){
			return $sce.trustAsResourceUrl(src);
		}
	}

	//Searches the API for videos based on search params
	function ytSearchYouTube($q, $http, ytChanSearch, ytTranslate, ytModalGenerator, ytDateHandler, ytInitAPIs) {
		return function(params, pageToken, direction){
			
			// Ensures that we take the previously searched keyword during page navigation.
			var query = (pageToken ? params.searchedKeyword : params.keyword);
			var url = 'https://www.googleapis.com/youtube/v3/search';
			var apisObj = ytInitAPIs.apisObj;
			console.log(apisObj);

			//Moment.js parsing
			var parsedAfter = (params.after ? ytDateHandler().getDate(params.after, 'M/D/YYYY') : undefined),
			parsedBefore = (params.before ? ytDateHandler().getDate(params.before, 'M/D/YYYY') : undefined);

			var request = {
				key: apisObj.youTubeKey,
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

			var errorModalObj = ytModalGenerator().getSearchTemp();

			var services = {
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
				.then(function(response){
					return $q.when(response);
				},
				function(response){
					ytModalGenerator().openModal(errorModalObj);
				});
			}

			//Checks to see if a language to which the query should be translated is selected
			function checkTrans(_keyword_, _lang_){
				var deferred = $q.defer();
				if(_lang_){
					ytTranslate.translate(_keyword_, _lang_)
					.then(function(response){
						deferred.resolve(response.data.text[0]);
					});
				} else {
					deferred.resolve(_keyword_)
				}
				return deferred.promise;
			}
			//Translates query if necessary, then runs search
			function transAndResults(){
				var deferred = $q.defer();
				checkTrans(query, params.lang.value).then(function(response){
					request.q = response;
					getResults().then(function(response){
						deferred.resolve(response);
					});
				});
				return deferred.promise;
			}

			function search(){
				var deferred = $q.defer();
				if(params.searchType === 'video'){
					transAndResults()
					.then(function(response){
						// Value created to display page number in view
						response.pageDirection = direction;

						deferred.resolve(response);
					});
				} else {
					ytChanSearch(query).getResults()
					.then(function(response){
						deferred.resolve(response);
					});
				}
				return deferred.promise;
			}
		}
	};

	//Searches the API for channels based on search query
	function ytChanSearch($q, $http, ytModalGenerator, ytInitAPIs){
		return function(channel){
			var url = 'https://www.googleapis.com/youtube/v3/search';
			var request = {
				key: ytInitAPIs.apisObj.youTubeKey,
				part: 'snippet',
				maxResults: 50,
				order: 'relevance',
				q: channel,
				type: 'channel'
			};

			var errorModalObj = ytModalGenerator().getSearchTemp();

			var services = {
				getResults: getResults
			};

			return services;

			function getResults(){
				return $http({
					method: 'GET',
					url: url,
					params: request
				})
				.then(function(response){
					var results = response;
					return $q.when(response);
				},
				function(response){
					ytModalGenerator().openModal(errorModalObj);
				});
			}
		}
	}

	//Filters a video search by channel
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
		return function(id){
			var url = 'https://www.googleapis.com/youtube/v3/videos',
			request = {
				key: ytInitAPIs.apisObj.youTubeKey,
				part: 'snippet, contentDetails',
				//contentDetails contains the duration property.
				id: id
			},
			errorModalObj = ytModalGenerator().getVideoTemp(),

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
				.then(function(response){
					return $q.when(response);
				},
				function(response){
					ytModalGenerator().openModal(errorModalObj);
				});	
			}	
		}
	}

	//Used to get back a video's channel data (which requires a different call from ytCurrentVideo)
	function ytCurrentChannel($q, $http, ytModalGenerator, ytInitAPIs){
		return function(id){
			var url = "https://www.googleapis.com/youtube/v3/channels",
			request = {
				key: ytInitAPIs.apisObj.youTubeKey,
				part: 'snippet',
				id: id
			},
			errorModalObj = ytModalGenerator().getVideoTemp(),

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
				.then(function(response){
					return $q.when(response);
				},
				function(response){
					ytModalGenerator().openModal(errorModalObj);
				});	
			}	
		}
	}

	//Used for saving videos to the user's local storage (in the playlist/saved content section)
	function ytVideoItems($q, $state, $stateParams, ytDangerModal, ytUtilities){
		var currentVideoId = $stateParams.videoId;
		var items = [];

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

		function init(){
			if(localStorage.length){
				for(key in localStorage){
					if(key.includes('uytp')){
						var obj = JSON.parse(localStorage[key]);
						delete obj.$$hashKey;
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
			var itemName = result.snippet.title+'-uytp',
			dateAdded = Date.now(),
			content = result;
			
			content.dateAdded = dateAdded;
			content.codeName = itemName;

			items.push(content);

			content = JSON.stringify(content);

			localStorage.setItem(itemName, content);

		}

		function clearItem(codeName, item){

			if(codeName){ //This would take place in the playlist section
				localStorage.removeItem(codeName);
			} else if(item) { //This would take place in the video section.
				items.forEach(function(_item_){
					if(_item_.id.videoId === item.id){
						var current = _item_;
						//Remove both from localStorage and items array within this service. In playlist section, this is done implicitly.
						localStorage.removeItem(current.codeName);
						var currentIndex = items.indexOf(current);
						items.splice(currentIndex, 1);
					};
				});
				

			}
			
		}

		//TODO: improve logic
		function clearAllItems(){
			var deferred = $q.defer();
			ytDangerModal().openModal()
			.then(function(){
				items = [];
				for(key in localStorage){
					if(key.includes('uytp')){
						localStorage.removeItem(key);
					}
				}

				deferred.resolve(items);
			}, function(){
				deferred.reject();
			});

			return deferred.promise;
		}

		//Check url params when loading page in video player state
		function getVideoId(){
			return currentVideoId;
		}

		function setVideoId(videoId){
			currentVideoId = videoId;
		}

		//Check if video item is saved()
		function isSaved(id){
			var bool;
			if(items.length){
				items.forEach(function(_item_){
					if(_item_.id.videoId === id){
						bool = true;
					};
				});
			}

			return bool;
		}

	};

	//Where saved search params are stored (so while switching views/controllers, changes in search params will be kept)
	function ytSearchParams(ytTranslate){
		var params = {
			keyword: undefined,
			searchedKeyword: undefined,
			searchType: 'video',
			channel: undefined,
			channelId: undefined,
			image: undefined,
			order: 'relevance',
			after: undefined,
			before: undefined,
			safeSearch: undefined,
			location: undefined,
			locationRadius: undefined,
			lat: undefined,
			lng: undefined,
			radius: undefined,
			currentPage: undefined,
			prevPageToken: undefined,
			nextPageToken: undefined,
			name: undefined,
			date: undefined,
			lang: ytTranslate.langs[0]
		};

		var searchTypePrev = 'video';

		//This is used for page traversal. We store the previous search params. That way, we can adjust/update the queries all we want, and grab new page tokens from the last search all we want.
		var paramsPrev = {};

		var original = Object.assign({}, params);

		var currentPage = 1;

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
			for(var item in params){
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
				for(key in _params_){
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
			for(key in params){
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
		}
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

	//Used for saving past searches to the user's local storage (in the playlist/saved content section)
	function ytSearchHistory($q, ytSearchSavedModal, ytDangerModal, ytSearchParams, ytUtilities){
		var pastSearches = [];
		this.get = get;
		this.set = set;
		this.clearItem = clearItem;
		this.clearAll = clearAll;

		function get(){
			if(localStorage.length > 0){
				for(key in localStorage){
					if(key.includes('uyts')){
						var obj = localStorage.getItem(key);
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
			ytSearchSavedModal().openModal()
			.then(function(name){
				params.name = name;
				if(params.name === 'cancel'){
					//Aborted
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

		function clearItem(search){
			var searchIndex = pastSearches.indexOf(search);
			pastSearches.splice(searchIndex, 1);
			localStorage.removeItem(search.name);
		}

		function clearAll(){
			//Clears all past searches
			var deferred = $q.defer();
			ytDangerModal().openModal()
			.then(function(){
				pastSearches = [];
				for(key in localStorage){
					if(key.includes('uyts')){
						localStorage.removeItem(key);
					}
				}
				deferred.resolve(pastSearches);
			}, function(){
				deferred.reject();
			})
			return deferred.promise;
		}
	}

	function ytUtilities(){
		return function(){
			var services = {
				getIndexIfObjWithAttr: getIndexIfObjWithAttr
			};

			function getIndexIfObjWithAttr(array, attr, value) {
				for(var i = 0; i < array.length; i++) {
					if(array[i][attr] === value) {
						return i;
					}
				}
				return -1;
			}

			return services;

		}
	}

	//A style tweak for the outer border of the results div. This will ensure thick borders all around, but in between each result, only thin borders (ngRepeat conflict)
	function ytComputeCssClass(){
		return function(first, last){
			var val;
			if(first){
				val = 'first';
			} else if(last){
				val = 'last';
			} else {
				val = null;
			}
			return val;
		}
	}

	//Used on the bottom scroll button to scroll to the top of the results div
	function ytScrollTo($location, $anchorScroll){
		return function(scrollLocation){
			var services = {
				scrollToElement: scrollToElement,
				checkScrollBtnStatus: checkScrollBtnStatus
			}

			return services;

			function scrollToElement(scrollLocation){
				$anchorScroll.yOffset = 70;
				var element = document.getElementById(scrollLocation);
				if(element){
					$location.hash(scrollLocation);
					$anchorScroll();
				} else {
					window.scroll(0, 0);
				}
			}

			function checkScrollBtnStatus(){
				if(window.scrollY > 100){
					return true;
				} else {
					return false;
				}
			}	
		}
	}

	function ytCheckScrollBtnStatus($state){
		
		return function(){
			function checkVisible(elm) {
				var rect = elm.getBoundingClientRect();
				var viewHeight = Math.max(document.documentElement.clientHeight, window.innerHeight);
				return !(rect.bottom < 0 || rect.top - viewHeight >= -500);
			}

			function check(videos, channels){
				if($state.current.name === 'search'){
					if(videos.length > 0 || channels.length > 0){
						var elem = document.getElementById('results-container');
						var scrollTop = document.getElementsByClassName('scroll-top');
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

			var services = {
				check: check
			}

			return services;
		}
	}

	function ytCheckScrollY(){
		return function(){
			var services = {
				init: init
			};

			function init(callback){
				window.addEventListener('scroll', function(){
					if(window.scrollY === 0){
						callback(true);
					} else {
						callback(false);
					}
				}); 
			}

			return services;
		}
	}

	//Initializes the map used in the search section
	function ytInitMap(){
		return function(callback){
			var map = new google.maps.Map(document.getElementById('map'), {
				center: {lat: 39, lng: -99},
				zoom: 4
			});

			var circle = new google.maps.Circle({
				center: {lat: 39, lng: -99},
				radius: 100000,
				editable: true,
				draggable: true
			});

			circle.setMap(map);
			circle.addListener('center_changed', function(){
				callback();
			});

			circle.addListener('radius_changed', function(){
				callback();
			});

			var services = {
				map: map,
				circle: circle
			}

			return services;
		}
	}

	//Handles all of the translation functionality used in the search section
	function ytTranslate($http, $q, ytModalGenerator, ytInitAPIs){

		var langs = [{
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

		var errorModalObj = ytModalGenerator().getTransTemp();
		

		function translate(text, lang){
			var apisObj = ytInitAPIs.apisObj;
			console.log('in translate service', apisObj);
			var url = 'https://translate.yandex.net/api/v1.5/tr.json/translate',
			request = {
				key: apisObj.translateKey,
				// key: 'trnsl.1.1.20160728T161850Z.60e012cb689f9dfd.6f8cd99e32d858950d047eaffecf930701d73a38',
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
			var deferred = $q.defer();
			var tagList = tag;
			var langArray = [];
			for(lang in list){
				if(list[lang] != 'en' && list[lang]){
					langArray.push(list[lang]);
				}
			}
			var counter = langArray.length;

			if(langArray.length === 0){
				deferred.reject('No translations were necessary.');
			}

			for(var i = 0; i<langArray.length; i++){
				translate(tag, langArray[i]).then(function(response){
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

	//Handles the result sorting in the search section
	function ytSortOrder(){
		var sortObj = {
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

	//Keeps track of collapsed/expanded sections in saved/playlist section
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

	//Handles the saved videos and searches sorting in the saved content section 
	function ytPlaylistSort(){
		this.videos = {
			reverse: false,
			predicate: '$$hashKey'
		};

		this.searches = {
			reverse: false,
			predicate: '$$hashKey'
		};
		//Name
		this.order = order;
		this.get = get;

		function order(current, _predicate, type) {
			type.reverse = (_predicate === current) ? !type.reverse : false;
			type.predicate = _predicate;
			var sortObj = {
				reverse: type.reverse,
				predicate: type.predicate
			}
			return sortObj;
		}

		function get(){
			return sortObj;
		}
	}

	//Handles the filtering functionality of the saved content in the saved content section
	function ytFilters(ytDateHandler){
		return function(){
			var services = {
				addedAfterVideos: addedAfterVideos,
				addedBeforeVideos: addedBeforeVideos,
				addedAfterSearches: addedAfterSearches,
				addedBeforeSearches: addedBeforeSearches
			};

			return services;

			function addedAfterVideos(item, filter){
				var bool;
				if(filter && filter.addedAfter){
					if(item.dateAdded){
						var dateAdded = parseInt(moment(ytDateHandler().getDate(item.dateAdded, 'M/D/YYYY')).format('X'), 10),
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
				var bool;
				if(videoFilter && videoFilter.addedBefore){
					if(video.dateAdded){
						var dateAdded = parseInt(moment(ytDateHandler().getDate(video.dateAdded, 'M/D/YYYY')).format('X'), 10),
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
				var bool;
				if(filter && filter.addedAfter){
					var dateAdded = parseInt(moment(ytDateHandler().getDate(item.date, 'M/D/YYYY')).format('X'), 10),
					after = parseInt(moment(ytDateHandler().getDate(filter.addedAfter, 'M/D/YYYY')).format('X'), 10);
					bool = (dateAdded >= after);
				} else {
					bool = true;
				}
				return bool;
			}

			function addedBeforeSearches(item, filter){
				var bool;
				if(filter && filter.addedBefore){
					var dateAdded = parseInt(moment(ytDateHandler().getDate(item.date, 'M/D/YYYY')).format('X'), 10),
					before = parseInt(moment(ytDateHandler().getDate(filter.addedBefore, 'M/D/YYYY')).format('X'), 10);
					bool = (dateAdded < before);
				} else {
					bool = true;
				}
				return bool;
			}
		}
	}

	function ytSearchSavedModal($q, $uibModal){
		return function(){
			var services = {
				openModal: openModal
			};

			function openModal(){
				var deferred = $q.defer();
				var modalInstance = $uibModal.open({
					templateUrl: './partials/search/search-partials/modals/search-saved-modal.html',
					controller: 'SearchSavedModalController',
					controllerAs: 'searchModal'
				});

				modalInstance.result.then(function(result){
					deferred.resolve(result);
				}, function(error){
					deferred.resolve(error);
				});

				return deferred.promise;
			}

			return services;
		}
	}

	function ytDangerModal($q, $uibModal){
		return function(){
			var services = {
				openModal: openModal
			};

			function openModal(){
				var deferred = $q.defer();
				var modalInstance = $uibModal.open({
					templateUrl: './partials/playlist/playlist-partials/modals/danger-modal.html',
					controller: 'DangerModalController',
					controllerAs: 'dangerModal'
				});

				modalInstance.result.then(function(){
					deferred.resolve();
				}, function(error){
					deferred.reject(error);
				});

				return deferred.promise;
			}

			return services;
		}
	}

	function ytErrorModal($q, ytModalGenerator){
		return function(){
			var services = {
				openModal: openModal
			},
			modalObj = {
				url: './partials/search/search-partials/modals/error-modal.html',
				ctrl: 'ErrorModalController',
				ctrlAs: 'errorModal'
			};

			function openModal(){
				ytModalGenerator().openModal(modalObj);
			}

			return services;
		}
	}

	function ytModalGenerator($q, $uibModal){
		return function(){
			var services = {
				openModal: openModal,
				getSearchTemp: getSearchTemp,
				getVideoTemp: getVideoTemp,
				getTransTemp: getTransTemp
			};

			var searchTemp = {
				templateUrl: './partials/search/search-partials/modals/error-modal.html',
				controller: 'ErrorModalController',
				controllerAs: 'errorModal'
			};

			var videoTemp = {
				templateUrl: './partials/video/video-partials/modals/error-modal.html',
				controller: 'ErrorModalController',
				controllerAs: 'errorModal'
			};

			var transTemp = {
				templateUrl: './partials/search/search-partials/modals/translate-error-modal.html',
				controller: 'ErrorModalController',
				controllerAs: 'errorModal'
			}

			function openModal(modalObj){
				var deferred = $q.defer();
				var modalInstance = $uibModal.open({
					templateUrl: modalObj.templateUrl,
					controller: modalObj.controller,
					controllerAs: modalObj.controllerAs
				});

				modalInstance.result.then(function(result){
					deferred.resolve(result);
				}, function(error){
					deferred.reject(error);
				});

				return deferred.promise;
			}

			function getSearchTemp(){
				return searchTemp;
			}

			function getVideoTemp(){
				return videoTemp;
			}

			function getTransTemp(){
				return transTemp;
			}

			return services;
		}
	}

	//For cross-browser compatibility, this will convert a stringified date into a date object. Date inputs don't exist in certain browsers such as Firefox, so we use Moment.js to create our own object to be used.
	function ytDateHandler(){
		return function(){

			var services = {
				check: check,
				getDate: getDate
			}

			function getDate(date, format){
				return (typeof date === 'string') ? moment(date, format)._d : date;
			}

			function check(){
				var supported = {date: false, number: false, time: false, month: false, week: false},
				tester = document.createElement('input');

				tester.type = 'date';

				if(tester.type === 'date'){
					return true;
				} else {
					return false;
				}
			}

			return services;
		}
	}

	function ytInitAPIs($q, ytModalGenerator){
		//TODO: When user creates or updates their log info, the app probably should refresh so that the GMaps script can be loaded only once. Upon checking 
		var initTemp = {
				templateUrl: './partials/search/search-partials/modals/init-modal.html',
				controller: 'InitModalController',
				controllerAs: 'initModal'
		};

		this.check = check;
		this.updateMapsScript = updateMapsScript;

		function check(){
			var deferred = $q.defer();
			//Checking localStorage to see if user has an id with saved API keys
			if(localStorage['uyts-log-info']){
				var obj = JSON.parse(localStorage['uyts-log-info']);
				console.log(obj);
				this.apisObj = obj;
				//Updating the DOM (for the Google Maps API)
				updateDOM(this.apisObj.mapsKey);
				deferred.resolve(this.apisObj);
			} else {
				ytModalGenerator().openModal(initTemp)
				.then((result)=>{
					if(result === 'cancel'){
						//Do nothing
					} else {
						console.log(result);
						localStorage.setItem('uyts-log-info', JSON.stringify(result));
						this.apisObj = localStorage['uyts-log-info'];
						updateDOM(this.apisObj.mapsKey);
						// deferred.resolve(this.apisObj);

						//Refresh page to enable g maps to work
						location.reload();
					}
				});
			}
			return deferred.promise;
			

		}

		function updateDOM(key){
			if(key){
				updateMaps(key);
			} else {
				updateMaps('');
			}
		}

		//Construct url with saved Google Maps API key, then run loadScript()
		function updateMaps(key){
			var src = 'https://maps.googleapis.com/maps/api/js?key='+key;
			loadScript(src)
			.then(() => {
				console.log('Appended google maps script tag');
			}, ()=> {
				console.log('An error occured appending google maps script tag');
			});

		}

		//Appends a script tag
		function loadScript(src) {
		    return new Promise((resolve, reject) => {
		        var s;
		        // var t;
		        s = document.createElement('script');
		        
		        s.src = src;
		        s.async = "async";
		        s.onload = resolve;
		        s.onerror = reject;
		        document.body.appendChild(s);
		    });
		}

		function updateMapsScript(key) {
			var t = document.getElementsByTagName('script')[0];
			console.log(t);
			t.src = 'https://maps.googleapis.com/maps/api/js?key='+key;
			console.log(t);
		}
	}




})();





