var boolean = require('./../../../../lib/schema/types/boolean');

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
	let writeOffset;

	beforeEach(() => {
		buffer = allocateBuffer(1);
		writeOffset = 0;
	});

	describe('and the value is true', () => {
		beforeEach(() => {
			boolean.write(buffer, true, writeOffset);
		});

		describe('and the buffer is read', () => {
			let value;
			let readOffset;

			beforeEach(() => {
				readOffset = 0;

				value = boolean.read(buffer, readOffset);
			});

			it('should be a boolean value', () => {
				expect(typeof value).toEqual('boolean');
			});

			it('should be a true value', () => {
				expect(value).toEqual(true);
			});
		});
	});

	describe('and the value is false', () => {
		beforeEach(() => {
			boolean.write(buffer, false, writeOffset);
		});

		describe('and the buffer is read', () => {
			let value;
			let readOffset;

			beforeEach(() => {
				readOffset = 0;

				value = boolean.read(buffer, readOffset);
			});

			it('should be a boolean value', () => {
				expect(typeof value).toEqual('boolean');
			});

			it('should be a true value', () => {
				expect(value).toEqual(false);
			});
		});
	});
});