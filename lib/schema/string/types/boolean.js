module.exports = (() => {
	'use strict';

	return {
		convert(value) {
			return value ? 'T' : 'F';
		},

		unconvert(value) {
			return value === 'T';
		},

		getName() {
			return 'boolean';
		}
	};
})();