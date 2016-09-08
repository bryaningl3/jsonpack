var uint32 = require('./../../../../lib/schema/types/uint32');

describe('when checking the length of serialized uint32 instance', () => {
	describe('and the value is zero', () => {
		it('should be 4', () => {
			expect(uint32.getByteLength(0)).toEqual(4);
		});
	});
});

describe('when writing a uint32 to a buffer', () => {
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
			writeOffset = uint32.write(buffer, original = 42, 0);
		});

		it('should write four bytes to the buffer', () => {
			expect(writeOffset).toEqual(4);
		});

		describe('and the buffer is read', () => {
			let decoded;

			beforeEach(() => {
				decoded = uint32.read(buffer, 0);
			});

			it('should be a number', () => {
				expect(typeof decoded).toEqual('number');
			});

			it('should equal 42', () => {
				expect(decoded).toEqual(original);
			});
		});
	});

	describe('and the value is the maximum value (Math.pow(2, 32) - 1)', () => {
		let original;
		let writeOffset;

		beforeEach(() => {
			writeOffset = uint32.write(buffer, original = Math.pow(2, 32) - 1, 0);
		});

		it('should write four bytes to the buffer', () => {
			expect(writeOffset).toEqual(4);
		});

		describe('and the buffer is read', () => {
			let decoded;

			beforeEach(() => {
				decoded = uint32.read(buffer, 0);
			});

			it('should be a number', () => {
				expect(typeof decoded).toEqual('number');
			});

			it('should equal Math.pow(2, 32) - 1', () => {
				expect(decoded).toEqual(original);
			});
		});
	});

	describe('and the value is the minimum value (0)', () => {
		let original;
		let writeOffset;

		beforeEach(() => {
			writeOffset = uint32.write(buffer, original = 0, 0);
		});

		it('should write four bytes to the buffer', () => {
			expect(writeOffset).toEqual(4);
		});

		describe('and the buffer is read', () => {
			let decoded;

			beforeEach(() => {
				decoded = uint32.read(buffer, 0);
			});

			it('should be a nushould be a uint32 valuember', () => {
				expect(typeof decoded).toEqual('number');
			});

			it('should equal 0', () => {
				expect(decoded).toEqual(original);
			});
		});
	});

	describe('and the value is more than the maximum', () => {
		it('an exception should be thrown', () => {
			expect(() => uint32.write(buffer, Math.pow(2, 32), 0)).toThrow();
		});
	});

	describe('and the value is less than the minimum', () => {
		it('an exception should be thrown', () => {
			expect(() => uint32.write(buffer, -1, 0)).toThrow();
		});
	});
});