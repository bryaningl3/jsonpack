module.exports = (() => {
	'use strict';

	const string = {
		convert(value) {
			return value;
		},

		unconvert(value) {
			return value;
		},

		getName() {
			return 'string';
		}
	};

	return string;
})();