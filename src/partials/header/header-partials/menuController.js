/*jshint esversion: 6 */

angular
.module('myApp')

.controller('MenuCtrl', ['$scope', '$rootScope', '$timeout', '$stateParams', 'ytVideoItems', 'ytVideoItemsFB', 'ytCheckScrollDir', 'ytFirebase', MenuCtrl]);

function MenuCtrl($scope, $rootScope, $timeout, $stateParams, ytVideoItems, ytVideoItemsFB, ytCheckScrollDir, ytFirebase){
	let vm = this;

	// Decide which services to use (firebase or localStorage)
	var videoItemsService = ytFirebase.services.isLoggedIn() ? ytVideoItemsFB : ytVideoItems;

	vm.videoIdObj = videoItemsService.services.getVideoId();

	// We determine if we want to show the nav on initial load depending of if we're at the top of page.
	vm.showNav = ytCheckScrollDir().checkIfTop();
	
	vm.atTop = ytCheckScrollDir().checkIfTop();
	vm.update = update;
	vm.updateOnClick = updateOnClick;
	vm.noScroll = true;
	vm.collapsed = true;

	ytCheckScrollDir().init(vm.update);

	ytCheckScrollDir().checkScrollDirection(() => {
		// While scrolling down (before next digest cycle kicks in)
		vm.showNav = false;
	}, ()=> {
		// While scrolling up (before next digest cycle kicks in)
		vm.showNav = true;
	});

	// Updates state of the navbar depending on whether we've just scrolled up or down.
	function update(bool){
		$scope.$apply(() => {
			vm.noScroll = bool;
			vm.atTop = ytCheckScrollDir().checkIfTop();
		});
	}

	// Seperate function since digest is already in progress when clicked
	function updateOnClick(){
		vm.collapsed = !vm.collapsed;
	}

	// Once we switch to the video state (by clicking on a video to watch), the video tab will be visible from now on, so we have access to it for the duration of the session
	$rootScope.$on('$stateChangeSuccess', (event, toState, toParams, fromState, fromParams) => {
		if(toState.name === 'video'){
			vm.videoId = videoItemsService.services.getVideoId();
		}
		vm.collapsed = true;
	});
}