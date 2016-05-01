'use strict';

describe('directive', function() {

	beforeEach(module('bessonov.ng-t', function($provide, tProvider) {
		tProvider
			.fallbackLanguage('de')
			.urlTemplate(function(lang, module) {
				return '/' + module +  '/i18n/' + lang + '.json';
			})
			.provide('de', 'providedModule', {
				'Provided': 'Bereitgestellt',
				'n day': {
					'one': '1 Tag',
					'many': '{{ n }} Tage'
				}
			})
			.addModule('toLoad')
			.setPluralizationLoader('pluralizationLoader');

		$provide.service('pluralizationLoader', function($q) {
			return {
				load: function() {
					var deferred = $q.defer();
					deferred.resolve(this);
					return deferred.promise;
				}
			};
		});
	}));

	var $httpBackend;
	beforeEach(inject(function($injector) {
		$httpBackend = $injector.get('$httpBackend');
	}));

	afterEach(function() {
		$httpBackend.verifyNoOutstandingExpectation();
		$httpBackend.verifyNoOutstandingRequest();
	});

	describe('<p t> | <t>', function() {
		it('just translate', function() {
			inject(function($rootScope, $compile) {

				var element = $compile('<p t> \n Provided \n</p>')($rootScope);
				$rootScope.$digest();
				expect(element.text()).toBe('Bereitgestellt');

				$rootScope.days = '1';
				element = $compile('<p t="{n: days}">n day</p>')($rootScope);
				$rootScope.$digest();
				expect(element.text()).toBe('1 Tag');

				$rootScope.days = '6';
				element = $compile('<t t-params="{n: days}">n day</t>')($rootScope);
				$rootScope.$digest();
				expect(element.text()).toBe('6 Tage');

				$httpBackend.expectGET('/toLoad/i18n/de.json').respond(200, '{"Not loaded": "Geladen!"}');
				element = $compile('<t>Not loaded</t>')($rootScope);
				$rootScope.$digest();
				$httpBackend.flush();
				expect(element.text()).toBe('Geladen!');
			});
		});
	});
});
