module.exports = (() => {
	'use strict';

	return {
		write(buffer, value, offset) {
			return buffer.writeFloatBE(value, offset);
		},

		read(buffer, offset) {
			return buffer.readFloatBE(offset);
		},

		getByteLength(value) {
			return 4;
		},

		getName() {
			return 'float';
		}
	};
})();