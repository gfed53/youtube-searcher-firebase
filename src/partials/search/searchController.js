/*jshint esversion: 6 */

(function() {
    angular
        .module("myApp")

        .controller("SearchCtrl", [
            "$scope",
            "$location",
            "$timeout",
            "$interval",
            "$anchorScroll",
            "$uibModal",
            "ytSearchYouTube",
            "ytChanSearch",
            "ytChanFilter",
            "ytSearchParams",
            "ytResults",
            "ytSearchHistory",
            "ytSearchHistoryFB",
            "ytVideoItems",
            "ytVideoItemsFB",
            "ytComputeCssClass",
            "ytScrollTo",
            "ytInitMap",
            "ytCheckScrollBtnStatus",
            "ytTranslate",
            "ytSortOrder",
            "ytDateHandler",
            "ytInitAPIs",
            "ytFirebase",
            "ytSetChannelAndNavigate",
            "ytFocus",
            "ytDecodeHtml",
            SearchCtrl
        ]);

    function SearchCtrl(
        $scope,
        $location,
        $timeout,
        $interval,
        $anchorScroll,
        $uibModal,
        ytSearchYouTube,
        ytChanSearch,
        ytChanFilter,
        ytSearchParams,
        ytResults,
        ytSearchHistory,
        ytSearchHistoryFB,
        ytVideoItems,
        ytVideoItemsFB,
        ytComputeCssClass,
        ytScrollTo,
        ytInitMap,
        ytCheckScrollBtnStatus,
        ytTranslate,
        ytSortOrder,
        ytDateHandler,
        ytInitAPIs,
        ytFirebase,
        ytSetChannelAndNavigate,
        ytFocus,
        ytDecodeHtml
    ) {
        let vm = this;

        // Decide which services to use (firebase or localStorage)
        let searchHistoryService = ytFirebase.services.isLoggedIn()
            ? ytSearchHistoryFB
            : ytSearchHistory;

        let videoItemsService = ytFirebase.services.isLoggedIn()
            ? ytVideoItemsFB
            : ytVideoItems;

        vm.initMap = initMap;
        vm.submit = submit;
        vm.setVideoId = setVideoId;
        vm.chanFilter = chanFilter;
        vm.chanClear = chanClear;
        vm.viewVideo = false;
        vm.filterActive = false;
        vm.clearSelection = clearSelection;
        vm.searchAndChanFilter = searchAndChanFilter;
        vm.setChannelAndNavigate = setChannelAndNavigate;
        vm.saveSearch = saveSearch;
        vm.addToPlaylist = addToPlaylist;
        vm.videoIsSaved = videoIsSaved;
        vm.computeCssClass = computeCssClass;
        vm.scrollTo = scrollTo;
        vm.reset = reset;
        vm.scrollBtn = false;
        vm.isDateTypeComp = ytDateHandler().check();

        // Retrieving our saved variables, if any.
        // 'type' refers to the search type, whether the user sees the basic or advanced search in the view.
        vm.results = ytResults.getResults();
        vm.chanResults = ytResults.getChanResults();
        vm.langs = ytTranslate.langs;
        vm.params = ytSearchParams.get();
        vm.paramsPrev = ytSearchParams.getPrev();
        vm.searchTypePrev = ytSearchParams.getSTP();
        vm.currentPage = ytSearchParams.getCurrentPage();
        vm.status = ytResults.getStatus();
        vm.translate = translate;

        // Keep a log of searched videos that were moved to playlist, so add button gets disabled once you add video.
        vm.savedVideos = [];

        // Default search settings
        vm.params.searchType = vm.params.searchType || "video";

        vm.videosReverse = ytSortOrder.videosReverse;
        vm.sort = sort;

        // User authentication
        vm.userName = ytInitAPIs.apisObj.id;
        vm.updateAPIInfo = ytInitAPIs.update;

        $timeout(() => {
            vm.initMap();

            // Set focus to search bar
            ytFocus("video-search-bar");
        }, 1000);

        $location.url("/search");

        window.addEventListener("scroll", () => {
            $scope.$apply(
                (vm.scrollBtn = ytCheckScrollBtnStatus().check(
                    vm.results,
                    vm.chanResults
                ))
            );
        });

        function initMap() {
            vm.mapObj = ytInitMap(update);
            vm.map = vm.mapObj.map;
            vm.circle = vm.mapObj.circle;

            function update() {
                vm.center = vm.circle.getCenter();
                vm.lat = vm.center.lat();
                vm.lng = vm.center.lng();
                vm.radius = vm.circle.getRadius();
                vm.params.lat = JSON.stringify(vm.lat);
                vm.params.lng = JSON.stringify(vm.lng);
                vm.params.radius = JSON.stringify(vm.radius / 1000);
                vm.params.location = vm.params.lat + "," + vm.params.lng;
                vm.params.locationRadius = vm.params.radius + "km";
                $scope.$apply();
            }
        }

        function submit(params, pageToken, direction) {
            vm.viewVideo = false;
            ytSearchYouTube(params, pageToken, direction)
                .search()
                .then(response => {
                    // Clear the search bar, but keep a reference to the last keyword searched.
                    vm.params.keyword = direction ? vm.params.keyword : "";

                    // We don't want to save the text query if it's a channel search. If we end up saving a subsequent search without passing in a keyword, we'd get the left over channel keyword saved.
                    vm.params.searchedKeyword =
                        vm.params.searchType === "video"
                            ? response.config.params.q
                            : "";
                    // vm.params.searchedKeyword = response.config.params.q;

                    ytSearchParams.updateCurrentPage(response.pageDirection);
                    vm.currentPage = ytSearchParams.getCurrentPage();
                    vm.searchTypePrev = response.config.params.type;
                    ytSearchParams.setSTP(vm.searchTypePrev);

                    // Also reset auto-translate in case we want to then grab the next page of the translated search (so the translator doesn't unnecessarily try to re-translate an already-translated word)
                    vm.params.lang = vm.langs[0];
                    vm.results = response.data.items;
                    vm.params.nextPageToken = response.data.nextPageToken;
                    vm.params.prevPageToken = response.data.prevPageToken;
                    vm.status.channelsCollapsed = true;
                    vm.status.videosCollapsed = false;
                    ytSearchParams.setPrev(vm.params, direction);
                    vm.paramsPrev = ytSearchParams.getPrev();

                    ytResults.setStatus(vm.status);

                    // testing
                    vm.results.forEach(result => {
                        let titleDecoded = ytDecodeHtml(result.snippet.title);
                        console.log("titleDecoded", titleDecoded);
                        result.snippet.titleDecoded = titleDecoded;
                    });

                    //Saving the results to our service
                    ytResults.setResults(vm.results);

                    // Autoscroll
                    $timeout(() => {
                        vm.scrollTo("results-container");
                        // Focus on save search button
                        ytFocus("btn-save-search");
                    }, 1000);
                });
        }

        function setVideoId(videoId) {
            ytVideoItems.services.setVideoId(videoId);
        }

        function chanFilter(id, image) {
            ytChanFilter.set(id, image);
            vm.params.image = image;
            vm.params.channelId = id;
            vm.filterActive = true;

            // Automatically switch to video search
            vm.params.searchType = "video";
            vm.scrollTo("form-advanced-video-search");
        }

        function chanClear() {
            ytChanFilter.clear();
            vm.params.image = "";
            vm.params.channelId = undefined;
            vm.filterActive = false;
        }

        function clearSelection() {
            // Clears location/locationRadius params
            vm.params.lat = undefined;
            vm.params.lng = undefined;
            vm.params.radius = undefined;
            vm.params.location = undefined;
            vm.params.locationRadius = undefined;
        }

        function searchAndChanFilter(channel) {
            vm.searchedChannel = channel;
            ytChanSearch(channel)
                .getResults()
                .then(response => {
                    vm.firstChanResult = response.data.items[0];
                    vm.chanFilter(
                        vm.firstChanResult.id.channelId,
                        vm.firstChanResult.snippet.thumbnails.default.url
                    );
                });
        }

        function setChannelAndNavigate(channelId) {
            ytSetChannelAndNavigate(channelId);
            vm.params.searchedKeyword = "";
            $timeout(() => {
                vm.scrollTo("form-advanced-video-search");
            }, 100);
        }

        function saveSearch(params) {
            searchHistoryService.set(params, searchHistoryService);
        }

        function addToPlaylist(result) {
            videoItemsService.services.setItem(result).then(res => {
                vm.savedVideos.push(result);
            });
        }

        function videoIsSaved(result) {
            return vm.savedVideos.indexOf(result) !== -1;
        }

        function computeCssClass(first, last) {
            return ytComputeCssClass(first, last);
        }

        function scrollTo(scrollLocation) {
            ytScrollTo().scrollToElement(scrollLocation);
        }

        function translate(keyword, lang) {
            ytTranslate.translate(keyword, lang).then(response => {
                vm.params.advKeyword = response.data.text[0];
            });
        }

        function sort() {
            vm.videosReverse = !vm.videosReverse;
            ytSortOrder.videosReverse = vm.videosReverse;
        }

        function reset() {
            ytSearchParams.reset();
            vm.params = ytSearchParams.get();
        }
    }
})();
