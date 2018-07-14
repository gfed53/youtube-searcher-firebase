/*jshint esversion: 6 */

(function(){
	angular
	.module('myApp')

	.controller('ItemCtrl', ['$state', '$stateParams', 'ytCurrentVideo', 'ytCurrentChannel', 'ytResults', 'ytVideoItems', 'ytVideoItemsFB', 'ytSearchParams', 'ytTrustSrc', 'ytFirebase', 'ytSetChannelAndNavigate', ItemCtrl]);

	function ItemCtrl($state, $stateParams, ytCurrentVideo, ytCurrentChannel, ytResults, ytVideoItems, ytVideoItemsFB, ytSearchParams, ytTrustSrc, ytFirebase, ytSetChannelAndNavigate){
		let vm = this;

		// Decide which services to use (firebase or localStorage)
		var videoItemsService = ytFirebase.services.isLoggedIn() ? ytVideoItemsFB : ytVideoItems;

		vm.trustSrc = ytTrustSrc;
		
		vm.videoId = $stateParams.videoId;
		videoItemsService.services.setVideoId(vm.videoId);
		// console.log('in video:',videoItemsService.services.getVideoId());
		vm.url = 'http://www.youtube.com/embed/'+vm.videoId;
		vm.trustedUrl = vm.trustSrc(vm.url);
		vm.getVideoItem = getVideoItem;
		vm.clearItem = clearItem;
		vm.getChannel = getChannel;
		vm.item;
		vm.cleared;
		vm.params = ytSearchParams.get();

		vm.setChannelAndNavigate = ytSetChannelAndNavigate;

		vm.getVideoItem(vm.videoId);
		
		//Init list of saved video items to compare current video against (if loading page in video view)
		videoItemsService.services.init();

		
		//In case of page refresh, we need to automatically save the videoId, or else, on state change, the video player tab will still exist with nowhere to go.
		videoItemsService.services.setVideoId(vm.videoId);

		//We retrieve the video from the API in order to get  
		function getVideoItem(id){
			ytCurrentVideo(id).getVideo()
			.then((response) => {
				vm.item = response.data.items[0];
				//Bug: this will not always be retrieved in time if loading page from video state. It would depend on how quickly fbase loads up. Make async/use promise?
				vm.isSaved = videoItemsService.services.isSaved(vm.item.id);
			});
		}

		//Removes selected video item from history/localStorage (permanently)
		function clearItem(item){
			videoItemsService.services.clearItem(item);
			vm.cleared = true;
		}

		function getChannel(videoId){
			ytCurrentChannel(videoId).getChannel()
			.then((response) => {
				vm.channel = response.data.items[0];
				vm.params.channelId = vm.channel.id;
				vm.params.image = vm.channel.snippet.thumbnails.default.url;
				ytSearchParams.set(vm.params);
				$state.go('search');
			});
		}
	}
})();