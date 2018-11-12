module.exports = (() => {
	'use strict';

	return {
		write(buffer, value, offset) {
			return buffer.writeInt8(value, offset);
		},

		read(buffer, offset) {
			return buffer.readInt8(offset);
		},

		getByteLength(value) {
			return 1;
		},

		getName() {
			return 'int8';
		}
	};
})();