/*jshint esversion: 6 */

(function(){
	angular
	.module('myApp', ['ui.router', 'ui.bootstrap', 'firebase', 'ngAnimate'])

	.config(['$anchorScrollProvider', '$httpProvider', '$compileProvider', ($anchorScrollProvider, $httpProvider, $compileProvider) => {
		$httpProvider.defaults.useXDomain = true;
		delete $httpProvider.defaults.headers.common['X-Requested-With'];
		$compileProvider.debugInfoEnabled(false);
		$anchorScrollProvider.disableAutoScrolling();
	}])

	.run(['$timeout', '$rootScope', 'ytInitAPIs', 'ytFirebase', 'ytVideoItemsFB', 'ytSearchHistoryFB', ($timeout, $rootScope, ytInitAPIs, ytFirebase, ytVideoItemsFB, ytSearchHistoryFB) => {
		$rootScope.$on('$stateChangeSuccess', () => {
			window.scrollTo(0,0);
		});
		ytInitAPIs.init()
			.then(()=> {
				//Connect to Firebase
				ytFirebase.services.init();
				
				//Retrieve saved content if fb cluster is set up properly
				ytVideoItemsFB.services.init();
				ytSearchHistoryFB.init();
			});
	}]);
})();




