var int48 = require('./int48');

module.exports = (() => {
	'use strict';

	return {
		write(buffer, value, offset) {
			return int48.write(buffer, value.getTime(), offset);
		},

		read(buffer, offset) {
			return new Date(int48.read(buffer, offset));
		},

		getByteLength(value) {
			return int48.getByteCount(0);
		},

		getName() {
			return 'date';
		}
	};
})();