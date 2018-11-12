const uint16 = require('./uint16');

module.exports = (() => {
	'use strict';

	const string = {
		write(buffer, value, offset) {
			const valueLength = getValueLength(value);
			const valueOffset = uint16.write(buffer, valueLength, offset);

			return valueOffset + buffer.write(value, valueOffset, valueLength, 'utf8');
		},

		read(buffer, offset) {
			const valueLength = uint16.read(buffer, offset);
			const headerLength = uint16.getByteLength(valueLength);

			const start = headerLength + offset;
			const end = start + valueLength;

			return buffer.toString('utf8', start, end);
		},

		getByteLength(value) {
			const valueLength = getValueLength(value);

			return valueLength + uint16.getByteLength(valueLength);
		},

		getName() {
			return 'string';
		}
	};

	function getValueLength(value) {
		return Buffer.byteLength(value, 'utf8');
	}

	return string;
})();