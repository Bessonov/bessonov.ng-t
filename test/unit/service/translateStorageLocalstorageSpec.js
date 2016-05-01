'use strict';

beforeEach(function() {
    localStorage.clear();
});

beforeEach(module('bessonov.ng-t'));

describe('Test localStorage', function() {


	var $httpBackend;
	beforeEach(inject(function($injector) {
		$httpBackend = $injector.get('$httpBackend');
	}));

	afterEach(function() {
		$httpBackend.verifyNoOutstandingExpectation();
		$httpBackend.verifyNoOutstandingRequest();
	});

	it('Check storage contract', inject(function(translateStorageLocalstorage) {
		translateStorageLocalstorage.set(null);
		expect(translateStorageLocalstorage.get()).toBeNull();

		translateStorageLocalstorage.set('');
		expect(translateStorageLocalstorage.get()).toBe('');

		translateStorageLocalstorage.set('de');
		expect(translateStorageLocalstorage.get()).toBe('de');

		translateStorageLocalstorage.set(null);
		expect(translateStorageLocalstorage.get()).toBeNull();
	}));
});