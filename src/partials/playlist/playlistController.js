/*jshint esversion: 6 */

(function(){
	angular
	.module('myApp')

	.controller('PlaylistCtrl', ['$scope', '$rootScope', '$state', '$timeout', 'ytVideoItems', 'ytVideoItemsFB', 'ytSearchHistory', 'ytSearchHistoryFB', 'ytSearchParams', 'ytPlaylistSort', 'ytFilters', 'ytPlaylistView', 'ytDateHandler', 'ytSettings', 'ytFirebase', PlaylistCtrl]);

	function PlaylistCtrl($scope, $rootScope, $state, $timeout, ytVideoItems, ytVideoItemsFB, ytSearchHistory, ytSearchHistoryFB, ytSearchParams, ytPlaylistSort, ytFilters, ytPlaylistView, ytDateHandler, ytSettings, ytFirebase){
		let vm = this;

		// Decide which services to use (firebase or localStorage)
		var videoItemsService = ytFirebase.services.isLoggedIn() ? ytVideoItemsFB : ytVideoItems;
		var searchHistoryService = ytFirebase.services.isLoggedIn() ? ytSearchHistoryFB : ytSearchHistory;

		vm.isUsingFBase = ytFirebase.services.canUseFBase();

		//Fetching content
		vm.items = videoItemsService.services.getItems();
		vm.pastSearches = searchHistoryService.get();

		//Methods
		vm.setVideoId = setVideoId;
		vm.grab = grab;
		vm.clearSearch = clearSearch;
		vm.clearItem = clearItem;
		vm.clearAllVideos = clearAllVideos;
		vm.clearAllSearches = clearAllSearches;

		//Sort methods
		vm.videosReverse = ytPlaylistSort.videos.reverse;
		vm.videosPredicate = ytPlaylistSort.videos.predicate;
		vm.searchesReverse = ytPlaylistSort.searches.reverse;
		vm.searchesPredicate = ytPlaylistSort.searches.predicate;
		vm.sortVideos = sortVideos;
		vm.sortSearches = sortSearches;

		//Retrieving saved filters (if any)
		vm.videoFilter = ytSettings.getVideoFilter();
		console.log('vm.videoFilter',vm.videoFilter);

		vm.searchFilter = ytSettings.getSearchFilter();


		//Keeps track of collapsed/expanded sections in saved/playlist section
		vm.collapsed = ytPlaylistView.get();

		
		vm.closeAll = closeAll;
		vm.openAll = openAll;

		vm.addedAfterVideos = addedAfterVideos;
		vm.addedBeforeVideos = addedBeforeVideos;
		vm.addedAfterSearches = addedAfterSearches;
		vm.addedBeforeSearches = addedBeforeSearches;

		vm.isDateTypeComp = ytDateHandler().check();
		vm.warnActive = ytSettings.warnActive;

		vm.fbaseSave = ytFirebase.services.save;
		vm.segName = ytFirebase.services.getSegName();

		vm.handleStorageSettings = handleStorageSettings;

		$scope.$watchCollection('playlist.videoFilter', () => {
			console.log('change occured',vm.videoFilter);
			ytSettings.setVideoFilter(vm.videoFilter);
		});

		$scope.$watchCollection('playlist.searchFilter', () => {
			console.log('change occured search',vm.searchFilter);
			ytSettings.setSearchFilter(vm.searchFilter);
		});

		//Grabs one of our saved searches, then automatically switches to the search state in its advanced search mode.
		function grab(search){
			ytSearchParams.set(search);
			$state.go('search');
		}

		//Removes selected search from history/localStorage (permanently)
		function clearSearch(search){
			searchHistoryService.clearItem(search, vm.warnActive);
		}

		//Removes ALL searches from history/localStorage (permanently!)
		function clearAllSearches(){
			searchHistoryService.clearAll()
			.then((searches) => {
				vm.pastSearches = searches;
			});
		}

		//Removes selected video item from history/localStorage (permanently)
		function clearItem(item){
			videoItemsService.services.clearItem(item, vm.warnActive);
		}

		//TODO: improve logic
		function clearAllVideos(){
			videoItemsService.services.clearAllItems()
			.then((items) => {
				vm.items = items;
			});
			
		}

		//Updates currentVideoId in VideoItems service. This updates stateParams, which is what we use to load the video up in the video player section.
		function setVideoId(videoId){
			videoItemsService.services.setVideoId(videoId);
		}

		function sortVideos(predicate){
			let sortObj = ytPlaylistSort.order(vm.videosPredicate, predicate, ytPlaylistSort.videos);
			vm.videosReverse = sortObj.reverse;
			vm.videosPredicate = sortObj.predicate;
			//Save videosReverse and videosPredicate to service, save it to local storage as well
			saveSortOpts();
		}

		function sortSearches(predicate){
			let sortObj = ytPlaylistSort.order(vm.searchesPredicate, predicate, ytPlaylistSort.searches);
			vm.searchesReverse = sortObj.reverse;
			vm.searchesPredicate = sortObj.predicate;

			saveSortOpts();
		}

		function saveSortOpts(){
			ytSettings.setSortOpts({
				videos: {
					predicate: vm.videosPredicate,
					reverse: vm.videosReverse
				},
				searches: {
					predicate: vm.searchesPredicate,
					reverse: vm.searchesReverse
				}
			});
		}

		function closeAll(group){
			group.forEach((e) => {
				e.state = false;
			});
		}

		function openAll(group){
			group.forEach((e) => {
				e.state = true;
			});
		}

		function addedAfterVideos(video){
			return ytFilters().addedAfterVideos(video, vm.videoFilter);
		}

		function addedBeforeVideos(video){
			return ytFilters().addedBeforeVideos(video, vm.videoFilter);
		}

		function addedAfterSearches(search){
			return ytFilters().addedAfterSearches(search, vm.searchFilter);
		}

		function addedBeforeSearches(search){
			return ytFilters().addedBeforeSearches(search, vm.searchFilter);
		}

		function handleStorageSettings(){
			ytSettings.handleStorageSettings()
			.then((res)=>{
				vm.warnActive = res;
			});
		}

		
	}
})();



