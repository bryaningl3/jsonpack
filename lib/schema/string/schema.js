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
	
	let TOKEN = {
		DELIMITER: '|',
		ABSENT: '-',
		PRESENT: '+',
		UNDEFINED: '<',
		NULL: '>'
	};

	return {
		create: (fields) => {
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

						let header = TOKEN.ABSENT;
						let converted = '';

						if (present) {
							const value = json[name];

							if (is.undefined(value)) {
								header = TOKEN.UNDEFINED;
							} else if (is.null(value)) {
								header = TOKEN.NULL;
							} else {
								header = TOKEN.PRESENT;
								converted = `${schema.sequence[i].type.convert(value)}`;
							}
						}

						accumulator.push(`${header}${converted}`);

						return accumulator;
					}, [ ]);

					return data.join(TOKEN.DELIMITER);
				},
				decode: (data) => {
					const values = data.split(TOKEN.DELIMITER);

					return values.reduce((accumulator, s, i) => {
						const header = s.charAt(0);

						if (header !== TOKEN.ABSENT) {
							const definition = schema.sequence[i];

							let value;

							if (header === TOKEN.UNDEFINED) {
								value = undefined;
							} else if (header === TOKEN.NULL) {
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