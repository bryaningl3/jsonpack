var float = require('./../../../../lib/schema/types/float');

describe('when checking the length of serialized float instance', () => {
	describe('and the value is 1.5', () => {
		it('should be 4', () => {
			expect(float.getByteLength(1.5)).toEqual(4);
		});
	});
});

describe('when writing a float to a buffer', () => {
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

	describe('and the value is 1.5', () => {
		let original;
		let writeOffset;

		beforeEach(() => {
			writeOffset = float.write(buffer, original = 1.5, 0);
		});

		it('should write four bytes to the buffer', () => {
			expect(writeOffset).toEqual(4);
		});

		describe('and the buffer is read', () => {
			let decoded;

			beforeEach(() => {
				decoded = float.read(buffer, 0);
			});

			it('should be a float value', () => {
				expect(typeof decoded).toEqual('number');
			});

			it('should equal 1.5', () => {
				expect(decoded).toEqual(original);
			});
		});
	});
});