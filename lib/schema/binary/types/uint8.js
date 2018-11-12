module.exports = (() => {
	'use strict';

	return {
		write(buffer, value, offset) {
			return buffer.writeUInt8(value, offset);
		},

		read(buffer, offset) {
			return buffer.readUInt8(offset);
		},

		getByteLength(value) {
			return 1;
		},

		getName() {
			return 'uint8';
		}
	};
})();