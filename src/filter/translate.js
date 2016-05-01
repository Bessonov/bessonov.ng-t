(function(angular) {
	'use strict';

	angular.module('bessonov.ng-t')

	.filter('t', ['$parse', 't', function($parse, t) {
		var filter = function(translationId, filterParams) {

			if (angular.isString(filterParams)) {
				filterParams = $parse(filterParams)(this);
			}

			var translateLoaded = t.translateLoaded(translationId, filterParams);
			return translateLoaded || translationId;
		};

		// angular >= 1.3
		filter.$stateful = true;
		return filter;
	}]);
}(angular));