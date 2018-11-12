const uint48 = require('./uint48');

module.exports = (() => {
	'use strict';

	return {
		convert(value) {
			return uint48.convert(value.getTime());
		},

		unconvert(value) {
			return new Date(uint48.unconvert(value));
		},

		getName() {
			return 'date';
		}
	};
})();