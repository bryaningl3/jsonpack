var date = require('./../../../../../lib/schema/binary/types/date');

describe('when checking the length of serialized date instance', () => {
	describe('and the value is now', () => {
		it('should be six', () => {
			expect(date.getByteLength(new Date())).toEqual(6);
		});
	});
});

describe('when writing a date to a buffer', () => {
	'use strict';

	const allocateBuffer = (() => {
		if (typeof(Buffer.allocUnsafe) === 'function') {
			return Buffer.allocUnsafe;
		} else {
			return function(size) {
				return new Buffer(size);
			};
		}
	})();

	let buffer;

	beforeEach(() => {
		buffer = allocateBuffer(6);
	});

	describe('and the value is now', () => {
		let original;
		let writeOffset;

		beforeEach(() => {
			writeOffset = date.write(buffer, original = new Date(), 0);
		});

		it('should write six bytes to the buffer', () => {
			expect(writeOffset).toEqual(6);
		});

		describe('and the buffer is read', () => {
			let decoded;

			beforeEach(() => {
				decoded = date.read(buffer, 0);
			});

			it('should be a date value', () => {
				expect(decoded instanceof Date).toEqual(true);
			});

			it('should be have the correct time value', () => {
				expect(decoded.getTime()).toEqual(original.getTime());
			});
		});
	});
});