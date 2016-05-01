'use strict';

var handlerService = function($rootScope, $httpBackend) {
	return function(t) {
		var handler = jasmine.createSpy('success');
		t.then(handler);
		handler.$digest = function() {
			$rootScope.$digest();
			return handler;
		};
		handler.flush = function() {
			$httpBackend.flush();
			return this;
		};
		return handler;
	}
};

beforeEach(function() {
	localStorage.clear();
});

describe('No translation provided', function() {

	beforeEach(module('bessonov.ng-t'));

	var $httpBackend;
	beforeEach(inject(function($injector) {
		$httpBackend = $injector.get('$httpBackend');
	}));

	afterEach(function() {
		$httpBackend.verifyNoOutstandingExpectation();
		$httpBackend.verifyNoOutstandingRequest();
	});

	it('If no language settet and no fallback language provided, throw Error', inject(function(t, translateStorageLocalstorage) {
		var langInStorage = translateStorageLocalstorage.get();
		translateStorageLocalstorage.set('');

		expect(function() {
			t.translate('test');
		}).toThrow(new Error("No fallback language defined."));

		expect(function() {
			t.use();
		}).toThrow(new Error("No fallback language defined."));

		translateStorageLocalstorage.set(langInStorage);
	}));
});

describe('Translation provided to fallback language only', function() {

	beforeEach(module('bessonov.ng-t', function(tProvider) {
		tProvider
			.fallbackLanguage('en')
			.setBaseUrl('/test/')
			.provide('en', 'module1', {
				'MY_TEST': 'My test'
			});
	}));

	it('Provided translation', inject(function($rootScope, $q, $httpBackend, t) {
		t.addModule('module1');
		var handler = jasmine.createSpy('success');
		t.translate('MY_TEST').then(handler);
		$rootScope.$digest();
		expect(handler).toHaveBeenCalledWith('My test');
	}));

	it('Provided translation', inject(function($rootScope, $q, $httpBackend, t) {
		t.addModule('module1');
		t.use('de');
		$httpBackend.expectGET('/test/module1/i18n/de.json').respond(200, '{"MY_TEST": "Mein Test"}');
		var handler = jasmine.createSpy('success');
		t.translate('MY_TEST').then(handler);
		$httpBackend.flush();
		expect(handler).toHaveBeenCalledWith('Mein Test');
	}));

	it('If no translation for current language exists, then use from fallback language (not working now)', 
			inject(function($rootScope, $q, $httpBackend, t) {
		t.addModule('module1');
		t.use('de');
		$httpBackend.expectGET('/test/module1/i18n/de.json').respond(200, '{}');

		// actually, throw an error
		t.translate('MY_TEST');
		expect($httpBackend.flush).toThrow(new Error('Translation for "MY_TEST" for language "de" is unknown.'));

//		var handler = jasmine.createSpy('success');
//		t.translate('MY_TEST').then(handler);
//		$rootScope.$digest();
//		expect(handler).toHaveBeenCalledWith('My test');
	}));

	it('If no translation exists, then throw error', inject(function($rootScope, $q, $httpBackend, t) {
		t.addModule('module1');
		t.use('de');
		$httpBackend.expectGET('/test/module1/i18n/de.json').respond(200, '{}');
		t.translate('NOT_EXISTS');
		expect($httpBackend.flush).toThrow(new Error('Translation for "NOT_EXISTS" for language "de" is unknown.'));
	}));
});

describe('Test modules and languages', function() {

	beforeEach(module('bessonov.ng-t', function($injector, $provide, tProvider) {
		tProvider
			.fallbackLanguage('en')
			.provide('en', 'module1', {
				'MY_TEST1': 'My test 1'
			})
			.provide('en', 'module2', {
				'MY_TEST2': 'My test 2'
			})
			;

		$provide.service('handle', handlerService);
	}));

	var $httpBackend;
	beforeEach(inject(function($injector) {
		$httpBackend = $injector.get('$httpBackend');
		$injector.get('translateStorageLocalstorage').set(null);
	}));

	afterEach(function() {
		$httpBackend.verifyNoOutstandingExpectation();
		$httpBackend.verifyNoOutstandingRequest();
	});

	it('Add modules first, then switch language and then swich back', inject(function(t, handle) {
		t.addModule('module1');
		t.addModule('module2');
		expect(handle(t.translate('MY_TEST1')).$digest())
			.toHaveBeenCalledWith('My test 1');
		expect(handle(t.translate('MY_TEST2')).$digest())
			.toHaveBeenCalledWith('My test 2');

		t.use('de');
		$httpBackend.expectGET('/module1/i18n/de.json').respond(200, '{"MY_TEST1": "Mein Test 1"}');
		$httpBackend.expectGET('/module2/i18n/de.json').respond(200, '{"MY_TEST2": "Mein Test 2"}');
		expect(handle(t.translate('MY_TEST1')).flush()).toHaveBeenCalledWith('Mein Test 1');
		expect(handle(t.translate('MY_TEST2')).$digest()).toHaveBeenCalledWith('Mein Test 2');

		t.use('en');
		expect(handle(t.translate('MY_TEST1')).$digest()).toHaveBeenCalledWith('My test 1');
		expect(handle(t.translate('MY_TEST2')).$digest()).toHaveBeenCalledWith('My test 2');

	}));

	it('Add module, then switch language and then add another module', inject(function(t, handle) {
		t.addModule('module1');
		expect(handle(t.translate('MY_TEST1')).$digest()).toHaveBeenCalledWith('My test 1');

		t.use('de');

		// because module2 only provided, but not added => don't need to load them
		$httpBackend.expectGET('/module1/i18n/de.json').respond(200, '{"MY_TEST1": "Mein Test 1"}');
		expect(handle(t.translate('MY_TEST1')).flush()).toHaveBeenCalledWith('Mein Test 1');

		t.addModule('module2');

		$httpBackend.expectGET('/module2/i18n/de.json').respond(200, '{"MY_TEST2": "Mein Test 2"}');
		expect(handle(t.translate('MY_TEST2')).flush()).toHaveBeenCalledWith('Mein Test 2');
	}));

	it('Test regexp parameter', inject(function(t, handle) {
		t
			.use('ru')
			.addModule('module3')
			.provide('ru', 'module3', {
				'Night': 'Ночь',
				'Date: {{ date }}': 'Дата: {{ date }}',
				'Day': {
					'one': '{{ n }} день', // One day
					'few': '{{ n }} дня', // Two days
					'many': '{{ n }} дней' // Five days
				}
			});
		expect(handle(t.translate(' \n Night \n ', {n: 123})).$digest()).toHaveBeenCalledWith('Ночь');
		expect(handle(t.translate('Date: {{ date }}', {date: '01.01.2014'})).$digest())
			.toHaveBeenCalledWith('Дата: 01.01.2014');
		expect(handle(t.translate('Day', {n: 1})).$digest()).toHaveBeenCalledWith('1 день');
		expect(handle(t.translate('Day', {n: 2})).$digest()).toHaveBeenCalledWith('2 дня');
		expect(handle(t.translate('Day', {n: 3})).$digest()).toHaveBeenCalledWith('3 дня');
		expect(handle(t.translate('Day', {n: 5})).$digest()).toHaveBeenCalledWith('5 дней');
		expect(handle(t.translate('Day', {n: 10})).$digest()).toHaveBeenCalledWith('10 дней');
		expect(handle(t.translate('Day', {n: 11})).$digest()).toHaveBeenCalledWith('11 дней');
		expect(handle(t.translate('Day', {n: 21})).$digest()).toHaveBeenCalledWith('21 день');
		expect(handle(t.translate('Day', {n: 24})).$digest()).toHaveBeenCalledWith('24 дня');
		expect(handle(t.translate('Day', {n: 25})).$digest()).toHaveBeenCalledWith('25 дней');
	}));

	it('Storage can return anything', inject(function(t, translateStorageLocalstorage, handle) {
		// order addModule and set(de) is important here. Emulate storage change
		t.addModule('module1');
		translateStorageLocalstorage.set('de');
		$httpBackend.expectGET('/module1/i18n/de.json').respond(200, '{"MY_TEST1": "Mein Test 1"}');
		// first fetch is missing, but dig loading
		expect(t.translateLoaded(' \n MY_TEST1 \n ')).toBe(undefined);
		$httpBackend.flush();
		// ok, second try
		expect(t.translateLoaded(' \n MY_TEST1 \n ')).toBe('Mein Test 1');
	}));

	it('Reload already loaded translation', inject(function(t) {
		$httpBackend.expectGET('/module1/i18n/en.json').respond(200, '{"MY_TEST1": "My test (reloaded)"}');
		t.addModule('module1');
		expect(t.translateLoaded(' \n MY_TEST1 \n ')).toBe('My test 1');
		t.reload('module1');
		$httpBackend.flush();
		expect(t.translateLoaded(' \n MY_TEST1 \n ')).toBe('My test (reloaded)');
	}));
});
