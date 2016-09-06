module.exports = (() => {
	'use strict';

	return {
		write(buffer, value, offset) {
			return buffer.writeIntBE(value, offset, 6);
		},

		read(buffer, offset) {
			return buffer.readIntBE(offset, 6);
		},

		getByteLength(value) {
			return 6;
		},

		getName() {
			return 'int48';
		}
	};
})();