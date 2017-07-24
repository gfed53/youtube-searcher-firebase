/*jshint esversion: 6 */

(function(){
	angular
	.module('myApp')
	.controller('InitFirebaseModalController', ['$uibModalInstance', 'ytFirebase', InitFirebaseModalController]);

	function InitFirebaseModalController($uibModalInstance, ytFirebase){
		let vm = this;
		vm.ok = ok;
		vm.logout = logout;
		vm.cancel = cancel;
		vm.isLoggedIn = ytFirebase.services.isLoggedIn();
		vm.credObj = ytFirebase.services.getCredObj();
		vm.pwError = false;

		//CB will watch for value. If truthy, we're logging in. Else, we log out.
		function ok(obj){
			//We need to initApp first to retrieve the app reference (so we can compare passwords)
			
			ytFirebase.services.grabCluster(obj)
			.then(()=> {
				//Then we run checkValid to compare. checkValid can take resolve/reject CBs
				ytFirebase.services.checkValid(obj, ()=>{
					//We addCreds only after we know that they're correct
					vm.pwError = false;
					$uibModalInstance.close(obj);
				}, ()=>{
					vm.pwError = true;
				});
				
			});
		}

		function logout(){
			$uibModalInstance.close(false);
		}

		function cancel(){
			$uibModalInstance.dismiss('cancel');
		}
	}
})();