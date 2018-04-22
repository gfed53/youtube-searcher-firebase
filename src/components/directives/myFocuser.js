(function(){
	angular
	.module('myApp')

	.directive('myFocuser', [myFocuser]);

	function myFocuser(){
		return {
			restrict: 'A',
			link: function ($scope, $element) {
        $scope.$watch(function () {
          //simply focus
          $element.focus();
          //or more specific
        //  if ($location.$$url == '/specific/path') {
        //    $element.focus();
        //  }
        });
      }
	  }
  }
})();