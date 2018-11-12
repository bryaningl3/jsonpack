const uint8 = require('./uint8');

module.exports = (() => {
	'use strict';

	return {
		write(buffer, value, offset) {
			return uint8.write(buffer, value ? 1 : 0, offset);
		},

		read(buffer, offset) {
			return uint8.read(buffer, offset) === 1;
		},

		getByteLength(value) {
			return uint8.getByteLength(false);
		},

		getName() {
			return 'boolean';
		}
	};
})();