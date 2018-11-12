var header = require('./../../../../../lib/schema/binary/header/header');

describe('when generating a header byte', () => {
	'use strict';

	describe('for a value that exists', () => {
		let index;
		let value;

		let byte;

		beforeEach(() => {
			byte = header.getByte(index = 13, value = 'a byte that is neither null or undefined');
		});

		it('the header byte should be a number', () => {
			expect(typeof byte).toEqual('number');
		});

		it('the header byte should be one byte long', () => {
			expect(byte >>> 8).toEqual(0);
		});

		it ('the header byte should contain the field index', () => {
			expect(header.getIndex(byte)).toEqual(index);
		});

		it ('the header byte should indicate a value is present', () => {
			expect(header.getValueIsPresent(byte)).toEqual(true);
		});

		it ('the header byte should not indicate a null value', () => {
			expect(header.getValueIsNull(byte)).toEqual(false);
		});

		it ('the header byte should not indicate an undefined value', () => {
			expect(header.getValueIsUndefined(byte)).toEqual(false);
		});
	});

	describe('for a null value', () => {
		let index;
		let value;

		let byte;

		beforeEach(() => {
			byte = header.getByte(index = 13, value = null);
		});

		it('the header byte should be a number', () => {
			expect(typeof byte).toEqual('number');
		});

		it('the header byte should be one byte long', () => {
			expect(byte >>> 8).toEqual(0);
		});

		it ('the header byte should contain the field index', () => {
			expect(header.getIndex(byte)).toEqual(index);
		});

		it ('the header byte should indicate a value is not present', () => {
			expect(header.getValueIsPresent(byte)).toEqual(false);
		});

		it ('the header byte should indicate a null value', () => {
			expect(header.getValueIsNull(byte)).toEqual(true);
		});

		it ('the header byte should not indicate an undefined byte', () => {
			expect(header.getValueIsUndefined(byte)).toEqual(false);
		});
	});

	describe('for an undefined value', () => {
		let index;
		let value;

		let byte;

		beforeEach(() => {
			byte = header.getByte(index = 13, value = undefined);
		});

		it('the header byte should be a number', () => {
			expect(typeof byte).toEqual('number');
		});

		it('the header byte should be one byte long', () => {
			expect(byte >>> 8).toEqual(0);
		});

		it ('the header byte should contain the field index', () => {
			expect(header.getIndex(byte)).toEqual(index);
		});

		it ('the header byte should indicate a value is not present', () => {
			expect(header.getValueIsPresent(byte)).toEqual(false);
		});

		it ('the header byte should not indicate a null value', () => {
			expect(header.getValueIsNull(byte)).toEqual(false);
		});

		it ('the header byte should indicate an undefined byte', () => {
			expect(header.getValueIsUndefined(byte)).toEqual(true);
		});
	});
});