const uint48 = require('./uint48');

module.exports = (() => {
	'use strict';

	return {
		write(buffer, value, offset) {
			return uint48.write(buffer, value.getTime(), offset);
		},

		read(buffer, offset) {
			return new Date(uint48.read(buffer, offset));
		},

		getByteLength(value) {
			return uint48.getByteLength(0);
		},

		getName() {
			return 'date';
		}
	};
})();