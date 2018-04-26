(function(){
	angular
	.module('myApp')

	.directive('eventFocus', [eventFocus]);

	function eventFocus(focus){
		return function(scope, elem, attr) {
      elem.on(attr.eventFocus, function() {
        focus(attr.eventFocusId);
      });

      // Removes bound events in the element itself
      // when the scope is destroyed
      scope.$on('$destroy', function() {
        elem.off(attr.eventFocus);
      });
    };
  }
})();