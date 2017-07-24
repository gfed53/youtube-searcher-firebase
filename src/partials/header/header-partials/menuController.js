/*jshint esversion: 6 */

angular
.module('myApp')

.controller('MenuCtrl', ['$scope', '$rootScope', '$timeout', '$stateParams', 'ytVideoItems', 'ytVideoItemsFB', 'ytCheckScrollY', 'ytCheckScrollDir', 'ytFirebase', MenuCtrl]);

function MenuCtrl($scope, $rootScope, $timeout, $stateParams, ytVideoItems, ytVideoItemsFB, ytCheckScrollY, ytCheckScrollDir, ytFirebase){
	let vm = this;

	// Decide which services to use (firebase or localStorage)
	var videoItemsService = ytFirebase.services.isLoggedIn() ? ytVideoItemsFB : ytVideoItems;


	vm.videoIdObj = videoItemsService.services.getVideoId();

	// vm.videoId = vm.videoIdObj.videoId;
	vm.showNav = ytCheckScrollDir().checkB();
	vm.showFixed = false;
	vm.update = update;
	vm.updateOnClick = updateOnClick;
	vm.noScroll = true;
	vm.collapsed = true;

	ytCheckScrollY().init(vm.update);

	ytCheckScrollDir().check(()=>{
		vm.showNav = false;
		
	}, ()=> {
		vm.showNav = true;
	});


	function update(bool){
		$scope.$apply(() => {
			vm.noScroll = bool;
		});		
	}

	//Seperate function since digest is already in progress when clicked
	function updateOnClick(){
		vm.collapsed = !vm.collapsed;
	}

	//Once we switch to the video state (by clicking on a video to watch), the video tab will be visible from now on, so we have access to it for the duration of the session
	$rootScope.$on('$stateChangeSuccess', (event, toState, toParams, fromState, fromParams) => {
		if(toState.name === 'video'){
			vm.videoId = videoItemsService.services.getVideoId();
			console.log('video id?', vm.videoId);
		}
		vm.collapsed = true;
	});
}