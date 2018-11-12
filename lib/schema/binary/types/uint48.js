module.exports = (() => {
	'use strict';

	return {
		write(buffer, value, offset) {
			return buffer.writeUIntBE(value, offset, 6);
		},

		read(buffer, offset) {
			return buffer.readUIntBE(offset, 6);
		},

		getByteLength(value) {
			return 6;
		},

		getName() {
			return 'uint48';
		}
	};
})();