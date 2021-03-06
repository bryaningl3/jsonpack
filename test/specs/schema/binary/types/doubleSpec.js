var double = require('./../../../../../lib/schema/binary/types/double');

describe('when checking the length of serialized double instance', () => {
	describe('and the value is Math.E', () => {
		it('should be 8', () => {
			expect(double.getByteLength(Math.E)).toEqual(8);
		});
	});
});

describe('when writing a double to a buffer', () => {
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
		buffer = allocateBuffer(8);
	});

	describe('and the value is Math.E', () => {
		let original;
		let writeOffset;

		beforeEach(() => {
			writeOffset = double.write(buffer, original = Math.E, 0);
		});

		it('should write eight bytes to the buffer', () => {
			expect(writeOffset).toEqual(8);
		});

		describe('and the buffer is read', () => {
			let decoded;

			beforeEach(() => {
				decoded = double.read(buffer, 0);
			});

			it('should be a number', () => {
				expect(typeof decoded).toEqual('number');
			});

			it('should equal Math.E', () => {
				expect(decoded).toEqual(original);
			});
		});
	});

	describe('and the value is one third', () => {
		let original;
		let writeOffset;

		beforeEach(() => {
			writeOffset = double.write(buffer, original = (1 / 3), 0);
		});

		it('should write eight bytes to the buffer', () => {
			expect(writeOffset).toEqual(8);
		});

		describe('and the buffer is read', () => {
			let decoded;

			beforeEach(() => {
				decoded = double.read(buffer, 0);
			});

			it('should be a number', () => {
				expect(typeof decoded).toEqual('number');
			});

			it('should equal one third', () => {
				expect(decoded).toEqual((1 / 3));
			});
		});
	});
});