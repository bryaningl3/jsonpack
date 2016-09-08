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

	describe('and the value is the maximum value (Math.pow(2, 7) - 1)', () => {
		let original;
		let writeOffset;

		beforeEach(() => {
			writeOffset = int8.write(buffer, original = Math.pow(2, 7) - 1, 0);
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

			it('should equal Math.pow(2, 7) - 1', () => {
				expect(decoded).toEqual(original);
			});
		});
	});

	describe('and the value is the minimum value (Math.pow(2, 7) * -1)', () => {
		let original;
		let writeOffset;

		beforeEach(() => {
			writeOffset = int8.write(buffer, original = Math.pow(2, 7) * -1, 0);
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

			it('should equal Math.pow(2, 7) * -1', () => {
				expect(decoded).toEqual(original);
			});
		});
	});

	describe('and the value is more than the maximum', () => {
		it('an exception should be thrown', () => {
			expect(() => int8.write(buffer, Math.pow(2, 7), 0)).toThrow();
		});
	});

	describe('and the value is less than the minimum', () => {
		it('an exception should be thrown', () => {
			expect(() => int8.write(buffer, (Math.pow(2, 7) * -1) - 1, 0)).toThrow();
		});
	});
});