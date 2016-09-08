var int16 = require('./../../../../lib/schema/types/int16');

describe('when checking the length of serialized int16 instance', () => {
	describe('and the value is zero', () => {
		it('should be 2', () => {
			expect(int16.getByteLength(0)).toEqual(2);
		});
	});
});

describe('when writing a int16 to a buffer', () => {
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
		buffer = allocateBuffer(4);
	});

	describe('and the value is 42', () => {
		let original;
		let writeOffset;

		beforeEach(() => {
			writeOffset = int16.write(buffer, original = 42, 0);
		});

		it('should write two bytes to the buffer', () => {
			expect(writeOffset).toEqual(2);
		});

		describe('and the buffer is read', () => {
			let decoded;

			beforeEach(() => {
				decoded = int16.read(buffer, 0);
			});

			it('should be a int16 value', () => {
				expect(typeof decoded).toEqual('number');
			});

			it('should equal 42', () => {
				expect(decoded).toEqual(original);
			});
		});
	});

	describe('and the value is the maximum value (32767)', () => {
		let original;
		let writeOffset;

		beforeEach(() => {
			writeOffset = int16.write(buffer, original = 32767, 0);
		});

		it('should write two bytes to the buffer', () => {
			expect(writeOffset).toEqual(2);
		});

		describe('and the buffer is read', () => {
			let decoded;

			beforeEach(() => {
				decoded = int16.read(buffer, 0);
			});

			it('should be a int16 value', () => {
				expect(typeof decoded).toEqual('number');
			});

			it('should equal 32767', () => {
				expect(decoded).toEqual(original);
			});
		});
	});

	describe('and the value is the minimum value (-32768)', () => {
		let original;
		let writeOffset;

		beforeEach(() => {
			writeOffset = int16.write(buffer, original = -32768, 0);
		});

		it('should write two bytes to the buffer', () => {
			expect(writeOffset).toEqual(2);
		});

		describe('and the buffer is read', () => {
			let decoded;

			beforeEach(() => {
				decoded = int16.read(buffer, 0);
			});

			it('should be a int16 value', () => {
				expect(typeof decoded).toEqual('number');
			});

			it('should equal -32768', () => {
				expect(decoded).toEqual(original);
			});
		});
	});

	describe('and the value is 32768', () => {
		it('an exception should be thrown', () => {
			expect(() => int16.write(buffer, 32768, 0)).toThrow();
		});
	});

	describe('and the value is -32769', () => {
		it('an exception should be thrown', () => {
			expect(() => int16.write(buffer, -32769, 0)).toThrow();
		});
	});
});