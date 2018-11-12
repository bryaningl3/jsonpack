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

	const STRING_PRESENT = String.fromCharCode(17);
	const STRING_ABSENT = String.fromCharCode(18);
	const STRING_UNDEFINDED = String.fromCharCode(19);
	const STRING_NULL = String.fromCharCode(20);
	const STRING_DELIMITER = String.fromCharCode(7);

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

						let header = STRING_ABSENT;
						let converted = '';

						if (present) {
							const value = json[name];

							if (is.undefined(value)) {
								header = STRING_UNDEFINDED;
							} else if (is.null(value)) {
								header = STRING_NULL;
							} else {
								header = STRING_PRESENT;
								converted = `${schema.sequence[i].type.convert(value)}`;
							}
						}

						accumulator.push(`${header}${converted}`);

						return accumulator;
					}, [ ]);

					return data.join(STRING_DELIMITER);
				},
				decode: (data) => {
					const values = data.split(STRING_DELIMITER);

					return values.reduce((accumulator, s, i) => {
						const header = s.charAt(0);

						if (header !== STRING_ABSENT) {
							const definition = schema.sequence[i];

							let value;

							if (header === STRING_UNDEFINDED) {
								value = undefined;
							} else if (header === STRING_NULL) {
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