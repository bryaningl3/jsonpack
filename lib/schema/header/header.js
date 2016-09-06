var is = require('./../../utilities/is');

module.exports = (() => {
	'use strict';

	const PRESENT_MASK = 1 << 6;
	const UNDEFINED_MASK = 1 << 7;

	const FIELD_MASK = PRESENT_MASK | UNDEFINED_MASK;

	const header = {
		getByte(index, value) {
			let byte;

			if (is.null(value)) {
				byte = index;
			} else if (is.undefined(value)) {
				byte = index | UNDEFINED_MASK;
			} else {
				byte = index | PRESENT_MASK;
			}

			return byte;
		},

		getIndex(byte) {
			return byte & ~FIELD_MASK;
		},

		getValueIsPresent(byte) {
			return (byte & PRESENT_MASK) === PRESENT_MASK;
		},

		getValueIsNull(byte) {
			return !header.getValueIsPresent(byte) && !header.getValueIsUndefined(byte);
		},

		getValueIsUndefined(byte) {
			return (byte & UNDEFINED_MASK) === UNDEFINED_MASK;
		}
	};

	return header;
})();