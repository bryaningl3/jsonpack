module.exports = (() => {
	'use strict';

	return {
		write(buffer, value, offset) {
			return buffer.writeInt32BE(value, offset);
		},

		read(buffer, offset) {
			return buffer.readInt32BE(offset);
		},

		getByteLength(value) {
			return 4;
		},

		getName() {
			return 'int32';
		}
	};
})();