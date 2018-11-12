var boolean = require('./../../../../../lib/schema/binary/types/boolean');

describe('when checking the length of serialized boolean value', () => {
	describe('and the value is true', () => {
		it('should be one', () => {
			expect(boolean.getByteLength(true)).toEqual(1);
		});
	});

	describe('and the value is false', () => {
		it('should be one', () => {
			expect(boolean.getByteLength(false)).toEqual(1);
		});
	});
});

describe('when writing a boolean to a buffer', () => {
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
		buffer = allocateBuffer(1);
	});

	describe('and the value is true', () => {
		let writeOffset;

		beforeEach(() => {
			writeOffset = boolean.write(buffer, true, 0);
		});

		it('should write one byte to the buffer', () => {
			expect(writeOffset).toEqual(1);
		});

		describe('and the buffer is read', () => {
			let decoded;

			beforeEach(() => {
				decoded = boolean.read(buffer, 0);
			});

			it('should be a boolean value', () => {
				expect(typeof decoded).toEqual('boolean');
			});

			it('should be a true value', () => {
				expect(decoded).toEqual(true);
			});
		});
	});

	describe('and the value is false', () => {
		let writeOffset;

		beforeEach(() => {
			writeOffset = boolean.write(buffer, false, 0);
		});

		it('should write one byte to the buffer', () => {
			expect(writeOffset).toEqual(1);
		});

		describe('and the buffer is read', () => {
			let decoded;

			beforeEach(() => {
				decoded = boolean.read(buffer, 0);
			});

			it('should be a boolean value', () => {
				expect(typeof decoded).toEqual('boolean');
			});

			it('should be a true value', () => {
				expect(decoded).toEqual(false);
			});
		});
	});
});