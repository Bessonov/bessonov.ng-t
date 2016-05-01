(function(angular) {
	'use strict';

	angular.module('bessonov.ng-t')

	.factory('NgtModule', ['$q', '$http', function($q, $http) {
		var NgtModule = function NgtModule(urlTemplate, ngtLang, moduleName) {
			var _urlTemplate = urlTemplate,
				_lang = ngtLang.getKey(),
				_name = moduleName,
				_loaded = false,
				_loading = null,
				_provided = false,
				_added = false,
				_http = null,
				_table = {};
			return {
				getName: function() {
					return _name;
				},
				getLoaded: function() {
					return _loaded;
				},
				getProvided: function() {
					return _provided;
				},
				getAdded: function() {
					return _added;
				},
				setAdded: function(added) {
					_added = added;
					return this;
				},
				provide: function(table) {
					_provided = true;
					_loaded = true;
					_table = table; // angular.extend(_table, table);
					return this;
				},
				contains: function(translationId) {
					if (_loaded === false) {
						throw new Error('Module isn\'t loaded');
					}
					return translationId in _table;
				},
				getTranslationLoaded: function(translationId) {
					if (_loaded === false) {
						throw new Error('Module isn\'t loaded');
					}
					return _table[translationId];
				},
				load: function(forceLoad) {
					var that = this;
					var useCache = !forceLoad;

					// If no loading in progress, we create new future. If load forced, too.
					if (_loading === null || useCache === false) {
						_loading = $q.defer();
					}
					if (_loaded && useCache) {
						_loading.resolve(that);
					} else if (_http === null) {
						_http = $http({
							method: 'GET',
							url: _urlTemplate(_lang, _name),
							cache: useCache
						}).then(function(data) {
							_table = data.data;
							_loaded = true;
							_http = null;
							_loading.resolve(that);
							return _table;
						});
					}
					return _loading.promise;
				},
				reload: function() {
					return this.load(true);
				},
				getTranslation: function(translationId) {
					if (_loaded) {
						return $q.when(_table[translationId]);
					}
					return this.load().then(function() {
						return this.getTranslationLoaded(translationId);
					});
				}
			};
		};
		return NgtModule;
	}])

	.factory('NgtLang', ['$q', 'NgtModule', function($q, NgtModule) {
		var NgtLang = function NgtLang(urlTemplate, key) {
			var _urlTemplate = urlTemplate,
				_key = key,
				_modules = [];
			return {
				getKey: function() {
					return _key;
				},
				addModule: function(module) {
					_modules.push(module);
					return this;
				},
				getModules: function() {
					return _modules.slice(0);
				},
				getModule: function(moduleName, noException) {
					for (var i = 0; i < _modules.length; i++) {
						var module = _modules[i];
						if (module.getName() === moduleName) {
							return module;
						}
					}
					if (noException) {
						return null;
					}
					throw new Error('Module "' + moduleName + '" is unknown');
				},
				getOrCreateModule: function(moduleName) {
					var module = this.getModule(moduleName, true);
					if (module === null) {
						module = new NgtModule(_urlTemplate, this, moduleName);
						this.addModule(module);
					}
					return module;
				},
				load: function() {
					var promises = [];
					for (var i = 0; i < _modules.length; i++) { // jshint ignore:line
						var module = _modules[i]; // jshint ignore:line
						if (module.getLoaded() === false) {
							promises.push(module.load());
						}
					}
					return $q.all(promises);
				},
				getTranslationLoaded: function(translationId) {
					for (var i = 0; i < _modules.length; i++) {
						var module = _modules[i];
						if (module.getLoaded() && module.contains(translationId)) {
							return module.getTranslationLoaded(translationId);
						}
					}
					// translation not found. Load all modules
					this.load();
					return undefined;
				},
				getTranslation: function(translationId) {
					// check loaded modules first
					var trans = this.getTranslationLoaded(translationId);
					if (trans) {
						return $q.when(trans);
					}

					// ok, not found. Load all not loaded modules
					return this.load().then(function(modules) {
						for (var i = 0; i < modules.length; i++) {
							var module = modules[i];
							if (module.contains(translationId)) {
								return module.getTranslationLoaded(translationId);
							}
						}
						throw new Error('Translation for "' + translationId + '" for language "' + _key + '" is unknown.');
					});
				}
			};
		};
		return NgtLang;
	}])

	.provider('t', function TranslationProvider() {
		var _fallbackLanguage,
			_deferredTranslations = [],
			_deferredModules = [],
			_storageProvider = 'translateStorageLocalstorage',
			_langs = {},
			_baseUrl = '/',
			_urlTemplate = function(lang, module) {
				return _baseUrl + module + '/i18n/' + lang + '.json';
			},
			_pluralizationLoader;

		this.fallbackLanguage = function(lang) {
			_fallbackLanguage = lang;
			return this;
		};

		this.provide = function(lang, module, table) {
			_deferredTranslations.push({lang: lang, module: module, table: table});
			return this;
		};

		this.addModule = function(moduleName) {
			_deferredModules.push(moduleName);
			return this;
		};

		this.setStroageProvider = function(storageProvider) {
			_storageProvider = storageProvider;
			return this;
		};

		this.setBaseUrl = function(baseUrl) {
			_baseUrl = baseUrl;
			return this;
		};

		/**
		 * Function to construct url for loading translation table
		 */
		this.urlTemplate = function(urlFunction) {
			_urlTemplate = urlFunction;
			return this;
		};

		this.setPluralizationLoader = function(pluralizationLoader) {
			_pluralizationLoader = pluralizationLoader;
		};

		this.$get = ['$q', '$http', '$interpolate', '$injector', '$rootScope', '$locale', '$sniffer', 'NgtLang',
				function($q, $http, $interpolate, $injector, $rootScope, $locale, $sniffer, NgtLang) {
			var langstorage = $injector.get(_storageProvider);

			var getOrCreateLang = function(lang) {
				if ((lang in _langs) === false) {
					_langs[lang] = new NgtLang(_urlTemplate, lang);
				}
				return _langs[lang];
			};

			/**
			 * Load or set pluralization
			 */
			var loadPluralization = function(lang) {
				var pluralization = $injector.get(_pluralizationLoader);
				return pluralization.load(lang);
			};

			// get or set language
			var use = function(lang) {
				// internal setter to set language
				// it's needed to allow set language and don't fire tLanguageChangedSuccessful event,
				// because it's to early for listeners if getter just set fallbackLanguage
				var _setUse = function(lang) {
					// ok, we change language. First, we should add known modules as unknown to new language table
					var oldLang = langstorage.get() in _langs && langstorage.get() || _fallbackLanguage,
						oldModules = getOrCreateLang(oldLang).getModules(),
						newLang = getOrCreateLang(lang);
					angular.forEach(oldModules, function(module) {
						if (module.getAdded()) {
							newLang.getOrCreateModule(module.getName()).setAdded(true);
						}
					});
					langstorage.set(lang);

					// load pluralization even if switch to fallback language
					if (angular.isDefined(_pluralizationLoader)) {
						loadPluralization(lang);
					}
				};

				// used as a getter
				if (angular.isUndefined(lang)) {
					var langName = langstorage.get() || _fallbackLanguage || '';
					if (langName.length === 0) {
						throw new Error('No fallback language defined.');
					}
					// we can get everything from storage... go routine for unknown lang
					if ((langName in _langs) === false) {
						_setUse(langName);
					}
					return langName;
				}

				// used as a setter
				_setUse(lang);

				$rootScope.$emit('tLanguageChangedSuccessful', {language: lang});

				return this;
			};

			var addModule = function(module) {
				getOrCreateLang(use()).getOrCreateModule(module).setAdded(true);
			};

			var addDefferedModules = function() {
				var module;
				while (module = _deferredModules.pop()) { // jshint ignore:line
					addModule(module);
				}
			};

			var addDefferedTranslations = function() {
				var translation, _module;
				// create Lang's and Modules for provided translations
				while (translation = _deferredTranslations.pop()) { // jshint ignore:line
					_module = getOrCreateLang(translation.lang).getOrCreateModule(translation.module);
					_module.provide(translation.table);
				}
			};

			// select right translation from passed translation variant array
			var selectTranslation = function(translationId, translation, params) {
				// not parameterized translation
				if (angular.isString(translation)) {
					return translation;
				}

				// pluralization is provided
				if (angular.isObject(translation)) {
					var plural = $locale.pluralCat(params.n);
					var trans = translation[plural];
					if (angular.isUndefined(trans)) {
						throw new Error('Plural form ' + plural + ' (' + params.n + ') for "' +
								translationId + '" is not provided');
					}
					return trans;
				}
				throw new Error('No translation match for "' + translationId + '"');
			};

			// select and interpolate translation from translation variant array
			var interpolate = function(translationId, translation, params) {
				var trans = selectTranslation(translationId, translation, params);
				return $interpolate(trans)(params);
			};

			var cleanUp = function(translationId) {
				if ($sniffer.msie && $sniffer.msie <= 8) {
					translationId = translationId.replace('<!--IE fix-->', '');
				}
				return translationId.trim();
			};

			return {
				translateLoaded: function(translationId, params) {
					addDefferedModules();
					addDefferedTranslations();
					var trans = _langs[use()].getTranslationLoaded(cleanUp(translationId));
					return trans && interpolate(translationId, trans, params) || undefined;
				},
				translate: function(translationId, params) {
					addDefferedModules();
					addDefferedTranslations();
					return _langs[use()].getTranslation(cleanUp(translationId))
						.then(function(translation) {
							return interpolate(translationId, translation, params);
						}
					);
				},
				use: use,
				addModule: function(module) {
					addModule(module);
					return this;
				},
				provide: function(lang, module, table) {
					getOrCreateLang(lang).getOrCreateModule(module).provide(table);
					return this;
				},
				reload: function(module) {
					var deferred = $q.defer();
					getOrCreateLang(use()).getModule(module).reload().then(function() {
						deferred.resolve(this);
					});
					return deferred.promise;
				},
				urlTemplate: function() {
					return _urlTemplate;
				}
			};
		}];
	})
	;
}(angular));