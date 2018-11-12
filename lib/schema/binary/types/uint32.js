module.exports = (() => {
	'use strict';

	return {
		write(buffer, value, offset) {
			return buffer.writeUInt32BE(value, offset);
		},

		read(buffer, offset) {
			return buffer.readUInt32BE(offset);
		},

		getByteLength(value) {
			return 4;
		},

		getName() {
			return 'uint32';
		}
	};
})();