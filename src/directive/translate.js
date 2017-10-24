(function(angular) {
	'use strict';

	angular.module('bessonov.ng-t')

	.directive('t', ['$compile', '$injector', 't', function($compile, $injector, t) {
		var $sce = $injector.get('$sce');
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
							element.html($sce.getTrustedHtml(translation) || '');
							$compile(element.contents())(scope);
						});
					};
					scope.$on('tLanguageChangedSuccessful', translate);
					translate();
				};
			}
		};
	}]);
}(angular));
