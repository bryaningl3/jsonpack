module.exports = (() => {
	'use strict';

	return {
		write(buffer, value, offset) {
			return buffer.writeDoubleBE(value, offset);
		},

		read(buffer, offset) {
			return buffer.readDoubleBE(offset);
		},

		getByteLength(value) {
			return 8;
		},

		getName() {
			return 'double';
		}
	};
})();