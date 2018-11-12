module.exports = (() => {
	'use strict';

	return {
		convert(value) {
			return value.toString();
		},

		unconvert(value) {
			return Number.parseInt(value);
		},

		getName() {
			return 'int16';
		}
	};
})();