module.exports = (() => {
	'use strict';

	return {
		convert(value) {
			return value.toString();
		},

		unconvert(value) {
			return Number.parseFloat(value);
		},

		getName() {
			return 'float';
		}
	};
})();