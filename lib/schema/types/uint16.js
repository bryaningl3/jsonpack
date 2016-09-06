module.exports = (() => {
	'use strict';

	return {
		write(buffer, value, offset) {
			return buffer.writeUInt16BE(value, offset);
		},

		read(buffer, offset) {
			return buffer.readUInt16BE(offset);
		},

		getByteLength(value) {
			return 2;
		},

		getName() {
			return 'uint16';
		}
	};
})();