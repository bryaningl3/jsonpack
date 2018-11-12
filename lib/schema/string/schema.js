const is = require('./../../utilities/is');

const boolean = require('./types/boolean'),
	date = require('./types/date'),
	double = require('./types/double'),
	float = require('./types/float'),
	int8 = require('./types/int8'),
	int16 = require('./types/int16'),
	int32 = require('./types/int32'),
	string = require('./types/string'),
	uint8 = require('./types/uint8'),
	uint16 = require('./types/uint16'),
	uint32 = require('./types/uint32'),
	uint48 = require('./types/uint48');

module.exports = (() => {
	'use strict';

	const types = [
		boolean,
		date,
		double,
		float,
		int8,
		int16,
		int32,
		string,
		uint8,
		uint16,
		uint32,
		uint48
	].reduce((map, type) => {
		const name = type.getName();

		map[name] = type;

		return map;
	}, { });
	
	let tokens = {
		a: String.fromCharCode(18),
		d: String.fromCharCode(7),
		p: String.fromCharCode(17),
		u: String.fromCharCode(19),
		n: String.fromCharCode(20)
	};

	return {
		create: (fields, options) => {
			let tokensToUse;
			
			if (options && options.tokens) {
				tokensToUse = options.tokens;
			} else {
				tokensToUse = tokens;
			}
			
			const schema = fields.reduce((accumulator, field, index) => {
				const name = field.name;

				const definition = {
					name: name,
					index: index,
					type: types[field.type]
				};

				accumulator.map[name] = definition;
				accumulator.sequence.push(definition);

				return accumulator;
			}, { map: { }, sequence: [ ] });

			return {
				encode: (json) => {
					const data = fields.reduce((accumulator, field, i) => {
						const name = field.name;

						const present = json.hasOwnProperty(name);

						let header = tokensToUse.a;
						let converted = '';

						if (present) {
							const value = json[name];

							if (is.undefined(value)) {
								header = tokensToUse.u;
							} else if (is.null(value)) {
								header = tokensToUse.n;
							} else {
								header = tokensToUse.p;
								converted = `${schema.sequence[i].type.convert(value)}`;
							}
						}

						accumulator.push(`${header}${converted}`);

						return accumulator;
					}, [ ]);

					return data.join(tokensToUse.d);
				},
				decode: (data) => {
					const values = data.split(tokensToUse.d);

					return values.reduce((accumulator, s, i) => {
						const header = s.charAt(0);

						if (header !== tokensToUse.a) {
							const definition = schema.sequence[i];

							let value;

							if (header === tokensToUse.u) {
								value = undefined;
							} else if (header === tokensToUse.n) {
								value = null;
							} else {
								value = definition.type.unconvert(s.substring(1));
							}

							accumulator[definition.name] = value;
						}

						return accumulator;
					}, { });
				}
			};
		}
	};
})();