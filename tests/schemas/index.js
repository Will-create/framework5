/* eslint-disable */

require('../../index');
require('../../test');

// NEWSCHEMA()
// NEWACTION()
// ACTION()
// JSON schema types defined in the ACTIONS

F.console = NOOP;
var url = 'http://0.0.0.0:8000';
// load web server and test app
F.http();
ON('ready', function () {
	Test.push('NEWSCHEMA()', function (next) {
		// Test.print('String.slug()', [error]);

		var arr = [];
		var methods = ['query', 'read', 'update', 'patch', 'remove', 'insert'];
		var valid = [
			{ number: 123, email: 'abc@abc.abc', phone: '+421123456789', boolean: true, uid: UID(), url: 'https://www.totaljs.com', object: {}, date: NOW, json: '{}', base64: 'c3VwZXJ1c2Vy' },
			{ number: 123.123456, email: 'abc@abc.abc', boolean: '1', url: 'http://www.totaljs.com', date: new Date(), base64: 'c3VwZXJ1c2Vy' },
			{ email: 'abc.abc@abc.abc', url: 'http://totaljs.com' },
			{ url: 'https://totaljs.com' }
		];

		var invalid = [
			{ number: 'abc', email: 'ca@.sk', phone: 'notphone', boolean: '', uid: 'AV232CS@', url: 'url', date: 'today', json: null, base64: '' },
			{ number: 'one', email: '@', phone: '12345667', boolean: '', json: '', base64: '' }
		];

		var fields = [
			{ number: 123, email: 'ca@gmail.sk', phone: '+413233443344', boolean: false, uid: UID(), url: 'https://totaljs.com', date: NOW, json: '{"key":"value"}', base64: 'c3VwZXJ1c2Vy' },
			{ number: 1, email: 'slovakia@gmail.sk', phone: '+41543454323', boolean: false, uid: UID(), url: 'https://totaljs.com/community', date: NOW, json: '{"anotherkey":"anothervalue"}', base64: 'c3VwZXJ1c2Vy' },
		];
		function prefill_undefined(arr) {
			// Prefill missing fields in rows if 'undefined' based on index 0 row
			for (var i = 0; i < arr.length; i++) {
				for (var key in arr[0]) {
					if (typeof arr[i][key] === 'undefined')
						arr[i][key] = arr[0][key];
				}
			}
		};

		arr.push(function (next_fn) {
			methods.wait(function (item, fn) {
				RESTBuilder.GET(url + '/schema/methods/' + item).exec(function (err, res, output) {
					Test.print('Methods (GET) ' + item, err === null && res.success ? null : item + ' Failed');
					fn();
				});
			}, function () {
				next_fn();
			});
		});


		// Method data validation
		// arr.push(function(next_fn) {
		// 	var methods = [{ name: 'GET', validate: false }, { name: 'POST', validate: true }, { name: 'PUT', validate: true }, { name: 'PATCH', validate: true }, { name: 'DELETE', validate: true }];
		// 	methods.wait(function(method, next) {
		// 		RESTBuilder[method.name](url + '/schema/methods/validation').exec(function(err, res) {
		// 			if (method.validate) 
		// 				Test.print('Schema data validation - Should validate ' + method.name, err !== null && !res ? null : 'Should Validate');
		// 			else 
		// 				Test.print('Schema data validation - Should not validate ' + method.name, err === null && res  ? null : 'Should not validate');

		// 			next();
		// 		});
		// 	}, function() {
		// 		next_fn();
		// 	});
		// });

		// PATCH / DELETE with validation (invalid)
		arr.push(function(next_fn) {
			var methods = ['PATCH', 'DELETE'];

			methods.wait(function(method, next) {
				RESTBuilder[method](url + '/schema/methods/validation', { email: 'not_email' }).exec(function(err, res) {
					if (method) 
						Test.print('Validation - Invalid' + method, err !== null  ? null : 'Expected  error');
					next();
				});
			}, function() {
				next_fn();
			});
		});

		// PATCH / DELETE with validation (valid)
		arr.push(function(next_fn) {
			var methods = ['PATCH', 'DELETE'];

			methods.wait(function(method, next) {
				RESTBuilder[method](url + '/schema/methods/validation', { email: 'abc@abc.com' }).exec(function(err, res) {
					if (method) 
						Test.print('Validation - Valid' + method, err === null && res.success ? null : 'Expected  error');
					next();
				});
			}, function() {
				next_fn();
			});
		});
		arr.push(function (next_fn) {

			prefill_undefined(valid);

			valid.wait(function (item, func) {
				RESTBuilder.POST(url + '/schema/required/', item).exec(function (err) {
					var items = [];
					if (err && err.items && err.items.length)
						items = err.items.map(i => i.name + '(' + item[i.name] + ')');
					Test.print('Schema required (valid): ', !items.length ? null : 'fields are not valid --> ' + items);
					func();
				});
			}, function () {
				next_fn();
			});
		});


		arr.push(function (next_fn) {

			prefill_undefined(invalid);
			invalid.wait(function (item, func) {
				RESTBuilder.POST(url + '/schema/required/', item).exec(function (err) {
					// Remap
					var errors = [];
					if (err && err.items && err.items.length) {
						for (var i = 0; i < err.items.length; i++)
							errors.push(err.items[i].name);
					}

					// Check
					var keys = Object.keys(item);
					keys.wait(function (i, cb) {
						Test.print('Schema required (invalid): {0}({1})'.format(i, item[i]), errors.includes(i) ? null : 'field was accepted --> ' + i + '(' + item[i] + ')');
						cb();
					}, function () {
						func();
					});
				});
			}, function () {
				next_fn();
			});
		});

		var data = { value: { one: 'one', two: 'two' } };

		arr.push(function(next_fn) {
			RESTBuilder.POST(url + '/schema/chaining/one', data).exec(function(err, res) {
				Test.print('Schema chaining: one ', err === null && res.success && res.value === data.value.one ? null : ' Chaining failed - expecting \'{0}\' got \'{1}\' instead'.format(data.value.one, res.value));
				next_fn();
			});
		});

		arr.push(function(next_fn) {
			RESTBuilder.POST(url + '/schema/chaining/two', data).exec(function(err, res) {
				Test.print('Schema chaining: two ', err === null && res.success && res.value === data.value.two ? null : ' Chaining failed - expecting \'{0}\' got \'{1}\' instead'.format(data.value.one, res.value));
				next_fn();
			});
		});


		arr.push(function(next_fn) {
			var data = { countryid: 'sk' };
			RESTBuilder.POST(url + '/schema/verify/', data).exec(function(err, res) {
				Test.print('Schena Verify/Check ', err === null && res.success && res.value === data.countryid ? null : 'Schema verify is not as expected');
				next_fn();
			});

		});

		arr.push(function(next_fn) {
			var data = { countryid: 'hu' };
			RESTBuilder.POST(url + '/schema/verify/', data).exec(function(err, res) {
				Test.print('Schema verify',  err !== null  ? null : 'Schema verify returned value (It shouldn\'t)');
				next_fn();
			});
		});





		arr.async(function () {
			next();
		});
	});
	setTimeout(function () {
		Test.run(function() {
			process.exit(1);
		});
	}, 100);
});
