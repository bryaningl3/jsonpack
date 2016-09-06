module.exports = (() => {
	'use strict';

	return {
		write(buffer, value, offset) {
			return buffer.writeInt16BE(value, offset);
		},

		read(buffer, offset) {
			return buffer.readInt16BE(offset);
		},

		getByteLength(value) {
			return 2;
		},

		getName() {
			return 'int16';
		}
	};
})();