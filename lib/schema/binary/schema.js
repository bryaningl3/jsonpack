const is = require('./../../utilities/is');

const header = require('./header/header');

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

	const allocateBuffer = (() => {
		if (is.fn(Buffer.allocUnsafe)) {
			return Buffer.allocUnsafe;
		} else {
			return function(size) {
				return new Buffer(size);
			};
		}
	})();

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
					const names = Object.keys(json);
					const bytes = names.reduce((sum, name) => {
						if (schema.map.hasOwnProperty(name)) {
							let length;

							const value = json[name];

							if (is.null(value) || is.undefined(value)) {
								length = 0;
							} else {
								length = schema.map[name].type.getByteLength(value);
							}

							 sum = sum + 1 + length;
						}

						return sum;
					}, 0);

					let buffer = allocateBuffer(bytes);
					let offset = 0;

					names.forEach((name) => {
						if (schema.map.hasOwnProperty(name)) {
							const definition = schema.map[name];
							const value = json[name];

							const headerByte = header.getByte(definition.index, value);
							const present = header.getValueIsPresent(headerByte);

							offset = uint8.write(buffer, headerByte, offset);

							if (present) {
								offset = definition.type.write(buffer, value, offset);
							}
						}
					});

					return buffer;
				},
				decode: (buffer) => {
					let offset = 0;

					const json = { };

					while (offset < buffer.length) {
						const headerByte = uint8.read(buffer, offset);
						offset += uint8.getByteLength(headerByte);

						const index = header.getIndex(headerByte);
						const definition = schema.sequence[index];

						const present = header.getValueIsPresent(headerByte);

						let value;

						if (present) {
							const type = definition.type;

							value = type.read(buffer, offset);
							offset += type.getByteLength(value);
						} else {
							if (header.getValueIsUndefined(headerByte)) {
								value = undefined;
							} else {
								value = null;
							}
						}

						const name = definition.name;

						json[name] = value;
					}

					return json;
				}
			};
		}
	};
})();