const binary = require('./lib/schema/binary/schema'),
	string = require('./lib/schema/string/schema');

module.exports = (() => {
	'use strict';

	return {
		binary: binary,
		string: string
	};
})();