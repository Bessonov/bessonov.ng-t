(function(angular, localStorage) {
	'use strict';

	angular.module('bessonov.ng-t')

	.service('translateStorageLocalstorage', function() {
		var key = 'translation.lang';
		return {
			get: function() {
				return localStorage.getItem(key);
			},
			set: function(lang) {
				if (lang === null) {
					localStorage.removeItem(key);
				} else {
					localStorage.setItem(key, lang);
				}
			}
		};
	});
}(angular, localStorage));