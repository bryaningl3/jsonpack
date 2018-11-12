const factory = require('./../../../../lib/schema/string/schema');

describe('when generating a schema', () => {
	'use strict';

	describe('composed of [ { name: "miles", type: "int32" } ]', () => {
		let schema;

		beforeEach(() => {
			schema = factory.create([ { name: "miles", type: "int32" } ]);
		});

		describe('and serializing { miles: 41 }', () => {
			let serialized;

			beforeEach(() => {
				serialized = schema.encode({ miles: 41 });
			});

			it('should be a string', () => {
				expect(typeof serialized).toEqual('string');
			});

			describe('and deserializing', () => {
				let deserialized;

				beforeEach(() => {
					deserialized = schema.decode(serialized);
				});

				it('should be an object', () => {
					expect(typeof deserialized).toEqual('object');
				});

				it('should contain the miles field', function() {
					expect(deserialized.hasOwnProperty('miles')).toEqual(true);
				});

				it('should have a value of 41 for the miles field', function() {
					expect(deserialized.miles).toEqual(41);
				});
			});
		});

		describe('and serializing { miles: null }', () => {
			let serialized;

			beforeEach(() => {
				serialized = schema.encode({ miles: null });
			});

			it('should be a string', () => {
				expect(typeof serialized).toEqual('string');
			});

			describe('and deserializing', () => {
				let deserialized;

				beforeEach(() => {
					deserialized = schema.decode(serialized);
				});

				it('should be an object', () => {
					expect(typeof deserialized).toEqual('object');
				});

				it('should contain the miles field', function() {
					expect(deserialized.hasOwnProperty('miles')).toEqual(true);
				});

				it('should have a null value for the miles field', function() {
					expect(deserialized.miles).toEqual(null);
				});
			});
		});

		describe('and serializing { miles: undefined }', () => {
			let serialized;

			beforeEach(() => {
				serialized = schema.encode({ miles: undefined });
			});

			it('should be a string', () => {
				expect(typeof serialized).toEqual('string');
			});

			describe('and deserializing', () => {
				let deserialized;

				beforeEach(() => {
					deserialized = schema.decode(serialized);
				});

				it('should be an object', () => {
					expect(typeof deserialized).toEqual('object');
				});

				it('should contain the miles field', function() {
					expect(deserialized.hasOwnProperty('miles')).toEqual(true);
				});

				it('should have an undefined value for the miles field', function() {
					expect(deserialized.miles).toEqual(undefined);
				});
			});
		});

		describe('and serializing { }', () => {
			let serialized;

			beforeEach(() => {
				serialized = schema.encode({ });
			});

			it('should be a string', () => {
				expect(typeof serialized).toEqual('string');
			});

			describe('and deserializing', () => {
				let deserialized;

				beforeEach(() => {
					deserialized = schema.decode(serialized);
				});

				it('should be an object', () => {
					expect(typeof deserialized).toEqual('object');
				});

				it('should not contain the miles field', function() {
					expect(deserialized.hasOwnProperty('miles')).toEqual(false);
				});
			});
		});

		describe('and serializing { kilometers: 0.621 }', () => {
			let serialized;

			beforeEach(() => {
				serialized = schema.encode({ kilometers: 0.621 });
			});

			it('should be a string', () => {
				expect(typeof serialized).toEqual('string');
			});

			describe('and deserializing', () => {
				let deserialized;

				beforeEach(() => {
					deserialized = schema.decode(serialized);
				});

				it('should be an object', () => {
					expect(typeof deserialized).toEqual('object');
				});

				it('should not contain the miles field', function() {
					expect(deserialized.hasOwnProperty('miles')).toEqual(false);
				});
			});
		});
	});

	describe('composed of [ { name: "amount", type: "double" }, { name: "units", type: "string" } ]', () => {
		let schema;

		beforeEach(() => {
			schema = factory.create([ { name: "amount", type: "double" }, { name: "units", type: "string" } ]);
		});

		describe('and serializing { amount: Math.PI, units: "radians" }', () => {
			let serialized;

			beforeEach(() => {
				serialized = schema.encode({ amount: Math.PI, units: "radians" });
			});

			it('should be a string', () => {
				expect(typeof serialized).toEqual('string');
			});

			describe('and deserializing', () => {
				let deserialized;

				beforeEach(() => {
					deserialized = schema.decode(serialized);
				});

				it('should be an object', () => {
					expect(typeof deserialized).toEqual('object');
				});

				it('should contain the amount field', function() {
					expect(deserialized.hasOwnProperty('amount')).toEqual(true);
				});

				it('should have a value of Math.PI for the amount field', function() {
					expect(deserialized.amount).toEqual(Math.PI);
				});

				it('should contain the units field', function() {
					expect(deserialized.hasOwnProperty('units')).toEqual(true);
				});

				it('should have a value of "radians" for the units field', function() {
					expect(deserialized.units).toEqual("radians");
				});
			});
		});

		describe('and serializing { amount: 180 }', () => {
			let serialized;

			beforeEach(() => {
				serialized = schema.encode({ amount: 180 });
			});

			it('should be a string', () => {
				expect(typeof serialized).toEqual('string');
			});

			describe('and deserializing', () => {
				let deserialized;

				beforeEach(() => {
					deserialized = schema.decode(serialized);
				});

				it('should be an object', () => {
					expect(typeof deserialized).toEqual('object');
				});

				it('should contain the amount field', function() {
					expect(deserialized.hasOwnProperty('amount')).toEqual(true);
				});

				it('should have a value of 180 for the amount field', function() {
					expect(deserialized.amount).toEqual(180);
				});

				it('should not contain the units field', function() {
					expect(deserialized.hasOwnProperty('units')).toEqual(false);
				});
			});
		});

		describe('and serializing { units: "degrees" }', () => {
			let serialized;

			beforeEach(() => {
				serialized = schema.encode({ units: "degrees" });
			});

			it('should be a string', () => {
				expect(typeof serialized).toEqual('string');
			});

			describe('and deserializing', () => {
				let deserialized;

				beforeEach(() => {
					deserialized = schema.decode(serialized);
				});

				it('should be an object', () => {
					expect(typeof deserialized).toEqual('object');
				});

				it('should not contain the amount field', function() {
					expect(deserialized.hasOwnProperty('amount')).toEqual(false);
				});

				it('should contain the units field', function() {
					expect(deserialized.hasOwnProperty('units')).toEqual(true);
				});

				it('should have a value of "degrees" for the units field', function() {
					expect(deserialized.units).toEqual("degrees");
				});
			});
		});

		describe('and serializing { }', () => {
			let serialized;

			beforeEach(() => {
				serialized = schema.encode({ });
			});

			it('should be a string', () => {
				expect(typeof serialized).toEqual('string');
			});

			describe('and deserializing', () => {
				let deserialized;

				beforeEach(() => {
					deserialized = schema.decode(serialized);
				});

				it('should be an object', () => {
					expect(typeof deserialized).toEqual('object');
				});

				it('should not contain the amount field', function() {
					expect(deserialized.hasOwnProperty('amount')).toEqual(false);
				});

				it('should not contain the units field', function() {
					expect(deserialized.hasOwnProperty('units')).toEqual(false);
				});
			});
		});
	});
});