'use strict';

describe('filter', function() {

	beforeEach(module('bessonov.ng-t', function($provide, tProvider) {
		tProvider
			.fallbackLanguage('de')
			.provide('de', 'providedModule', {
				'Provided': 'Bereitgestellt',
				'n day': {
					'one': '1 Tag',
					'many': '{{ n }} Tage'
				}
			})
			.addModule('toLoad')
			.setPluralizationLoader('pluralizationLoader');

		$provide.service('pluralizationLoader', function() {
			return {
				load: function() {}
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

	describe(' | t', function() {
		it('should convert boolean values to unicode checkmark or cross', inject(function(tFilter) {
			expect(tFilter('Provided')).toBe('Bereitgestellt');

			$httpBackend.expectGET('/toLoad/i18n/de.json').respond(200, '{"Not loaded": "Geladen!"}');

			// first access fail, but trigger loading
			expect(tFilter('Not loaded')).toBe('Not loaded');
			$httpBackend.flush();

			// second access get it
			expect(tFilter('Not loaded')).toBe('Geladen!');
		}));
	});

	describe(" | t:'{n: 1}'", function() {
		it('should convert boolean values to unicode checkmark or cross', inject(function(tFilter) {
			expect(tFilter('n day', '{n: 1}')).toBe('1 Tag');
			expect(tFilter('n day', '{n: 5}')).toBe('5 Tage');
		}));
	});
});
