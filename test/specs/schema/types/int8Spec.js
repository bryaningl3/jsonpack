var int8 = require('./../../../../lib/schema/types/int8');

describe('when checking the length of serialized int8 instance', () => {
	describe('and the value is zero', () => {
		it('should be 1', () => {
			expect(int8.getByteLength(0)).toEqual(1);
		});
	});
});

describe('when writing a int8 to a buffer', () => {
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

	describe('and the value is 42', () => {
		let original;
		let writeOffset;

		beforeEach(() => {
			writeOffset = int8.write(buffer, original = 42, 0);
		});

		it('should write one byte to the buffer', () => {
			expect(writeOffset).toEqual(1);
		});

		describe('and the buffer is read', () => {
			let decoded;

			beforeEach(() => {
				decoded = int8.read(buffer, 0);
			});

			it('should be a int8 value', () => {
				expect(typeof decoded).toEqual('number');
			});

			it('should equal 42', () => {
				expect(decoded).toEqual(original);
			});
		});
	});

	describe('and the value is the maximum value (127)', () => {
		let original;
		let writeOffset;

		beforeEach(() => {
			writeOffset = int8.write(buffer, original = 127, 0);
		});

		it('should write one byte to the buffer', () => {
			expect(writeOffset).toEqual(1);
		});

		describe('and the buffer is read', () => {
			let decoded;

			beforeEach(() => {
				decoded = int8.read(buffer, 0);
			});

			it('should be a int8 value', () => {
				expect(typeof decoded).toEqual('number');
			});

			it('should equal 127', () => {
				expect(decoded).toEqual(original);
			});
		});
	});

	describe('and the value is the minimum value (-128)', () => {
		let original;
		let writeOffset;

		beforeEach(() => {
			writeOffset = int8.write(buffer, original = -128, 0);
		});

		it('should write one byte to the buffer', () => {
			expect(writeOffset).toEqual(1);
		});

		describe('and the buffer is read', () => {
			let decoded;

			beforeEach(() => {
				decoded = int8.read(buffer, 0);
			});

			it('should be a int8 value', () => {
				expect(typeof decoded).toEqual('number');
			});

			it('should equal -128', () => {
				expect(decoded).toEqual(original);
			});
		});
	});

	describe('and the value is 128', () => {
		it('an exception should be thrown', () => {
			expect(() => int8.write(buffer, 128, 0)).toThrow();
		});
	});

	describe('and the value is -129', () => {
		it('an exception should be thrown', () => {
			expect(() => int8.write(buffer, -129, 0)).toThrow();
		});
	});
});