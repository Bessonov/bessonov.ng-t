[![Sauce Test Status](https://saucelabs.com/browser-matrix/Bessonov.svg)](https://saucelabs.com/u/Bessonov)

# Translation module for AngularJS

There are many translate modules for AngularJS. After some pain and non-deterministic behavior in one of them ng-t was born.

ng-t provide some basic features which I needed at the time.

##### 1. Lazy loaded translations

I don't want to load a whole bunch of translations in the browser. There is a basic concept of modules.
A module is just a snippet with translations which can be loaded lazily or provided.
The core idea is to have modules like 'startpage', 'account' etc.

To configure ng-t:

```javascript
angular.module('MyApp', ['bessonov.ng-t'])

.config(['tProvider', function(tProvider) {
	tProvider.fallbackLanguage('de');
}])
```

This load json files from ``` '/static/' + module + '/i18n/' + lang + '.json' ```

To change the loading path you can pass function:
```javascript
tProvider.urlTemplate(function(lang, module) {
	return '/static/' + module + '/i18n/' + lang + '.json';
});
```
or just set a base url:
```javascript
tProvider.setBaseUrl('/static/');
```


To activate some module you can do it in config-phase:
```javascript
tProvider.addModule('startpage');
```

Or wherever you want:

```javascript
.controller('MyCtrl', ['t', function(t) {
	t.addModule('account');
}])
```

json file must contain valid json (quotes are important):
```json
{
	"User": "Пользователь"
}
```

##### 2. Provided translations

For performance reason it is possible to provide translations for preferred languages:

```javascript
angular.module('MyApp', ['bessonov.ng-t'])

.config(['tProvider', function(tProvider) {
		tProvider.provide('de', 'startpage', {
			'User': 'Benutzer'
		});
	}])
;
```

##### 3. Extended pluralization

Most of translation solutions offer pluralization just for singular or plural.
But there are languages, in which are more than two forms exist.
In Russian, for instance, there are three plural forms.
The rules are [complex](http://www.unicode.org/cldr/charts/latest/supplemental/language_plural_rules.html).
Fortunately, AngularJS provide [$locale](https://docs.angularjs.org/api/ng/service/$locale) with non public implementation of them.
To use them, we need loader. I tested it with [angular-dynamic-locale](https://github.com/lgalfaso/angular-dynamic-locale).
First, we need pair this loader with ng-t (don't forget to declare a dependency to 'tmh.dynamicLocale' in your module and configure it):

```javascript
angular.module('MyApp', ['tmh.dynamicLocale', 'bessonov.ng-t'])

// configure tmh.dynamicLocale
.config(['tmhDynamicLocaleProvider', function(tmhDynamicLocaleProvider) {
	tmhDynamicLocaleProvider
		.localeLocationPattern('https://code.angularjs.org/1.2.29/i18n/angular-locale_{{locale}}.js');
}])

// create a pluralizationLoader-service to use it with ng-t
.service('pluralizationLoader', ['tmhDynamicLocale', function(tmhDynamicLocale) {
	return {
		load: tmhDynamicLocale.set
	};
}])

// tell ng-t to use pluralizationLoader
.config(['tProvider', function(tProvider) {
	tProvider.setPluralizationLoader('pluralizationLoader');
}])

```
The important thing is a function 'load', which must return a promise.

Then you can provide translation (or load from json file):

```javascript
t.provide('ru', 'calendar', {
	'Day': {
		'one': '{{ n }} день', // One day
		'few': '{{ n }} дня', // Two days
		'many': '{{ n }} дней' // Five days
	}
});
```


##### 4. Translation directive and filter

It's simple as it is:

```html
<t>User</t>
<p t>User</p>
<span t="{n: sinceDays}">Day</span>
<span>{{ 'User' | t }}</span>
<span>{{ 'Day' | t:'{n: sinceDays}' }}</span>
```
## How to get it

Bower:
```bash
bower install --save Bessonov/bessonov.ng-t.dist
```
HTML:
```html
<script src="https://cdn.rawgit.com/Bessonov/bessonov.ng-t.dist/0.0.6/bessonov.ng-t.min.js"></script>
```

## License

The MIT License (MIT)
Copyright (c) 2016 Anton Bessonov

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
