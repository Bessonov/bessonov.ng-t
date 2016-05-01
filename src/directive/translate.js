(function(angular) {
	'use strict';

	angular.module('bessonov.ng-t')

	.directive('t', ['$compile', '$rootScope', 't', function($compile, $rootScope, t) {
		return {
			restrict: 'AE',
			scope: {
				t: '=',
				tParams: '='
			},
			compile: function compile(tElement, tAttributes) {
				var originalBody = tElement.html();

				return function(scope, element) {
					var translate = function() {
						var params = scope.tParams || scope.t;
						t.translate(originalBody, params).then(function(translation) {
							element.html(translation);
							$compile(element.contents())(scope);
						});
					};
					$rootScope.$on('tLanguageChangedSuccessful', translate);
					translate();
				};
			}
		};
	}]);
}(angular));