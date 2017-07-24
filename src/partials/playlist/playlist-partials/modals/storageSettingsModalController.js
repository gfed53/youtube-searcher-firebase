/*jshint esversion: 6 */

(function(){
	angular
	.module('myApp')
	.controller('StorageSettingsModalController', ['$uibModalInstance', 'ytInitAPIs', 'ytFirebase', 'ytSettings', StorageSettingsModalController]);

	function StorageSettingsModalController($uibModalInstance, ytInitAPIs, ytFirebase, ytSettings){
		let vm = this;

		//Retrieving prev warn setting
		
		vm.warnVal = ytSettings.getWarn();

		vm.ok = ok;
		vm.cancel = cancel;

		function ok(){
			let obj = {
				warnVal: vm.warnVal,
				fBaseDB: vm.fBaseDB
			};
			$uibModalInstance.close(obj);
		}

		function cancel(){
			$uibModalInstance.dismiss('cancel');
		}
	}
})();