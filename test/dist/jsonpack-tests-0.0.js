(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var is = require('./../../../utilities/is');

module.exports = function () {
	'use strict';

	var PRESENT_MASK = 1 << 6;
	var UNDEFINED_MASK = 1 << 7;

	var FIELD_MASK = PRESENT_MASK | UNDEFINED_MASK;

	var header = {
		getByte: function getByte(index, value) {
			var byte = void 0;

			if (is.null(value)) {
				byte = index;
			} else if (is.undefined(value)) {
				byte = index | UNDEFINED_MASK;
			} else {
				byte = index | PRESENT_MASK;
			}

			return byte;
		},
		getIndex: function getIndex(byte) {
			return byte & ~FIELD_MASK;
		},
		getValueIsPresent: function getValueIsPresent(byte) {
			return (byte & PRESENT_MASK) === PRESENT_MASK;
		},
		getValueIsNull: function getValueIsNull(byte) {
			return !header.getValueIsPresent(byte) && !header.getValueIsUndefined(byte);
		},
		getValueIsUndefined: function getValueIsUndefined(byte) {
			return (byte & UNDEFINED_MASK) === UNDEFINED_MASK;
		}
	};

	return header;
}();

},{"./../../../utilities/is":28}],2:[function(require,module,exports){
(function (Buffer){
'use strict';

var is = require('./../../utilities/is');

var header = require('./header/header');

var boolean = require('./types/boolean'),
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

module.exports = function () {
	'use strict';

	var types = [boolean, date, double, float, int8, int16, int32, string, uint8, uint16, uint32, uint48].reduce(function (map, type) {
		var name = type.getName();

		map[name] = type;

		return map;
	}, {});

	var allocateBuffer = function () {
		if (is.fn(Buffer.allocUnsafe)) {
			return Buffer.allocUnsafe;
		} else {
			return function (size) {
				return new Buffer(size);
			};
		}
	}();

	return {
		create: function create(fields) {
			var schema = fields.reduce(function (accumulator, field, index) {
				var name = field.name;

				var definition = {
					name: name,
					index: index,
					type: types[field.type]
				};

				accumulator.map[name] = definition;
				accumulator.sequence.push(definition);

				return accumulator;
			}, { map: {}, sequence: [] });

			return {
				encode: function encode(json) {
					var names = Object.keys(json);
					var bytes = names.reduce(function (sum, name) {
						if (schema.map.hasOwnProperty(name)) {
							var length = void 0;

							var value = json[name];

							if (is.null(value) || is.undefined(value)) {
								length = 0;
							} else {
								length = schema.map[name].type.getByteLength(value);
							}

							sum = sum + 1 + length;
						}

						return sum;
					}, 0);

					var buffer = allocateBuffer(bytes);
					var offset = 0;

					names.forEach(function (name) {
						if (schema.map.hasOwnProperty(name)) {
							var definition = schema.map[name];
							var value = json[name];

							var headerByte = header.getByte(definition.index, value);
							var present = header.getValueIsPresent(headerByte);

							offset = uint8.write(buffer, headerByte, offset);

							if (present) {
								offset = definition.type.write(buffer, value, offset);
							}
						}
					});

					return buffer;
				},
				decode: function decode(buffer) {
					var offset = 0;

					var json = {};

					while (offset < buffer.length) {
						var headerByte = uint8.read(buffer, offset);
						offset += uint8.getByteLength(headerByte);

						var index = header.getIndex(headerByte);
						var definition = schema.sequence[index];

						var present = header.getValueIsPresent(headerByte);

						var value = void 0;

						if (present) {
							var type = definition.type;

							value = type.read(buffer, offset);
							offset += type.getByteLength(value);
						} else {
							if (header.getValueIsUndefined(headerByte)) {
								value = undefined;
							} else {
								value = null;
							}
						}

						var name = definition.name;

						json[name] = value;
					}

					return json;
				}
			};
		}
	};
}();

}).call(this,require("buffer").Buffer)
},{"./../../utilities/is":28,"./header/header":1,"./types/boolean":3,"./types/date":4,"./types/double":5,"./types/float":6,"./types/int16":7,"./types/int32":8,"./types/int8":9,"./types/string":10,"./types/uint16":11,"./types/uint32":12,"./types/uint48":13,"./types/uint8":14,"buffer":30}],3:[function(require,module,exports){
'use strict';

var uint8 = require('./uint8');

module.exports = function () {
	'use strict';

	return {
		write: function write(buffer, value, offset) {
			return uint8.write(buffer, value ? 1 : 0, offset);
		},
		read: function read(buffer, offset) {
			return uint8.read(buffer, offset) === 1;
		},
		getByteLength: function getByteLength(value) {
			return uint8.getByteLength(false);
		},
		getName: function getName() {
			return 'boolean';
		}
	};
}();

},{"./uint8":14}],4:[function(require,module,exports){
'use strict';

var uint48 = require('./uint48');

module.exports = function () {
	'use strict';

	return {
		write: function write(buffer, value, offset) {
			return uint48.write(buffer, value.getTime(), offset);
		},
		read: function read(buffer, offset) {
			return new Date(uint48.read(buffer, offset));
		},
		getByteLength: function getByteLength(value) {
			return uint48.getByteLength(0);
		},
		getName: function getName() {
			return 'date';
		}
	};
}();

},{"./uint48":13}],5:[function(require,module,exports){
'use strict';

module.exports = function () {
	'use strict';

	return {
		write: function write(buffer, value, offset) {
			return buffer.writeDoubleBE(value, offset);
		},
		read: function read(buffer, offset) {
			return buffer.readDoubleBE(offset);
		},
		getByteLength: function getByteLength(value) {
			return 8;
		},
		getName: function getName() {
			return 'double';
		}
	};
}();

},{}],6:[function(require,module,exports){
'use strict';

module.exports = function () {
	'use strict';

	return {
		write: function write(buffer, value, offset) {
			return buffer.writeFloatBE(value, offset);
		},
		read: function read(buffer, offset) {
			return buffer.readFloatBE(offset);
		},
		getByteLength: function getByteLength(value) {
			return 4;
		},
		getName: function getName() {
			return 'float';
		}
	};
}();

},{}],7:[function(require,module,exports){
'use strict';

module.exports = function () {
	'use strict';

	return {
		write: function write(buffer, value, offset) {
			return buffer.writeInt16BE(value, offset);
		},
		read: function read(buffer, offset) {
			return buffer.readInt16BE(offset);
		},
		getByteLength: function getByteLength(value) {
			return 2;
		},
		getName: function getName() {
			return 'int16';
		}
	};
}();

},{}],8:[function(require,module,exports){
'use strict';

module.exports = function () {
	'use strict';

	return {
		write: function write(buffer, value, offset) {
			return buffer.writeInt32BE(value, offset);
		},
		read: function read(buffer, offset) {
			return buffer.readInt32BE(offset);
		},
		getByteLength: function getByteLength(value) {
			return 4;
		},
		getName: function getName() {
			return 'int32';
		}
	};
}();

},{}],9:[function(require,module,exports){
'use strict';

module.exports = function () {
	'use strict';

	return {
		write: function write(buffer, value, offset) {
			return buffer.writeInt8(value, offset);
		},
		read: function read(buffer, offset) {
			return buffer.readInt8(offset);
		},
		getByteLength: function getByteLength(value) {
			return 1;
		},
		getName: function getName() {
			return 'int8';
		}
	};
}();

},{}],10:[function(require,module,exports){
(function (Buffer){
'use strict';

var uint16 = require('./uint16');

module.exports = function () {
	'use strict';

	var string = {
		write: function write(buffer, value, offset) {
			var valueLength = getValueLength(value);
			var valueOffset = uint16.write(buffer, valueLength, offset);

			return valueOffset + buffer.write(value, valueOffset, valueLength, 'utf8');
		},
		read: function read(buffer, offset) {
			var valueLength = uint16.read(buffer, offset);
			var headerLength = uint16.getByteLength(valueLength);

			var start = headerLength + offset;
			var end = start + valueLength;

			return buffer.toString('utf8', start, end);
		},
		getByteLength: function getByteLength(value) {
			var valueLength = getValueLength(value);

			return valueLength + uint16.getByteLength(valueLength);
		},
		getName: function getName() {
			return 'string';
		}
	};

	function getValueLength(value) {
		return Buffer.byteLength(value, 'utf8');
	}

	return string;
}();

}).call(this,require("buffer").Buffer)
},{"./uint16":11,"buffer":30}],11:[function(require,module,exports){
'use strict';

module.exports = function () {
	'use strict';

	return {
		write: function write(buffer, value, offset) {
			return buffer.writeUInt16BE(value, offset);
		},
		read: function read(buffer, offset) {
			return buffer.readUInt16BE(offset);
		},
		getByteLength: function getByteLength(value) {
			return 2;
		},
		getName: function getName() {
			return 'uint16';
		}
	};
}();

},{}],12:[function(require,module,exports){
'use strict';

module.exports = function () {
	'use strict';

	return {
		write: function write(buffer, value, offset) {
			return buffer.writeUInt32BE(value, offset);
		},
		read: function read(buffer, offset) {
			return buffer.readUInt32BE(offset);
		},
		getByteLength: function getByteLength(value) {
			return 4;
		},
		getName: function getName() {
			return 'uint32';
		}
	};
}();

},{}],13:[function(require,module,exports){
'use strict';

module.exports = function () {
	'use strict';

	return {
		write: function write(buffer, value, offset) {
			return buffer.writeUIntBE(value, offset, 6);
		},
		read: function read(buffer, offset) {
			return buffer.readUIntBE(offset, 6);
		},
		getByteLength: function getByteLength(value) {
			return 6;
		},
		getName: function getName() {
			return 'uint48';
		}
	};
}();

},{}],14:[function(require,module,exports){
'use strict';

module.exports = function () {
	'use strict';

	return {
		write: function write(buffer, value, offset) {
			return buffer.writeUInt8(value, offset);
		},
		read: function read(buffer, offset) {
			return buffer.readUInt8(offset);
		},
		getByteLength: function getByteLength(value) {
			return 1;
		},
		getName: function getName() {
			return 'uint8';
		}
	};
}();

},{}],15:[function(require,module,exports){
'use strict';

var is = require('./../../utilities/is');

var boolean = require('./types/boolean'),
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

module.exports = function () {
	'use strict';

	var types = [boolean, date, double, float, int8, int16, int32, string, uint8, uint16, uint32, uint48].reduce(function (map, type) {
		var name = type.getName();

		map[name] = type;

		return map;
	}, {});

	var tokens = {
		a: String.fromCharCode(18),
		d: String.fromCharCode(7),
		p: String.fromCharCode(17),
		u: String.fromCharCode(19),
		n: String.fromCharCode(20)
	};

	return {
		create: function create(fields, options) {
			var tokensToUse = void 0;

			if (options && options.tokens) {
				tokensToUse = options.tokens;
			} else {
				tokensToUse = tokens;
			}

			var schema = fields.reduce(function (accumulator, field, index) {
				var name = field.name;

				var definition = {
					name: name,
					index: index,
					type: types[field.type]
				};

				accumulator.map[name] = definition;
				accumulator.sequence.push(definition);

				return accumulator;
			}, { map: {}, sequence: [] });

			return {
				encode: function encode(json) {
					var data = fields.reduce(function (accumulator, field, i) {
						var name = field.name;

						var present = json.hasOwnProperty(name);

						var header = tokensToUse.a;
						var converted = '';

						if (present) {
							var value = json[name];

							if (is.undefined(value)) {
								header = tokensToUse.u;
							} else if (is.null(value)) {
								header = tokensToUse.n;
							} else {
								header = tokensToUse.p;
								converted = '' + schema.sequence[i].type.convert(value);
							}
						}

						accumulator.push('' + header + converted);

						return accumulator;
					}, []);

					return data.join(tokensToUse.d);
				},
				decode: function decode(data) {
					var values = data.split(tokensToUse.d);

					return values.reduce(function (accumulator, s, i) {
						var header = s.charAt(0);

						if (header !== tokensToUse.a) {
							var definition = schema.sequence[i];

							var value = void 0;

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
					}, {});
				}
			};
		}
	};
}();

},{"./../../utilities/is":28,"./types/boolean":16,"./types/date":17,"./types/double":18,"./types/float":19,"./types/int16":20,"./types/int32":21,"./types/int8":22,"./types/string":23,"./types/uint16":24,"./types/uint32":25,"./types/uint48":26,"./types/uint8":27}],16:[function(require,module,exports){
'use strict';

module.exports = function () {
	'use strict';

	return {
		convert: function convert(value) {
			return value ? 'T' : 'F';
		},
		unconvert: function unconvert(value) {
			return value === 'T';
		},
		getName: function getName() {
			return 'boolean';
		}
	};
}();

},{}],17:[function(require,module,exports){
'use strict';

var uint48 = require('./uint48');

module.exports = function () {
	'use strict';

	return {
		convert: function convert(value) {
			return uint48.convert(value.getTime());
		},
		unconvert: function unconvert(value) {
			return new Date(uint48.unconvert(value));
		},
		getName: function getName() {
			return 'date';
		}
	};
}();

},{"./uint48":26}],18:[function(require,module,exports){
'use strict';

module.exports = function () {
	'use strict';

	return {
		convert: function convert(value) {
			return value.toString();
		},
		unconvert: function unconvert(value) {
			return Number.parseFloat(value);
		},
		getName: function getName() {
			return 'double';
		}
	};
}();

},{}],19:[function(require,module,exports){
'use strict';

module.exports = function () {
	'use strict';

	return {
		convert: function convert(value) {
			return value.toString();
		},
		unconvert: function unconvert(value) {
			return Number.parseFloat(value);
		},
		getName: function getName() {
			return 'float';
		}
	};
}();

},{}],20:[function(require,module,exports){
'use strict';

module.exports = function () {
	'use strict';

	return {
		convert: function convert(value) {
			return value.toString();
		},
		unconvert: function unconvert(value) {
			return Number.parseInt(value);
		},
		getName: function getName() {
			return 'int16';
		}
	};
}();

},{}],21:[function(require,module,exports){
'use strict';

module.exports = function () {
	'use strict';

	return {
		convert: function convert(value) {
			return value.toString();
		},
		unconvert: function unconvert(value) {
			return Number.parseInt(value);
		},
		getName: function getName() {
			return 'int32';
		}
	};
}();

},{}],22:[function(require,module,exports){
'use strict';

module.exports = function () {
	'use strict';

	return {
		convert: function convert(value) {
			return value.toString();
		},
		unconvert: function unconvert(value) {
			return Number.parseInt(value);
		},
		getName: function getName() {
			return 'int8';
		}
	};
}();

},{}],23:[function(require,module,exports){
'use strict';

module.exports = function () {
	'use strict';

	var string = {
		convert: function convert(value) {
			return value;
		},
		unconvert: function unconvert(value) {
			return value;
		},
		getName: function getName() {
			return 'string';
		}
	};

	return string;
}();

},{}],24:[function(require,module,exports){
'use strict';

module.exports = function () {
	'use strict';

	return {
		convert: function convert(value) {
			return value.toString();
		},
		unconvert: function unconvert(value) {
			return Number.parseInt(value);
		},
		getName: function getName() {
			return 'uint16';
		}
	};
}();

},{}],25:[function(require,module,exports){
'use strict';

module.exports = function () {
	'use strict';

	return {
		convert: function convert(value) {
			return value.toString();
		},
		unconvert: function unconvert(value) {
			return Number.parseInt(value);
		},
		getName: function getName() {
			return 'uint32';
		}
	};
}();

},{}],26:[function(require,module,exports){
'use strict';

module.exports = function () {
	'use strict';

	return {
		convert: function convert(value) {
			return value.toString();
		},
		unconvert: function unconvert(value) {
			return Number.parseInt(value);
		},
		getName: function getName() {
			return 'uint48';
		}
	};
}();

},{}],27:[function(require,module,exports){
'use strict';

module.exports = function () {
	'use strict';

	return {
		convert: function convert(value) {
			return value.toString();
		},
		unconvert: function unconvert(value) {
			return Number.parseInt(value);
		},
		getName: function getName() {
			return 'uint8';
		}
	};
}();

},{}],28:[function(require,module,exports){
'use strict';

var _typeof2 = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _typeof = typeof Symbol === "function" && _typeof2(Symbol.iterator) === "symbol" ? function (obj) {
	return typeof obj === "undefined" ? "undefined" : _typeof2(obj);
} : function (obj) {
	return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj === "undefined" ? "undefined" : _typeof2(obj);
};

module.exports = function () {
	'use strict';

	return {
		nan: function nan(candidate) {
			return typeof candidate === 'number' && isNaN(candidate);
		},
		number: function number(candidate) {
			return typeof candidate === 'number' && !isNaN(candidate);
		},
		integer: function integer(candidate) {
			return typeof candidate === 'number' && !isNaN(candidate) && candidate % 1 === 0;
		},
		string: function string(candidate) {
			return typeof candidate === 'string';
		},
		date: function date(candidate) {
			return candidate instanceof Date;
		},
		fn: function fn(candidate) {
			return typeof candidate === 'function';
		},
		array: function array(candidate) {
			return Array.isArray(candidate);
		},
		boolean: function boolean(candidate) {
			return typeof candidate === 'boolean';
		},
		object: function object(candidate) {
			return (typeof candidate === 'undefined' ? 'undefined' : _typeof(candidate)) === 'object' && candidate !== null;
		},
		null: function _null(candidate) {
			return candidate === null;
		},
		undefined: function (_undefined) {
			function undefined(_x) {
				return _undefined.apply(this, arguments);
			}

			undefined.toString = function () {
				return _undefined.toString();
			};

			return undefined;
		}(function (candidate) {
			return candidate === undefined;
		})
	};
}();

},{}],29:[function(require,module,exports){
var lookup = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

;(function (exports) {
	'use strict';

  var Arr = (typeof Uint8Array !== 'undefined')
    ? Uint8Array
    : Array

	var PLUS   = '+'.charCodeAt(0)
	var SLASH  = '/'.charCodeAt(0)
	var NUMBER = '0'.charCodeAt(0)
	var LOWER  = 'a'.charCodeAt(0)
	var UPPER  = 'A'.charCodeAt(0)
	var PLUS_URL_SAFE = '-'.charCodeAt(0)
	var SLASH_URL_SAFE = '_'.charCodeAt(0)

	function decode (elt) {
		var code = elt.charCodeAt(0)
		if (code === PLUS ||
		    code === PLUS_URL_SAFE)
			return 62 // '+'
		if (code === SLASH ||
		    code === SLASH_URL_SAFE)
			return 63 // '/'
		if (code < NUMBER)
			return -1 //no match
		if (code < NUMBER + 10)
			return code - NUMBER + 26 + 26
		if (code < UPPER + 26)
			return code - UPPER
		if (code < LOWER + 26)
			return code - LOWER + 26
	}

	function b64ToByteArray (b64) {
		var i, j, l, tmp, placeHolders, arr

		if (b64.length % 4 > 0) {
			throw new Error('Invalid string. Length must be a multiple of 4')
		}

		// the number of equal signs (place holders)
		// if there are two placeholders, than the two characters before it
		// represent one byte
		// if there is only one, then the three characters before it represent 2 bytes
		// this is just a cheap hack to not do indexOf twice
		var len = b64.length
		placeHolders = '=' === b64.charAt(len - 2) ? 2 : '=' === b64.charAt(len - 1) ? 1 : 0

		// base64 is 4/3 + up to two characters of the original data
		arr = new Arr(b64.length * 3 / 4 - placeHolders)

		// if there are placeholders, only get up to the last complete 4 chars
		l = placeHolders > 0 ? b64.length - 4 : b64.length

		var L = 0

		function push (v) {
			arr[L++] = v
		}

		for (i = 0, j = 0; i < l; i += 4, j += 3) {
			tmp = (decode(b64.charAt(i)) << 18) | (decode(b64.charAt(i + 1)) << 12) | (decode(b64.charAt(i + 2)) << 6) | decode(b64.charAt(i + 3))
			push((tmp & 0xFF0000) >> 16)
			push((tmp & 0xFF00) >> 8)
			push(tmp & 0xFF)
		}

		if (placeHolders === 2) {
			tmp = (decode(b64.charAt(i)) << 2) | (decode(b64.charAt(i + 1)) >> 4)
			push(tmp & 0xFF)
		} else if (placeHolders === 1) {
			tmp = (decode(b64.charAt(i)) << 10) | (decode(b64.charAt(i + 1)) << 4) | (decode(b64.charAt(i + 2)) >> 2)
			push((tmp >> 8) & 0xFF)
			push(tmp & 0xFF)
		}

		return arr
	}

	function uint8ToBase64 (uint8) {
		var i,
			extraBytes = uint8.length % 3, // if we have 1 byte left, pad 2 bytes
			output = "",
			temp, length

		function encode (num) {
			return lookup.charAt(num)
		}

		function tripletToBase64 (num) {
			return encode(num >> 18 & 0x3F) + encode(num >> 12 & 0x3F) + encode(num >> 6 & 0x3F) + encode(num & 0x3F)
		}

		// go through the array every three bytes, we'll deal with trailing stuff later
		for (i = 0, length = uint8.length - extraBytes; i < length; i += 3) {
			temp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2])
			output += tripletToBase64(temp)
		}

		// pad the end with zeros, but make sure to not forget the extra bytes
		switch (extraBytes) {
			case 1:
				temp = uint8[uint8.length - 1]
				output += encode(temp >> 2)
				output += encode((temp << 4) & 0x3F)
				output += '=='
				break
			case 2:
				temp = (uint8[uint8.length - 2] << 8) + (uint8[uint8.length - 1])
				output += encode(temp >> 10)
				output += encode((temp >> 4) & 0x3F)
				output += encode((temp << 2) & 0x3F)
				output += '='
				break
		}

		return output
	}

	exports.toByteArray = b64ToByteArray
	exports.fromByteArray = uint8ToBase64
}(typeof exports === 'undefined' ? (this.base64js = {}) : exports))

},{}],30:[function(require,module,exports){
(function (global){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */

'use strict'

var base64 = require('base64-js')
var ieee754 = require('ieee754')
var isArray = require('isarray')

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50
Buffer.poolSize = 8192 // not used by this implementation

var rootParent = {}

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Use Object implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * Due to various browser bugs, sometimes the Object implementation will be used even
 * when the browser supports typed arrays.
 *
 * Note:
 *
 *   - Firefox 4-29 lacks support for adding new properties to `Uint8Array` instances,
 *     See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438.
 *
 *   - Safari 5-7 lacks support for changing the `Object.prototype.constructor` property
 *     on objects.
 *
 *   - Chrome 9-10 is missing the `TypedArray.prototype.subarray` function.
 *
 *   - IE10 has a broken `TypedArray.prototype.subarray` function which returns arrays of
 *     incorrect length in some situations.

 * We detect these buggy browsers and set `Buffer.TYPED_ARRAY_SUPPORT` to `false` so they
 * get the Object implementation, which is slower but behaves correctly.
 */
Buffer.TYPED_ARRAY_SUPPORT = global.TYPED_ARRAY_SUPPORT !== undefined
  ? global.TYPED_ARRAY_SUPPORT
  : typedArraySupport()

function typedArraySupport () {
  function Bar () {}
  try {
    var arr = new Uint8Array(1)
    arr.foo = function () { return 42 }
    arr.constructor = Bar
    return arr.foo() === 42 && // typed array instances can be augmented
        arr.constructor === Bar && // constructor can be set
        typeof arr.subarray === 'function' && // chrome 9-10 lack `subarray`
        arr.subarray(1, 1).byteLength === 0 // ie10 has broken `subarray`
  } catch (e) {
    return false
  }
}

function kMaxLength () {
  return Buffer.TYPED_ARRAY_SUPPORT
    ? 0x7fffffff
    : 0x3fffffff
}

/**
 * Class: Buffer
 * =============
 *
 * The Buffer constructor returns instances of `Uint8Array` that are augmented
 * with function properties for all the node `Buffer` API functions. We use
 * `Uint8Array` so that square bracket notation works as expected -- it returns
 * a single octet.
 *
 * By augmenting the instances, we can avoid modifying the `Uint8Array`
 * prototype.
 */
function Buffer (arg) {
  if (!(this instanceof Buffer)) {
    // Avoid going through an ArgumentsAdaptorTrampoline in the common case.
    if (arguments.length > 1) return new Buffer(arg, arguments[1])
    return new Buffer(arg)
  }

  if (!Buffer.TYPED_ARRAY_SUPPORT) {
    this.length = 0
    this.parent = undefined
  }

  // Common case.
  if (typeof arg === 'number') {
    return fromNumber(this, arg)
  }

  // Slightly less common case.
  if (typeof arg === 'string') {
    return fromString(this, arg, arguments.length > 1 ? arguments[1] : 'utf8')
  }

  // Unusual.
  return fromObject(this, arg)
}

function fromNumber (that, length) {
  that = allocate(that, length < 0 ? 0 : checked(length) | 0)
  if (!Buffer.TYPED_ARRAY_SUPPORT) {
    for (var i = 0; i < length; i++) {
      that[i] = 0
    }
  }
  return that
}

function fromString (that, string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') encoding = 'utf8'

  // Assumption: byteLength() return value is always < kMaxLength.
  var length = byteLength(string, encoding) | 0
  that = allocate(that, length)

  that.write(string, encoding)
  return that
}

function fromObject (that, object) {
  if (Buffer.isBuffer(object)) return fromBuffer(that, object)

  if (isArray(object)) return fromArray(that, object)

  if (object == null) {
    throw new TypeError('must start with number, buffer, array or string')
  }

  if (typeof ArrayBuffer !== 'undefined') {
    if (object.buffer instanceof ArrayBuffer) {
      return fromTypedArray(that, object)
    }
    if (object instanceof ArrayBuffer) {
      return fromArrayBuffer(that, object)
    }
  }

  if (object.length) return fromArrayLike(that, object)

  return fromJsonObject(that, object)
}

function fromBuffer (that, buffer) {
  var length = checked(buffer.length) | 0
  that = allocate(that, length)
  buffer.copy(that, 0, 0, length)
  return that
}

function fromArray (that, array) {
  var length = checked(array.length) | 0
  that = allocate(that, length)
  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255
  }
  return that
}

// Duplicate of fromArray() to keep fromArray() monomorphic.
function fromTypedArray (that, array) {
  var length = checked(array.length) | 0
  that = allocate(that, length)
  // Truncating the elements is probably not what people expect from typed
  // arrays with BYTES_PER_ELEMENT > 1 but it's compatible with the behavior
  // of the old Buffer constructor.
  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255
  }
  return that
}

function fromArrayBuffer (that, array) {
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    // Return an augmented `Uint8Array` instance, for best performance
    array.byteLength
    that = Buffer._augment(new Uint8Array(array))
  } else {
    // Fallback: Return an object instance of the Buffer class
    that = fromTypedArray(that, new Uint8Array(array))
  }
  return that
}

function fromArrayLike (that, array) {
  var length = checked(array.length) | 0
  that = allocate(that, length)
  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255
  }
  return that
}

// Deserialize { type: 'Buffer', data: [1,2,3,...] } into a Buffer object.
// Returns a zero-length buffer for inputs that don't conform to the spec.
function fromJsonObject (that, object) {
  var array
  var length = 0

  if (object.type === 'Buffer' && isArray(object.data)) {
    array = object.data
    length = checked(array.length) | 0
  }
  that = allocate(that, length)

  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255
  }
  return that
}

if (Buffer.TYPED_ARRAY_SUPPORT) {
  Buffer.prototype.__proto__ = Uint8Array.prototype
  Buffer.__proto__ = Uint8Array
} else {
  // pre-set for values that may exist in the future
  Buffer.prototype.length = undefined
  Buffer.prototype.parent = undefined
}

function allocate (that, length) {
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    // Return an augmented `Uint8Array` instance, for best performance
    that = Buffer._augment(new Uint8Array(length))
    that.__proto__ = Buffer.prototype
  } else {
    // Fallback: Return an object instance of the Buffer class
    that.length = length
    that._isBuffer = true
  }

  var fromPool = length !== 0 && length <= Buffer.poolSize >>> 1
  if (fromPool) that.parent = rootParent

  return that
}

function checked (length) {
  // Note: cannot use `length < kMaxLength` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= kMaxLength()) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + kMaxLength().toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (subject, encoding) {
  if (!(this instanceof SlowBuffer)) return new SlowBuffer(subject, encoding)

  var buf = new Buffer(subject, encoding)
  delete buf.parent
  return buf
}

Buffer.isBuffer = function isBuffer (b) {
  return !!(b != null && b._isBuffer)
}

Buffer.compare = function compare (a, b) {
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError('Arguments must be Buffers')
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length

  var i = 0
  var len = Math.min(x, y)
  while (i < len) {
    if (a[i] !== b[i]) break

    ++i
  }

  if (i !== len) {
    x = a[i]
    y = b[i]
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'binary':
    case 'base64':
    case 'raw':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!isArray(list)) throw new TypeError('list argument must be an Array of Buffers.')

  if (list.length === 0) {
    return new Buffer(0)
  }

  var i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; i++) {
      length += list[i].length
    }
  }

  var buf = new Buffer(length)
  var pos = 0
  for (i = 0; i < list.length; i++) {
    var item = list[i]
    item.copy(buf, pos)
    pos += item.length
  }
  return buf
}

function byteLength (string, encoding) {
  if (typeof string !== 'string') string = '' + string

  var len = string.length
  if (len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'binary':
      // Deprecated
      case 'raw':
      case 'raws':
        return len
      case 'utf8':
      case 'utf-8':
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) return utf8ToBytes(string).length // assume utf8
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

function slowToString (encoding, start, end) {
  var loweredCase = false

  start = start | 0
  end = end === undefined || end === Infinity ? this.length : end | 0

  if (!encoding) encoding = 'utf8'
  if (start < 0) start = 0
  if (end > this.length) end = this.length
  if (end <= start) return ''

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'binary':
        return binarySlice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toString = function toString () {
  var length = this.length | 0
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  if (this.length > 0) {
    str = this.toString('hex', 0, max).match(/.{2}/g).join(' ')
    if (this.length > max) str += ' ... '
  }
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function compare (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return 0
  return Buffer.compare(this, b)
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset) {
  if (byteOffset > 0x7fffffff) byteOffset = 0x7fffffff
  else if (byteOffset < -0x80000000) byteOffset = -0x80000000
  byteOffset >>= 0

  if (this.length === 0) return -1
  if (byteOffset >= this.length) return -1

  // Negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = Math.max(this.length + byteOffset, 0)

  if (typeof val === 'string') {
    if (val.length === 0) return -1 // special case: looking for empty string always fails
    return String.prototype.indexOf.call(this, val, byteOffset)
  }
  if (Buffer.isBuffer(val)) {
    return arrayIndexOf(this, val, byteOffset)
  }
  if (typeof val === 'number') {
    if (Buffer.TYPED_ARRAY_SUPPORT && Uint8Array.prototype.indexOf === 'function') {
      return Uint8Array.prototype.indexOf.call(this, val, byteOffset)
    }
    return arrayIndexOf(this, [ val ], byteOffset)
  }

  function arrayIndexOf (arr, val, byteOffset) {
    var foundIndex = -1
    for (var i = 0; byteOffset + i < arr.length; i++) {
      if (arr[byteOffset + i] === val[foundIndex === -1 ? 0 : i - foundIndex]) {
        if (foundIndex === -1) foundIndex = i
        if (i - foundIndex + 1 === val.length) return byteOffset + foundIndex
      } else {
        foundIndex = -1
      }
    }
    return -1
  }

  throw new TypeError('val must be string, number or Buffer')
}

// `get` is deprecated
Buffer.prototype.get = function get (offset) {
  console.log('.get() is deprecated. Access using array indexes instead.')
  return this.readUInt8(offset)
}

// `set` is deprecated
Buffer.prototype.set = function set (v, offset) {
  console.log('.set() is deprecated. Access using array indexes instead.')
  return this.writeUInt8(v, offset)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  // must be an even number of digits
  var strLen = string.length
  if (strLen % 2 !== 0) throw new Error('Invalid hex string')

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; i++) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (isNaN(parsed)) throw new Error('Invalid hex string')
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function binaryWrite (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset | 0
    if (isFinite(length)) {
      length = length | 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  // legacy write(string, encoding, offset, length) - remove in v0.13
  } else {
    var swap = encoding
    encoding = offset
    offset = length | 0
    length = swap
  }

  var remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'binary':
        return binaryWrite(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end)
  var res = []

  var i = start
  while (i < end) {
    var firstByte = buf[i]
    var codePoint = null
    var bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
      : (firstByte > 0xBF) ? 2
      : 1

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = buf[i + 1]
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          fourthByte = buf[i + 3]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD
      bytesPerSequence = 1
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000
      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
      codePoint = 0xDC00 | codePoint & 0x3FF
    }

    res.push(codePoint)
    i += bytesPerSequence
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000

function decodeCodePointsArray (codePoints) {
  var len = codePoints.length
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var res = ''
  var i = 0
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    )
  }
  return res
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; i++) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function binarySlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; i++) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; i++) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256)
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    newBuf = Buffer._augment(this.subarray(start, end))
  } else {
    var sliceLen = end - start
    newBuf = new Buffer(sliceLen, undefined)
    for (var i = 0; i < sliceLen; i++) {
      newBuf[i] = this[i + start]
    }
  }

  if (newBuf.length) newBuf.parent = this.parent || this

  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('buffer must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('value is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkInt(this, value, offset, byteLength, Math.pow(2, 8 * byteLength), 0)

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkInt(this, value, offset, byteLength, Math.pow(2, 8 * byteLength), 0)

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  this[offset] = (value & 0xff)
  return offset + 1
}

function objectWriteUInt16 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 2); i < j; i++) {
    buf[offset + i] = (value & (0xff << (8 * (littleEndian ? i : 1 - i)))) >>>
      (littleEndian ? i : 1 - i) * 8
  }
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
  } else {
    objectWriteUInt16(this, value, offset, true)
  }
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = (value & 0xff)
  } else {
    objectWriteUInt16(this, value, offset, false)
  }
  return offset + 2
}

function objectWriteUInt32 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffffffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 4); i < j; i++) {
    buf[offset + i] = (value >>> (littleEndian ? i : 3 - i) * 8) & 0xff
  }
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset + 3] = (value >>> 24)
    this[offset + 2] = (value >>> 16)
    this[offset + 1] = (value >>> 8)
    this[offset] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, true)
  }
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, false)
  }
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = 0
  var mul = 1
  var sub = value < 0 ? 1 : 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = byteLength - 1
  var mul = 1
  var sub = value < 0 ? 1 : 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  if (value < 0) value = 0xff + value + 1
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
  } else {
    objectWriteUInt16(this, value, offset, true)
  }
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = (value & 0xff)
  } else {
    objectWriteUInt16(this, value, offset, false)
  }
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
    this[offset + 2] = (value >>> 16)
    this[offset + 3] = (value >>> 24)
  } else {
    objectWriteUInt32(this, value, offset, true)
  }
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, false)
  }
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (value > max || value < min) throw new RangeError('value is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('index out of range')
  if (offset < 0) throw new RangeError('index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('sourceStart out of bounds')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start
  var i

  if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (i = len - 1; i >= 0; i--) {
      target[i + targetStart] = this[i + start]
    }
  } else if (len < 1000 || !Buffer.TYPED_ARRAY_SUPPORT) {
    // ascending copy from start
    for (i = 0; i < len; i++) {
      target[i + targetStart] = this[i + start]
    }
  } else {
    target._set(this.subarray(start, start + len), targetStart)
  }

  return len
}

// fill(value, start=0, end=buffer.length)
Buffer.prototype.fill = function fill (value, start, end) {
  if (!value) value = 0
  if (!start) start = 0
  if (!end) end = this.length

  if (end < start) throw new RangeError('end < start')

  // Fill 0 bytes; we're done
  if (end === start) return
  if (this.length === 0) return

  if (start < 0 || start >= this.length) throw new RangeError('start out of bounds')
  if (end < 0 || end > this.length) throw new RangeError('end out of bounds')

  var i
  if (typeof value === 'number') {
    for (i = start; i < end; i++) {
      this[i] = value
    }
  } else {
    var bytes = utf8ToBytes(value.toString())
    var len = bytes.length
    for (i = start; i < end; i++) {
      this[i] = bytes[i % len]
    }
  }

  return this
}

/**
 * Creates a new `ArrayBuffer` with the *copied* memory of the buffer instance.
 * Added in Node 0.12. Only available in browsers that support ArrayBuffer.
 */
Buffer.prototype.toArrayBuffer = function toArrayBuffer () {
  if (typeof Uint8Array !== 'undefined') {
    if (Buffer.TYPED_ARRAY_SUPPORT) {
      return (new Buffer(this)).buffer
    } else {
      var buf = new Uint8Array(this.length)
      for (var i = 0, len = buf.length; i < len; i += 1) {
        buf[i] = this[i]
      }
      return buf.buffer
    }
  } else {
    throw new TypeError('Buffer.toArrayBuffer not supported in this browser')
  }
}

// HELPER FUNCTIONS
// ================

var BP = Buffer.prototype

/**
 * Augment a Uint8Array *instance* (not the Uint8Array class!) with Buffer methods
 */
Buffer._augment = function _augment (arr) {
  arr.constructor = Buffer
  arr._isBuffer = true

  // save reference to original Uint8Array set method before overwriting
  arr._set = arr.set

  // deprecated
  arr.get = BP.get
  arr.set = BP.set

  arr.write = BP.write
  arr.toString = BP.toString
  arr.toLocaleString = BP.toString
  arr.toJSON = BP.toJSON
  arr.equals = BP.equals
  arr.compare = BP.compare
  arr.indexOf = BP.indexOf
  arr.copy = BP.copy
  arr.slice = BP.slice
  arr.readUIntLE = BP.readUIntLE
  arr.readUIntBE = BP.readUIntBE
  arr.readUInt8 = BP.readUInt8
  arr.readUInt16LE = BP.readUInt16LE
  arr.readUInt16BE = BP.readUInt16BE
  arr.readUInt32LE = BP.readUInt32LE
  arr.readUInt32BE = BP.readUInt32BE
  arr.readIntLE = BP.readIntLE
  arr.readIntBE = BP.readIntBE
  arr.readInt8 = BP.readInt8
  arr.readInt16LE = BP.readInt16LE
  arr.readInt16BE = BP.readInt16BE
  arr.readInt32LE = BP.readInt32LE
  arr.readInt32BE = BP.readInt32BE
  arr.readFloatLE = BP.readFloatLE
  arr.readFloatBE = BP.readFloatBE
  arr.readDoubleLE = BP.readDoubleLE
  arr.readDoubleBE = BP.readDoubleBE
  arr.writeUInt8 = BP.writeUInt8
  arr.writeUIntLE = BP.writeUIntLE
  arr.writeUIntBE = BP.writeUIntBE
  arr.writeUInt16LE = BP.writeUInt16LE
  arr.writeUInt16BE = BP.writeUInt16BE
  arr.writeUInt32LE = BP.writeUInt32LE
  arr.writeUInt32BE = BP.writeUInt32BE
  arr.writeIntLE = BP.writeIntLE
  arr.writeIntBE = BP.writeIntBE
  arr.writeInt8 = BP.writeInt8
  arr.writeInt16LE = BP.writeInt16LE
  arr.writeInt16BE = BP.writeInt16BE
  arr.writeInt32LE = BP.writeInt32LE
  arr.writeInt32BE = BP.writeInt32BE
  arr.writeFloatLE = BP.writeFloatLE
  arr.writeFloatBE = BP.writeFloatBE
  arr.writeDoubleLE = BP.writeDoubleLE
  arr.writeDoubleBE = BP.writeDoubleBE
  arr.fill = BP.fill
  arr.inspect = BP.inspect
  arr.toArrayBuffer = BP.toArrayBuffer

  return arr
}

var INVALID_BASE64_RE = /[^+\/0-9A-Za-z-_]/g

function base64clean (str) {
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = stringtrim(str).replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function stringtrim (str) {
  if (str.trim) return str.trim()
  return str.replace(/^\s+|\s+$/g, '')
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []

  for (var i = 0; i < length; i++) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // valid lead
        leadSurrogate = codePoint

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        leadSurrogate = codePoint
        continue
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
    }

    leadSurrogate = null

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; i++) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"base64-js":29,"ieee754":32,"isarray":31}],31:[function(require,module,exports){
var toString = {}.toString;

module.exports = Array.isArray || function (arr) {
  return toString.call(arr) == '[object Array]';
};

},{}],32:[function(require,module,exports){
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = (e * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = (m * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = ((value * c) - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

},{}],33:[function(require,module,exports){
'use strict';

var _typeof2 = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _typeof = typeof Symbol === "function" && _typeof2(Symbol.iterator) === "symbol" ? function (obj) {
	return typeof obj === "undefined" ? "undefined" : _typeof2(obj);
} : function (obj) {
	return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj === "undefined" ? "undefined" : _typeof2(obj);
};

var header = require('./../../../../../lib/schema/binary/header/header');

describe('when generating a header byte', function () {
	'use strict';

	describe('for a value that exists', function () {
		var index = void 0;
		var value = void 0;

		var byte = void 0;

		beforeEach(function () {
			byte = header.getByte(index = 13, value = 'a byte that is neither null or undefined');
		});

		it('the header byte should be a number', function () {
			expect(typeof byte === 'undefined' ? 'undefined' : _typeof(byte)).toEqual('number');
		});

		it('the header byte should be one byte long', function () {
			expect(byte >>> 8).toEqual(0);
		});

		it('the header byte should contain the field index', function () {
			expect(header.getIndex(byte)).toEqual(index);
		});

		it('the header byte should indicate a value is present', function () {
			expect(header.getValueIsPresent(byte)).toEqual(true);
		});

		it('the header byte should not indicate a null value', function () {
			expect(header.getValueIsNull(byte)).toEqual(false);
		});

		it('the header byte should not indicate an undefined value', function () {
			expect(header.getValueIsUndefined(byte)).toEqual(false);
		});
	});

	describe('for a null value', function () {
		var index = void 0;
		var value = void 0;

		var byte = void 0;

		beforeEach(function () {
			byte = header.getByte(index = 13, value = null);
		});

		it('the header byte should be a number', function () {
			expect(typeof byte === 'undefined' ? 'undefined' : _typeof(byte)).toEqual('number');
		});

		it('the header byte should be one byte long', function () {
			expect(byte >>> 8).toEqual(0);
		});

		it('the header byte should contain the field index', function () {
			expect(header.getIndex(byte)).toEqual(index);
		});

		it('the header byte should indicate a value is not present', function () {
			expect(header.getValueIsPresent(byte)).toEqual(false);
		});

		it('the header byte should indicate a null value', function () {
			expect(header.getValueIsNull(byte)).toEqual(true);
		});

		it('the header byte should not indicate an undefined byte', function () {
			expect(header.getValueIsUndefined(byte)).toEqual(false);
		});
	});

	describe('for an undefined value', function () {
		var index = void 0;
		var value = void 0;

		var byte = void 0;

		beforeEach(function () {
			byte = header.getByte(index = 13, value = undefined);
		});

		it('the header byte should be a number', function () {
			expect(typeof byte === 'undefined' ? 'undefined' : _typeof(byte)).toEqual('number');
		});

		it('the header byte should be one byte long', function () {
			expect(byte >>> 8).toEqual(0);
		});

		it('the header byte should contain the field index', function () {
			expect(header.getIndex(byte)).toEqual(index);
		});

		it('the header byte should indicate a value is not present', function () {
			expect(header.getValueIsPresent(byte)).toEqual(false);
		});

		it('the header byte should not indicate a null value', function () {
			expect(header.getValueIsNull(byte)).toEqual(false);
		});

		it('the header byte should indicate an undefined byte', function () {
			expect(header.getValueIsUndefined(byte)).toEqual(true);
		});
	});
});

},{"./../../../../../lib/schema/binary/header/header":1}],34:[function(require,module,exports){
(function (Buffer){
'use strict';

var _typeof2 = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _typeof = typeof Symbol === "function" && _typeof2(Symbol.iterator) === "symbol" ? function (obj) {
	return typeof obj === "undefined" ? "undefined" : _typeof2(obj);
} : function (obj) {
	return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj === "undefined" ? "undefined" : _typeof2(obj);
};

var factory = require('./../../../../lib/schema/binary/schema');

describe('when generating a schema', function () {
	'use strict';

	describe('composed of [ { name: "miles", type: "int32" } ]', function () {
		var schema = void 0;

		beforeEach(function () {
			schema = factory.create([{ name: "miles", type: "int32" }]);
		});

		describe('and serializing { miles: 41 }', function () {
			var serialized = void 0;

			beforeEach(function () {
				serialized = schema.encode({ miles: 41 });
			});

			it('should be a buffer', function () {
				expect(serialized instanceof Buffer).toEqual(true);
			});

			it('should be five bytes long', function () {
				expect(serialized.length).toEqual(5);
			});

			describe('and deserializing the buffer', function () {
				var deserialized = void 0;

				beforeEach(function () {
					deserialized = schema.decode(serialized);
				});

				it('should be an object', function () {
					expect(typeof deserialized === 'undefined' ? 'undefined' : _typeof(deserialized)).toEqual('object');
				});

				it('should contain the miles field', function () {
					expect(deserialized.hasOwnProperty('miles')).toEqual(true);
				});

				it('should have a value of 41 for the miles field', function () {
					expect(deserialized.miles).toEqual(41);
				});
			});
		});

		describe('and serializing { miles: null }', function () {
			var serialized = void 0;

			beforeEach(function () {
				serialized = schema.encode({ miles: null });
			});

			it('should be a buffer', function () {
				expect(serialized instanceof Buffer).toEqual(true);
			});

			it('should be one byte long', function () {
				expect(serialized.length).toEqual(1);
			});

			describe('and deserializing the buffer', function () {
				var deserialized = void 0;

				beforeEach(function () {
					deserialized = schema.decode(serialized);
				});

				it('should be an object', function () {
					expect(typeof deserialized === 'undefined' ? 'undefined' : _typeof(deserialized)).toEqual('object');
				});

				it('should contain the miles field', function () {
					expect(deserialized.hasOwnProperty('miles')).toEqual(true);
				});

				it('should have a null value for the miles field', function () {
					expect(deserialized.miles).toEqual(null);
				});
			});
		});

		describe('and serializing { miles: undefined }', function () {
			var serialized = void 0;

			beforeEach(function () {
				serialized = schema.encode({ miles: undefined });
			});

			it('should be a buffer', function () {
				expect(serialized instanceof Buffer).toEqual(true);
			});

			it('should be one byte long', function () {
				expect(serialized.length).toEqual(1);
			});

			describe('and deserializing the buffer', function () {
				var deserialized = void 0;

				beforeEach(function () {
					deserialized = schema.decode(serialized);
				});

				it('should be an object', function () {
					expect(typeof deserialized === 'undefined' ? 'undefined' : _typeof(deserialized)).toEqual('object');
				});

				it('should contain the miles field', function () {
					expect(deserialized.hasOwnProperty('miles')).toEqual(true);
				});

				it('should have an undefined value for the miles field', function () {
					expect(deserialized.miles).toEqual(undefined);
				});
			});
		});

		describe('and serializing { }', function () {
			var serialized = void 0;

			beforeEach(function () {
				serialized = schema.encode({});
			});

			it('should be a buffer', function () {
				expect(serialized instanceof Buffer).toEqual(true);
			});

			it('should be zero bytes long', function () {
				expect(serialized.length).toEqual(0);
			});

			describe('and deserializing the buffer', function () {
				var deserialized = void 0;

				beforeEach(function () {
					deserialized = schema.decode(serialized);
				});

				it('should be an object', function () {
					expect(typeof deserialized === 'undefined' ? 'undefined' : _typeof(deserialized)).toEqual('object');
				});

				it('should not contain the miles field', function () {
					expect(deserialized.hasOwnProperty('miles')).toEqual(false);
				});
			});
		});

		describe('and serializing { kilometers: 0.621 }', function () {
			var serialized = void 0;

			beforeEach(function () {
				serialized = schema.encode({ kilometers: 0.621 });
			});

			it('should be a buffer', function () {
				expect(serialized instanceof Buffer).toEqual(true);
			});

			it('should be zero bytes long', function () {
				expect(serialized.length).toEqual(0);
			});

			describe('and deserializing the buffer', function () {
				var deserialized = void 0;

				beforeEach(function () {
					deserialized = schema.decode(serialized);
				});

				it('should be an object', function () {
					expect(typeof deserialized === 'undefined' ? 'undefined' : _typeof(deserialized)).toEqual('object');
				});

				it('should not contain the miles field', function () {
					expect(deserialized.hasOwnProperty('miles')).toEqual(false);
				});
			});
		});
	});

	describe('composed of [ { name: "amount", type: "double" }, { name: "units", type: "string" } ]', function () {
		var schema = void 0;

		beforeEach(function () {
			schema = factory.create([{ name: "amount", type: "double" }, { name: "units", type: "string" }]);
		});

		describe('and serializing { amount: Math.PI, units: "radians" }', function () {
			var serialized = void 0;

			beforeEach(function () {
				serialized = schema.encode({ amount: Math.PI, units: "radians" });
			});

			it('should be a buffer', function () {
				expect(serialized instanceof Buffer).toEqual(true);
			});

			it('should be bytes 19 long', function () {
				expect(serialized.length).toEqual(19);
			});

			describe('and deserializing the buffer', function () {
				var deserialized = void 0;

				beforeEach(function () {
					deserialized = schema.decode(serialized);
				});

				it('should be an object', function () {
					expect(typeof deserialized === 'undefined' ? 'undefined' : _typeof(deserialized)).toEqual('object');
				});

				it('should contain the amount field', function () {
					expect(deserialized.hasOwnProperty('amount')).toEqual(true);
				});

				it('should have a value of Math.PI for the amount field', function () {
					expect(deserialized.amount).toEqual(Math.PI);
				});

				it('should contain the units field', function () {
					expect(deserialized.hasOwnProperty('units')).toEqual(true);
				});

				it('should have a value of "radians" for the units field', function () {
					expect(deserialized.units).toEqual("radians");
				});
			});
		});

		describe('and serializing { amount: 180 }', function () {
			var serialized = void 0;

			beforeEach(function () {
				serialized = schema.encode({ amount: 180 });
			});

			it('should be a buffer', function () {
				expect(serialized instanceof Buffer).toEqual(true);
			});

			it('should be bytes 9 long', function () {
				expect(serialized.length).toEqual(9);
			});

			describe('and deserializing the buffer', function () {
				var deserialized = void 0;

				beforeEach(function () {
					deserialized = schema.decode(serialized);
				});

				it('should be an object', function () {
					expect(typeof deserialized === 'undefined' ? 'undefined' : _typeof(deserialized)).toEqual('object');
				});

				it('should contain the amount field', function () {
					expect(deserialized.hasOwnProperty('amount')).toEqual(true);
				});

				it('should have a value of 180 for the amount field', function () {
					expect(deserialized.amount).toEqual(180);
				});

				it('should not contain the units field', function () {
					expect(deserialized.hasOwnProperty('units')).toEqual(false);
				});
			});
		});

		describe('and serializing { units: "degrees" }', function () {
			var serialized = void 0;

			beforeEach(function () {
				serialized = schema.encode({ units: "degrees" });
			});

			it('should be a buffer', function () {
				expect(serialized instanceof Buffer).toEqual(true);
			});

			it('should be bytes 19 long', function () {
				expect(serialized.length).toEqual(10);
			});

			describe('and deserializing the buffer', function () {
				var deserialized = void 0;

				beforeEach(function () {
					deserialized = schema.decode(serialized);
				});

				it('should be an object', function () {
					expect(typeof deserialized === 'undefined' ? 'undefined' : _typeof(deserialized)).toEqual('object');
				});

				it('should not contain the amount field', function () {
					expect(deserialized.hasOwnProperty('amount')).toEqual(false);
				});

				it('should contain the units field', function () {
					expect(deserialized.hasOwnProperty('units')).toEqual(true);
				});

				it('should have a value of "degrees" for the units field', function () {
					expect(deserialized.units).toEqual("degrees");
				});
			});
		});

		describe('and serializing { }', function () {
			var serialized = void 0;

			beforeEach(function () {
				serialized = schema.encode({});
			});

			it('should be a buffer', function () {
				expect(serialized instanceof Buffer).toEqual(true);
			});

			it('should be bytes 0 long', function () {
				expect(serialized.length).toEqual(0);
			});

			describe('and deserializing the buffer', function () {
				var deserialized = void 0;

				beforeEach(function () {
					deserialized = schema.decode(serialized);
				});

				it('should be an object', function () {
					expect(typeof deserialized === 'undefined' ? 'undefined' : _typeof(deserialized)).toEqual('object');
				});

				it('should not contain the amount field', function () {
					expect(deserialized.hasOwnProperty('amount')).toEqual(false);
				});

				it('should not contain the units field', function () {
					expect(deserialized.hasOwnProperty('units')).toEqual(false);
				});
			});
		});
	});
});

}).call(this,require("buffer").Buffer)
},{"./../../../../lib/schema/binary/schema":2,"buffer":30}],35:[function(require,module,exports){
(function (Buffer){
'use strict';

var _typeof2 = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _typeof = typeof Symbol === "function" && _typeof2(Symbol.iterator) === "symbol" ? function (obj) {
	return typeof obj === "undefined" ? "undefined" : _typeof2(obj);
} : function (obj) {
	return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj === "undefined" ? "undefined" : _typeof2(obj);
};

var boolean = require('./../../../../../lib/schema/binary/types/boolean');

describe('when checking the length of serialized boolean value', function () {
	describe('and the value is true', function () {
		it('should be one', function () {
			expect(boolean.getByteLength(true)).toEqual(1);
		});
	});

	describe('and the value is false', function () {
		it('should be one', function () {
			expect(boolean.getByteLength(false)).toEqual(1);
		});
	});
});

describe('when writing a boolean to a buffer', function () {
	'use strict';

	var allocateBuffer = function () {
		if (typeof Buffer.allocUnsafe === 'function') {
			return Buffer.allocUnsafe;
		} else {
			return function (size) {
				return new Buffer(size);
			};
		}
	}();

	var buffer = void 0;

	beforeEach(function () {
		buffer = allocateBuffer(1);
	});

	describe('and the value is true', function () {
		var writeOffset = void 0;

		beforeEach(function () {
			writeOffset = boolean.write(buffer, true, 0);
		});

		it('should write one byte to the buffer', function () {
			expect(writeOffset).toEqual(1);
		});

		describe('and the buffer is read', function () {
			var decoded = void 0;

			beforeEach(function () {
				decoded = boolean.read(buffer, 0);
			});

			it('should be a boolean value', function () {
				expect(typeof decoded === 'undefined' ? 'undefined' : _typeof(decoded)).toEqual('boolean');
			});

			it('should be a true value', function () {
				expect(decoded).toEqual(true);
			});
		});
	});

	describe('and the value is false', function () {
		var writeOffset = void 0;

		beforeEach(function () {
			writeOffset = boolean.write(buffer, false, 0);
		});

		it('should write one byte to the buffer', function () {
			expect(writeOffset).toEqual(1);
		});

		describe('and the buffer is read', function () {
			var decoded = void 0;

			beforeEach(function () {
				decoded = boolean.read(buffer, 0);
			});

			it('should be a boolean value', function () {
				expect(typeof decoded === 'undefined' ? 'undefined' : _typeof(decoded)).toEqual('boolean');
			});

			it('should be a true value', function () {
				expect(decoded).toEqual(false);
			});
		});
	});
});

}).call(this,require("buffer").Buffer)
},{"./../../../../../lib/schema/binary/types/boolean":3,"buffer":30}],36:[function(require,module,exports){
(function (Buffer){
'use strict';

var date = require('./../../../../../lib/schema/binary/types/date');

describe('when checking the length of serialized date instance', function () {
	describe('and the value is now', function () {
		it('should be six', function () {
			expect(date.getByteLength(new Date())).toEqual(6);
		});
	});
});

describe('when writing a date to a buffer', function () {
	'use strict';

	var allocateBuffer = function () {
		if (typeof Buffer.allocUnsafe === 'function') {
			return Buffer.allocUnsafe;
		} else {
			return function (size) {
				return new Buffer(size);
			};
		}
	}();

	var buffer = void 0;

	beforeEach(function () {
		buffer = allocateBuffer(6);
	});

	describe('and the value is now', function () {
		var original = void 0;
		var writeOffset = void 0;

		beforeEach(function () {
			writeOffset = date.write(buffer, original = new Date(), 0);
		});

		it('should write six bytes to the buffer', function () {
			expect(writeOffset).toEqual(6);
		});

		describe('and the buffer is read', function () {
			var decoded = void 0;

			beforeEach(function () {
				decoded = date.read(buffer, 0);
			});

			it('should be a date value', function () {
				expect(decoded instanceof Date).toEqual(true);
			});

			it('should be have the correct time value', function () {
				expect(decoded.getTime()).toEqual(original.getTime());
			});
		});
	});
});

}).call(this,require("buffer").Buffer)
},{"./../../../../../lib/schema/binary/types/date":4,"buffer":30}],37:[function(require,module,exports){
(function (Buffer){
'use strict';

var _typeof2 = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _typeof = typeof Symbol === "function" && _typeof2(Symbol.iterator) === "symbol" ? function (obj) {
	return typeof obj === "undefined" ? "undefined" : _typeof2(obj);
} : function (obj) {
	return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj === "undefined" ? "undefined" : _typeof2(obj);
};

var double = require('./../../../../../lib/schema/binary/types/double');

describe('when checking the length of serialized double instance', function () {
	describe('and the value is Math.E', function () {
		it('should be 8', function () {
			expect(double.getByteLength(Math.E)).toEqual(8);
		});
	});
});

describe('when writing a double to a buffer', function () {
	'use strict';

	var allocateBuffer = function () {
		if (typeof Buffer.allocUnsafe === 'function') {
			return Buffer.allocUnsafe;
		} else {
			return function (size) {
				return new Buffer(size);
			};
		}
	}();

	var buffer = void 0;

	beforeEach(function () {
		buffer = allocateBuffer(8);
	});

	describe('and the value is Math.E', function () {
		var original = void 0;
		var writeOffset = void 0;

		beforeEach(function () {
			writeOffset = double.write(buffer, original = Math.E, 0);
		});

		it('should write eight bytes to the buffer', function () {
			expect(writeOffset).toEqual(8);
		});

		describe('and the buffer is read', function () {
			var decoded = void 0;

			beforeEach(function () {
				decoded = double.read(buffer, 0);
			});

			it('should be a number', function () {
				expect(typeof decoded === 'undefined' ? 'undefined' : _typeof(decoded)).toEqual('number');
			});

			it('should equal Math.E', function () {
				expect(decoded).toEqual(original);
			});
		});
	});

	describe('and the value is one third', function () {
		var original = void 0;
		var writeOffset = void 0;

		beforeEach(function () {
			writeOffset = double.write(buffer, original = 1 / 3, 0);
		});

		it('should write eight bytes to the buffer', function () {
			expect(writeOffset).toEqual(8);
		});

		describe('and the buffer is read', function () {
			var decoded = void 0;

			beforeEach(function () {
				decoded = double.read(buffer, 0);
			});

			it('should be a number', function () {
				expect(typeof decoded === 'undefined' ? 'undefined' : _typeof(decoded)).toEqual('number');
			});

			it('should equal one third', function () {
				expect(decoded).toEqual(1 / 3);
			});
		});
	});
});

}).call(this,require("buffer").Buffer)
},{"./../../../../../lib/schema/binary/types/double":5,"buffer":30}],38:[function(require,module,exports){
(function (Buffer){
'use strict';

var _typeof2 = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _typeof = typeof Symbol === "function" && _typeof2(Symbol.iterator) === "symbol" ? function (obj) {
	return typeof obj === "undefined" ? "undefined" : _typeof2(obj);
} : function (obj) {
	return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj === "undefined" ? "undefined" : _typeof2(obj);
};

var float = require('./../../../../../lib/schema/binary/types/float');

describe('when checking the length of serialized float instance', function () {
	describe('and the value is 1.5', function () {
		it('should be 4', function () {
			expect(float.getByteLength(1.5)).toEqual(4);
		});
	});
});

describe('when writing a float to a buffer', function () {
	'use strict';

	var allocateBuffer = function () {
		if (typeof Buffer.allocUnsafe === 'function') {
			return Buffer.allocUnsafe;
		} else {
			return function (size) {
				return new Buffer(size);
			};
		}
	}();

	var buffer = void 0;

	beforeEach(function () {
		buffer = allocateBuffer(4);
	});

	describe('and the value is 1.5', function () {
		var original = void 0;
		var writeOffset = void 0;

		beforeEach(function () {
			writeOffset = float.write(buffer, original = 1.5, 0);
		});

		it('should write four bytes to the buffer', function () {
			expect(writeOffset).toEqual(4);
		});

		describe('and the buffer is read', function () {
			var decoded = void 0;

			beforeEach(function () {
				decoded = float.read(buffer, 0);
			});

			it('should be a number', function () {
				expect(typeof decoded === 'undefined' ? 'undefined' : _typeof(decoded)).toEqual('number');
			});

			it('should equal 1.5', function () {
				expect(decoded).toEqual(original);
			});
		});
	});
});

}).call(this,require("buffer").Buffer)
},{"./../../../../../lib/schema/binary/types/float":6,"buffer":30}],39:[function(require,module,exports){
(function (Buffer){
'use strict';

var _typeof2 = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _typeof = typeof Symbol === "function" && _typeof2(Symbol.iterator) === "symbol" ? function (obj) {
	return typeof obj === "undefined" ? "undefined" : _typeof2(obj);
} : function (obj) {
	return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj === "undefined" ? "undefined" : _typeof2(obj);
};

var int16 = require('./../../../../../lib/schema/binary/types/int16');

describe('when checking the length of serialized int16 instance', function () {
	describe('and the value is zero', function () {
		it('should be 2', function () {
			expect(int16.getByteLength(0)).toEqual(2);
		});
	});
});

describe('when writing a int16 to a buffer', function () {
	'use strict';

	var allocateBuffer = function () {
		if (typeof Buffer.allocUnsafe === 'function') {
			return Buffer.allocUnsafe;
		} else {
			return function (size) {
				return new Buffer(size);
			};
		}
	}();

	var buffer = void 0;

	beforeEach(function () {
		buffer = allocateBuffer(4);
	});

	describe('and the value is 42', function () {
		var original = void 0;
		var writeOffset = void 0;

		beforeEach(function () {
			writeOffset = int16.write(buffer, original = 42, 0);
		});

		it('should write two bytes to the buffer', function () {
			expect(writeOffset).toEqual(2);
		});

		describe('and the buffer is read', function () {
			var decoded = void 0;

			beforeEach(function () {
				decoded = int16.read(buffer, 0);
			});

			it('should be a number', function () {
				expect(typeof decoded === 'undefined' ? 'undefined' : _typeof(decoded)).toEqual('number');
			});

			it('should equal 42', function () {
				expect(decoded).toEqual(original);
			});
		});
	});

	describe('and the value is the maximum value (Math.pow(2, 15) - 1)', function () {
		var original = void 0;
		var writeOffset = void 0;

		beforeEach(function () {
			writeOffset = int16.write(buffer, original = Math.pow(2, 15) - 1, 0);
		});

		it('should write two bytes to the buffer', function () {
			expect(writeOffset).toEqual(2);
		});

		describe('and the buffer is read', function () {
			var decoded = void 0;

			beforeEach(function () {
				decoded = int16.read(buffer, 0);
			});

			it('should be a number', function () {
				expect(typeof decoded === 'undefined' ? 'undefined' : _typeof(decoded)).toEqual('number');
			});

			it('should equal Math.pow(2, 15) - 1', function () {
				expect(decoded).toEqual(original);
			});
		});
	});

	describe('and the value is the minimum value (Math.pow(2, 15) * -1)', function () {
		var original = void 0;
		var writeOffset = void 0;

		beforeEach(function () {
			writeOffset = int16.write(buffer, original = Math.pow(2, 15) * -1, 0);
		});

		it('should write two bytes to the buffer', function () {
			expect(writeOffset).toEqual(2);
		});

		describe('and the buffer is read', function () {
			var decoded = void 0;

			beforeEach(function () {
				decoded = int16.read(buffer, 0);
			});

			it('should be a number', function () {
				expect(typeof decoded === 'undefined' ? 'undefined' : _typeof(decoded)).toEqual('number');
			});

			it('should equal Math.pow(2, 15) * -1', function () {
				expect(decoded).toEqual(original);
			});
		});
	});

	describe('and the value is more than the maximum', function () {
		it('an exception should be thrown', function () {
			expect(function () {
				return int16.write(buffer, Math.pow(2, 15), 0);
			}).toThrow();
		});
	});

	describe('and the value is less than the minimum', function () {
		it('an exception should be thrown', function () {
			expect(function () {
				return int16.write(buffer, Math.pow(2, 15) * -1 - 1, 0);
			}).toThrow();
		});
	});
});

}).call(this,require("buffer").Buffer)
},{"./../../../../../lib/schema/binary/types/int16":7,"buffer":30}],40:[function(require,module,exports){
(function (Buffer){
'use strict';

var _typeof2 = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _typeof = typeof Symbol === "function" && _typeof2(Symbol.iterator) === "symbol" ? function (obj) {
	return typeof obj === "undefined" ? "undefined" : _typeof2(obj);
} : function (obj) {
	return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj === "undefined" ? "undefined" : _typeof2(obj);
};

var int32 = require('./../../../../../lib/schema/binary/types/int32');

describe('when checking the length of serialized int32 instance', function () {
	describe('and the value is zero', function () {
		it('should be 4', function () {
			expect(int32.getByteLength(0)).toEqual(4);
		});
	});
});

describe('when writing a int32 to a buffer', function () {
	'use strict';

	var allocateBuffer = function () {
		if (typeof Buffer.allocUnsafe === 'function') {
			return Buffer.allocUnsafe;
		} else {
			return function (size) {
				return new Buffer(size);
			};
		}
	}();

	var buffer = void 0;

	beforeEach(function () {
		buffer = allocateBuffer(4);
	});

	describe('and the value is 42', function () {
		var original = void 0;
		var writeOffset = void 0;

		beforeEach(function () {
			writeOffset = int32.write(buffer, original = 42, 0);
		});

		it('should write four bytes to the buffer', function () {
			expect(writeOffset).toEqual(4);
		});

		describe('and the buffer is read', function () {
			var decoded = void 0;

			beforeEach(function () {
				decoded = int32.read(buffer, 0);
			});

			it('should be a number', function () {
				expect(typeof decoded === 'undefined' ? 'undefined' : _typeof(decoded)).toEqual('number');
			});

			it('should equal 42', function () {
				expect(decoded).toEqual(original);
			});
		});
	});

	describe('and the value is the maximum value (Math.pow(2, 31) - 1)', function () {
		var original = void 0;
		var writeOffset = void 0;

		beforeEach(function () {
			writeOffset = int32.write(buffer, original = Math.pow(2, 31) - 1, 0);
		});

		it('should write four bytes to the buffer', function () {
			expect(writeOffset).toEqual(4);
		});

		describe('and the buffer is read', function () {
			var decoded = void 0;

			beforeEach(function () {
				decoded = int32.read(buffer, 0);
			});

			it('should be a number', function () {
				expect(typeof decoded === 'undefined' ? 'undefined' : _typeof(decoded)).toEqual('number');
			});

			it('should equal Math.pow(2, 31) - 1', function () {
				expect(decoded).toEqual(original);
			});
		});
	});

	describe('and the value is the minimum value (Math.pow(2, 31) * -1)', function () {
		var original = void 0;
		var writeOffset = void 0;

		beforeEach(function () {
			writeOffset = int32.write(buffer, original = Math.pow(2, 31) * -1, 0);
		});

		it('should write four bytes to the buffer', function () {
			expect(writeOffset).toEqual(4);
		});

		describe('and the buffer is read', function () {
			var decoded = void 0;

			beforeEach(function () {
				decoded = int32.read(buffer, 0);
			});

			it('should be a nushould be a int32 valuember', function () {
				expect(typeof decoded === 'undefined' ? 'undefined' : _typeof(decoded)).toEqual('number');
			});

			it('should equal Math.pow(2, 31) * -1', function () {
				expect(decoded).toEqual(original);
			});
		});
	});

	describe('and the value is more than the maximum', function () {
		it('an exception should be thrown', function () {
			expect(function () {
				return int32.write(buffer, Math.pow(2, 31), 0);
			}).toThrow();
		});
	});

	describe('and the value is less than the minimum', function () {
		it('an exception should be thrown', function () {
			expect(function () {
				return int32.write(buffer, Math.pow(2, 31) * -1 - 1, 0);
			}).toThrow();
		});
	});
});

}).call(this,require("buffer").Buffer)
},{"./../../../../../lib/schema/binary/types/int32":8,"buffer":30}],41:[function(require,module,exports){
(function (Buffer){
'use strict';

var _typeof2 = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _typeof = typeof Symbol === "function" && _typeof2(Symbol.iterator) === "symbol" ? function (obj) {
	return typeof obj === "undefined" ? "undefined" : _typeof2(obj);
} : function (obj) {
	return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj === "undefined" ? "undefined" : _typeof2(obj);
};

var int8 = require('./../../../../../lib/schema/binary/types/int8');

describe('when checking the length of serialized int8 instance', function () {
	describe('and the value is zero', function () {
		it('should be 1', function () {
			expect(int8.getByteLength(0)).toEqual(1);
		});
	});
});

describe('when writing a int8 to a buffer', function () {
	'use strict';

	var allocateBuffer = function () {
		if (typeof Buffer.allocUnsafe === 'function') {
			return Buffer.allocUnsafe;
		} else {
			return function (size) {
				return new Buffer(size);
			};
		}
	}();

	var buffer = void 0;

	beforeEach(function () {
		buffer = allocateBuffer(1);
	});

	describe('and the value is 42', function () {
		var original = void 0;
		var writeOffset = void 0;

		beforeEach(function () {
			writeOffset = int8.write(buffer, original = 42, 0);
		});

		it('should write one byte to the buffer', function () {
			expect(writeOffset).toEqual(1);
		});

		describe('and the buffer is read', function () {
			var decoded = void 0;

			beforeEach(function () {
				decoded = int8.read(buffer, 0);
			});

			it('should be a int8 value', function () {
				expect(typeof decoded === 'undefined' ? 'undefined' : _typeof(decoded)).toEqual('number');
			});

			it('should equal 42', function () {
				expect(decoded).toEqual(original);
			});
		});
	});

	describe('and the value is the maximum value (Math.pow(2, 7) - 1)', function () {
		var original = void 0;
		var writeOffset = void 0;

		beforeEach(function () {
			writeOffset = int8.write(buffer, original = Math.pow(2, 7) - 1, 0);
		});

		it('should write one byte to the buffer', function () {
			expect(writeOffset).toEqual(1);
		});

		describe('and the buffer is read', function () {
			var decoded = void 0;

			beforeEach(function () {
				decoded = int8.read(buffer, 0);
			});

			it('should be a int8 value', function () {
				expect(typeof decoded === 'undefined' ? 'undefined' : _typeof(decoded)).toEqual('number');
			});

			it('should equal Math.pow(2, 7) - 1', function () {
				expect(decoded).toEqual(original);
			});
		});
	});

	describe('and the value is the minimum value (Math.pow(2, 7) * -1)', function () {
		var original = void 0;
		var writeOffset = void 0;

		beforeEach(function () {
			writeOffset = int8.write(buffer, original = Math.pow(2, 7) * -1, 0);
		});

		it('should write one byte to the buffer', function () {
			expect(writeOffset).toEqual(1);
		});

		describe('and the buffer is read', function () {
			var decoded = void 0;

			beforeEach(function () {
				decoded = int8.read(buffer, 0);
			});

			it('should be a int8 value', function () {
				expect(typeof decoded === 'undefined' ? 'undefined' : _typeof(decoded)).toEqual('number');
			});

			it('should equal Math.pow(2, 7) * -1', function () {
				expect(decoded).toEqual(original);
			});
		});
	});

	describe('and the value is more than the maximum', function () {
		it('an exception should be thrown', function () {
			expect(function () {
				return int8.write(buffer, Math.pow(2, 7), 0);
			}).toThrow();
		});
	});

	describe('and the value is less than the minimum', function () {
		it('an exception should be thrown', function () {
			expect(function () {
				return int8.write(buffer, Math.pow(2, 7) * -1 - 1, 0);
			}).toThrow();
		});
	});
});

}).call(this,require("buffer").Buffer)
},{"./../../../../../lib/schema/binary/types/int8":9,"buffer":30}],42:[function(require,module,exports){
(function (Buffer){
'use strict';

var _typeof2 = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _typeof = typeof Symbol === "function" && _typeof2(Symbol.iterator) === "symbol" ? function (obj) {
	return typeof obj === "undefined" ? "undefined" : _typeof2(obj);
} : function (obj) {
	return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj === "undefined" ? "undefined" : _typeof2(obj);
};

var uint16 = require('./../../../../../lib/schema/binary/types/uint16');

describe('when checking the length of serialized uint16 instance', function () {
	describe('and the value is zero', function () {
		it('should be 2', function () {
			expect(uint16.getByteLength(0)).toEqual(2);
		});
	});
});

describe('when writing a uint16 to a buffer', function () {
	'use strict';

	var allocateBuffer = function () {
		if (typeof Buffer.allocUnsafe === 'function') {
			return Buffer.allocUnsafe;
		} else {
			return function (size) {
				return new Buffer(size);
			};
		}
	}();

	var buffer = void 0;

	beforeEach(function () {
		buffer = allocateBuffer(4);
	});

	describe('and the value is 42', function () {
		var original = void 0;
		var writeOffset = void 0;

		beforeEach(function () {
			writeOffset = uint16.write(buffer, original = 42, 0);
		});

		it('should write two bytes to the buffer', function () {
			expect(writeOffset).toEqual(2);
		});

		describe('and the buffer is read', function () {
			var decoded = void 0;

			beforeEach(function () {
				decoded = uint16.read(buffer, 0);
			});

			it('should be a number', function () {
				expect(typeof decoded === 'undefined' ? 'undefined' : _typeof(decoded)).toEqual('number');
			});

			it('should equal 42', function () {
				expect(decoded).toEqual(original);
			});
		});
	});

	describe('and the value is the maximum value (Math.pow(2, 16) - 1)', function () {
		var original = void 0;
		var writeOffset = void 0;

		beforeEach(function () {
			writeOffset = uint16.write(buffer, original = Math.pow(2, 16) - 1, 0);
		});

		it('should write two bytes to the buffer', function () {
			expect(writeOffset).toEqual(2);
		});

		describe('and the buffer is read', function () {
			var decoded = void 0;

			beforeEach(function () {
				decoded = uint16.read(buffer, 0);
			});

			it('should be a number', function () {
				expect(typeof decoded === 'undefined' ? 'undefined' : _typeof(decoded)).toEqual('number');
			});

			it('should equal Math.pow(2, 16) - 1', function () {
				expect(decoded).toEqual(original);
			});
		});
	});

	describe('and the value is the minimum value (0)', function () {
		var original = void 0;
		var writeOffset = void 0;

		beforeEach(function () {
			writeOffset = uint16.write(buffer, original = 0, 0);
		});

		it('should write two bytes to the buffer', function () {
			expect(writeOffset).toEqual(2);
		});

		describe('and the buffer is read', function () {
			var decoded = void 0;

			beforeEach(function () {
				decoded = uint16.read(buffer, 0);
			});

			it('should be a number', function () {
				expect(typeof decoded === 'undefined' ? 'undefined' : _typeof(decoded)).toEqual('number');
			});

			it('should equal 0', function () {
				expect(decoded).toEqual(original);
			});
		});
	});

	describe('and the value is more than the maximum', function () {
		it('an exception should be thrown', function () {
			expect(function () {
				return uint16.write(buffer, Math.pow(2, 16), 0);
			}).toThrow();
		});
	});

	describe('and the value is less than the minimum', function () {
		it('an exception should be thrown', function () {
			expect(function () {
				return uint16.write(buffer, -1, 0);
			}).toThrow();
		});
	});
});

}).call(this,require("buffer").Buffer)
},{"./../../../../../lib/schema/binary/types/uint16":11,"buffer":30}],43:[function(require,module,exports){
(function (Buffer){
'use strict';

var _typeof2 = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _typeof = typeof Symbol === "function" && _typeof2(Symbol.iterator) === "symbol" ? function (obj) {
	return typeof obj === "undefined" ? "undefined" : _typeof2(obj);
} : function (obj) {
	return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj === "undefined" ? "undefined" : _typeof2(obj);
};

var uint32 = require('./../../../../../lib/schema/binary/types/uint32');

describe('when checking the length of serialized uint32 instance', function () {
	describe('and the value is zero', function () {
		it('should be 4', function () {
			expect(uint32.getByteLength(0)).toEqual(4);
		});
	});
});

describe('when writing a uint32 to a buffer', function () {
	'use strict';

	var allocateBuffer = function () {
		if (typeof Buffer.allocUnsafe === 'function') {
			return Buffer.allocUnsafe;
		} else {
			return function (size) {
				return new Buffer(size);
			};
		}
	}();

	var buffer = void 0;

	beforeEach(function () {
		buffer = allocateBuffer(4);
	});

	describe('and the value is 42', function () {
		var original = void 0;
		var writeOffset = void 0;

		beforeEach(function () {
			writeOffset = uint32.write(buffer, original = 42, 0);
		});

		it('should write four bytes to the buffer', function () {
			expect(writeOffset).toEqual(4);
		});

		describe('and the buffer is read', function () {
			var decoded = void 0;

			beforeEach(function () {
				decoded = uint32.read(buffer, 0);
			});

			it('should be a number', function () {
				expect(typeof decoded === 'undefined' ? 'undefined' : _typeof(decoded)).toEqual('number');
			});

			it('should equal 42', function () {
				expect(decoded).toEqual(original);
			});
		});
	});

	describe('and the value is the maximum value (Math.pow(2, 32) - 1)', function () {
		var original = void 0;
		var writeOffset = void 0;

		beforeEach(function () {
			writeOffset = uint32.write(buffer, original = Math.pow(2, 32) - 1, 0);
		});

		it('should write four bytes to the buffer', function () {
			expect(writeOffset).toEqual(4);
		});

		describe('and the buffer is read', function () {
			var decoded = void 0;

			beforeEach(function () {
				decoded = uint32.read(buffer, 0);
			});

			it('should be a number', function () {
				expect(typeof decoded === 'undefined' ? 'undefined' : _typeof(decoded)).toEqual('number');
			});

			it('should equal Math.pow(2, 32) - 1', function () {
				expect(decoded).toEqual(original);
			});
		});
	});

	describe('and the value is the minimum value (0)', function () {
		var original = void 0;
		var writeOffset = void 0;

		beforeEach(function () {
			writeOffset = uint32.write(buffer, original = 0, 0);
		});

		it('should write four bytes to the buffer', function () {
			expect(writeOffset).toEqual(4);
		});

		describe('and the buffer is read', function () {
			var decoded = void 0;

			beforeEach(function () {
				decoded = uint32.read(buffer, 0);
			});

			it('should be a nushould be a uint32 valuember', function () {
				expect(typeof decoded === 'undefined' ? 'undefined' : _typeof(decoded)).toEqual('number');
			});

			it('should equal 0', function () {
				expect(decoded).toEqual(original);
			});
		});
	});

	describe('and the value is more than the maximum', function () {
		it('an exception should be thrown', function () {
			expect(function () {
				return uint32.write(buffer, Math.pow(2, 32), 0);
			}).toThrow();
		});
	});

	describe('and the value is less than the minimum', function () {
		it('an exception should be thrown', function () {
			expect(function () {
				return uint32.write(buffer, -1, 0);
			}).toThrow();
		});
	});
});

}).call(this,require("buffer").Buffer)
},{"./../../../../../lib/schema/binary/types/uint32":12,"buffer":30}],44:[function(require,module,exports){
(function (Buffer){
'use strict';

var _typeof2 = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _typeof = typeof Symbol === "function" && _typeof2(Symbol.iterator) === "symbol" ? function (obj) {
	return typeof obj === "undefined" ? "undefined" : _typeof2(obj);
} : function (obj) {
	return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj === "undefined" ? "undefined" : _typeof2(obj);
};

var uint8 = require('./../../../../../lib/schema/binary/types/uint8');

describe('when checking the length of serialized uint8 instance', function () {
	describe('and the value is zero', function () {
		it('should be 1', function () {
			expect(uint8.getByteLength(0)).toEqual(1);
		});
	});
});

describe('when writing a uint8 to a buffer', function () {
	'use strict';

	var allocateBuffer = function () {
		if (typeof Buffer.allocUnsafe === 'function') {
			return Buffer.allocUnsafe;
		} else {
			return function (size) {
				return new Buffer(size);
			};
		}
	}();

	var buffer = void 0;

	beforeEach(function () {
		buffer = allocateBuffer(1);
	});

	describe('and the value is 42', function () {
		var original = void 0;
		var writeOffset = void 0;

		beforeEach(function () {
			writeOffset = uint8.write(buffer, original = 42, 0);
		});

		it('should write one byte to the buffer', function () {
			expect(writeOffset).toEqual(1);
		});

		describe('and the buffer is read', function () {
			var decoded = void 0;

			beforeEach(function () {
				decoded = uint8.read(buffer, 0);
			});

			it('should be a uint8 value', function () {
				expect(typeof decoded === 'undefined' ? 'undefined' : _typeof(decoded)).toEqual('number');
			});

			it('should equal 42', function () {
				expect(decoded).toEqual(original);
			});
		});
	});

	describe('and the value is the maximum value (Math.pow(2, 8) - 1)', function () {
		var original = void 0;
		var writeOffset = void 0;

		beforeEach(function () {
			writeOffset = uint8.write(buffer, original = Math.pow(2, 8) - 1, 0);
		});

		it('should write one byte to the buffer', function () {
			expect(writeOffset).toEqual(1);
		});

		describe('and the buffer is read', function () {
			var decoded = void 0;

			beforeEach(function () {
				decoded = uint8.read(buffer, 0);
			});

			it('should be a uint8 value', function () {
				expect(typeof decoded === 'undefined' ? 'undefined' : _typeof(decoded)).toEqual('number');
			});

			it('should equal Math.pow(2, 8) - 1', function () {
				expect(decoded).toEqual(original);
			});
		});
	});

	describe('and the value is the minimum value (0)', function () {
		var original = void 0;
		var writeOffset = void 0;

		beforeEach(function () {
			writeOffset = uint8.write(buffer, original = 0, 0);
		});

		it('should write one byte to the buffer', function () {
			expect(writeOffset).toEqual(1);
		});

		describe('and the buffer is read', function () {
			var decoded = void 0;

			beforeEach(function () {
				decoded = uint8.read(buffer, 0);
			});

			it('should be a uint8 value', function () {
				expect(typeof decoded === 'undefined' ? 'undefined' : _typeof(decoded)).toEqual('number');
			});

			it('should equal 0', function () {
				expect(decoded).toEqual(original);
			});
		});
	});

	describe('and the value is more than the maximum', function () {
		it('an exception should be thrown', function () {
			expect(function () {
				return uint8.write(buffer, Math.pow(2, 8), 0);
			}).toThrow();
		});
	});

	describe('and the value is less than the minimum', function () {
		it('an exception should be thrown', function () {
			expect(function () {
				return uint8.write(buffer, -1, 0);
			}).toThrow();
		});
	});
});

}).call(this,require("buffer").Buffer)
},{"./../../../../../lib/schema/binary/types/uint8":14,"buffer":30}],45:[function(require,module,exports){
'use strict';

var _typeof2 = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _typeof = typeof Symbol === "function" && _typeof2(Symbol.iterator) === "symbol" ? function (obj) {
	return typeof obj === "undefined" ? "undefined" : _typeof2(obj);
} : function (obj) {
	return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj === "undefined" ? "undefined" : _typeof2(obj);
};

var factory = require('./../../../../lib/schema/string/schema');

describe('when generating a schema', function () {
	'use strict';

	describe('composed of [ { name: "miles", type: "int32" } ]', function () {
		var schema = void 0;

		beforeEach(function () {
			schema = factory.create([{ name: "miles", type: "int32" }]);
		});

		describe('and serializing { miles: 41 }', function () {
			var serialized = void 0;

			beforeEach(function () {
				serialized = schema.encode({ miles: 41 });
			});

			it('should be a string', function () {
				expect(typeof serialized === 'undefined' ? 'undefined' : _typeof(serialized)).toEqual('string');
			});

			describe('and deserializing', function () {
				var deserialized = void 0;

				beforeEach(function () {
					deserialized = schema.decode(serialized);
				});

				it('should be an object', function () {
					expect(typeof deserialized === 'undefined' ? 'undefined' : _typeof(deserialized)).toEqual('object');
				});

				it('should contain the miles field', function () {
					expect(deserialized.hasOwnProperty('miles')).toEqual(true);
				});

				it('should have a value of 41 for the miles field', function () {
					expect(deserialized.miles).toEqual(41);
				});
			});
		});

		describe('and serializing { miles: null }', function () {
			var serialized = void 0;

			beforeEach(function () {
				serialized = schema.encode({ miles: null });
			});

			it('should be a string', function () {
				expect(typeof serialized === 'undefined' ? 'undefined' : _typeof(serialized)).toEqual('string');
			});

			describe('and deserializing', function () {
				var deserialized = void 0;

				beforeEach(function () {
					deserialized = schema.decode(serialized);
				});

				it('should be an object', function () {
					expect(typeof deserialized === 'undefined' ? 'undefined' : _typeof(deserialized)).toEqual('object');
				});

				it('should contain the miles field', function () {
					expect(deserialized.hasOwnProperty('miles')).toEqual(true);
				});

				it('should have a null value for the miles field', function () {
					expect(deserialized.miles).toEqual(null);
				});
			});
		});

		describe('and serializing { miles: undefined }', function () {
			var serialized = void 0;

			beforeEach(function () {
				serialized = schema.encode({ miles: undefined });
			});

			it('should be a string', function () {
				expect(typeof serialized === 'undefined' ? 'undefined' : _typeof(serialized)).toEqual('string');
			});

			describe('and deserializing', function () {
				var deserialized = void 0;

				beforeEach(function () {
					deserialized = schema.decode(serialized);
				});

				it('should be an object', function () {
					expect(typeof deserialized === 'undefined' ? 'undefined' : _typeof(deserialized)).toEqual('object');
				});

				it('should contain the miles field', function () {
					expect(deserialized.hasOwnProperty('miles')).toEqual(true);
				});

				it('should have an undefined value for the miles field', function () {
					expect(deserialized.miles).toEqual(undefined);
				});
			});
		});

		describe('and serializing { }', function () {
			var serialized = void 0;

			beforeEach(function () {
				serialized = schema.encode({});
			});

			it('should be a string', function () {
				expect(typeof serialized === 'undefined' ? 'undefined' : _typeof(serialized)).toEqual('string');
			});

			describe('and deserializing', function () {
				var deserialized = void 0;

				beforeEach(function () {
					deserialized = schema.decode(serialized);
				});

				it('should be an object', function () {
					expect(typeof deserialized === 'undefined' ? 'undefined' : _typeof(deserialized)).toEqual('object');
				});

				it('should not contain the miles field', function () {
					expect(deserialized.hasOwnProperty('miles')).toEqual(false);
				});
			});
		});

		describe('and serializing { kilometers: 0.621 }', function () {
			var serialized = void 0;

			beforeEach(function () {
				serialized = schema.encode({ kilometers: 0.621 });
			});

			it('should be a string', function () {
				expect(typeof serialized === 'undefined' ? 'undefined' : _typeof(serialized)).toEqual('string');
			});

			describe('and deserializing', function () {
				var deserialized = void 0;

				beforeEach(function () {
					deserialized = schema.decode(serialized);
				});

				it('should be an object', function () {
					expect(typeof deserialized === 'undefined' ? 'undefined' : _typeof(deserialized)).toEqual('object');
				});

				it('should not contain the miles field', function () {
					expect(deserialized.hasOwnProperty('miles')).toEqual(false);
				});
			});
		});
	});

	describe('composed of [ { name: "amount", type: "double" }, { name: "units", type: "string" } ]', function () {
		var schema = void 0;

		beforeEach(function () {
			schema = factory.create([{ name: "amount", type: "double" }, { name: "units", type: "string" }]);
		});

		describe('and serializing { amount: Math.PI, units: "radians" }', function () {
			var serialized = void 0;

			beforeEach(function () {
				serialized = schema.encode({ amount: Math.PI, units: "radians" });
			});

			it('should be a string', function () {
				expect(typeof serialized === 'undefined' ? 'undefined' : _typeof(serialized)).toEqual('string');
			});

			describe('and deserializing', function () {
				var deserialized = void 0;

				beforeEach(function () {
					deserialized = schema.decode(serialized);
				});

				it('should be an object', function () {
					expect(typeof deserialized === 'undefined' ? 'undefined' : _typeof(deserialized)).toEqual('object');
				});

				it('should contain the amount field', function () {
					expect(deserialized.hasOwnProperty('amount')).toEqual(true);
				});

				it('should have a value of Math.PI for the amount field', function () {
					expect(deserialized.amount).toEqual(Math.PI);
				});

				it('should contain the units field', function () {
					expect(deserialized.hasOwnProperty('units')).toEqual(true);
				});

				it('should have a value of "radians" for the units field', function () {
					expect(deserialized.units).toEqual("radians");
				});
			});
		});

		describe('and serializing { amount: 180 }', function () {
			var serialized = void 0;

			beforeEach(function () {
				serialized = schema.encode({ amount: 180 });
			});

			it('should be a string', function () {
				expect(typeof serialized === 'undefined' ? 'undefined' : _typeof(serialized)).toEqual('string');
			});

			describe('and deserializing', function () {
				var deserialized = void 0;

				beforeEach(function () {
					deserialized = schema.decode(serialized);
				});

				it('should be an object', function () {
					expect(typeof deserialized === 'undefined' ? 'undefined' : _typeof(deserialized)).toEqual('object');
				});

				it('should contain the amount field', function () {
					expect(deserialized.hasOwnProperty('amount')).toEqual(true);
				});

				it('should have a value of 180 for the amount field', function () {
					expect(deserialized.amount).toEqual(180);
				});

				it('should not contain the units field', function () {
					expect(deserialized.hasOwnProperty('units')).toEqual(false);
				});
			});
		});

		describe('and serializing { units: "degrees" }', function () {
			var serialized = void 0;

			beforeEach(function () {
				serialized = schema.encode({ units: "degrees" });
			});

			it('should be a string', function () {
				expect(typeof serialized === 'undefined' ? 'undefined' : _typeof(serialized)).toEqual('string');
			});

			describe('and deserializing', function () {
				var deserialized = void 0;

				beforeEach(function () {
					deserialized = schema.decode(serialized);
				});

				it('should be an object', function () {
					expect(typeof deserialized === 'undefined' ? 'undefined' : _typeof(deserialized)).toEqual('object');
				});

				it('should not contain the amount field', function () {
					expect(deserialized.hasOwnProperty('amount')).toEqual(false);
				});

				it('should contain the units field', function () {
					expect(deserialized.hasOwnProperty('units')).toEqual(true);
				});

				it('should have a value of "degrees" for the units field', function () {
					expect(deserialized.units).toEqual("degrees");
				});
			});
		});

		describe('and serializing { }', function () {
			var serialized = void 0;

			beforeEach(function () {
				serialized = schema.encode({});
			});

			it('should be a string', function () {
				expect(typeof serialized === 'undefined' ? 'undefined' : _typeof(serialized)).toEqual('string');
			});

			describe('and deserializing', function () {
				var deserialized = void 0;

				beforeEach(function () {
					deserialized = schema.decode(serialized);
				});

				it('should be an object', function () {
					expect(typeof deserialized === 'undefined' ? 'undefined' : _typeof(deserialized)).toEqual('object');
				});

				it('should not contain the amount field', function () {
					expect(deserialized.hasOwnProperty('amount')).toEqual(false);
				});

				it('should not contain the units field', function () {
					expect(deserialized.hasOwnProperty('units')).toEqual(false);
				});
			});
		});
	});
});

},{"./../../../../lib/schema/string/schema":15}]},{},[33,34,35,36,37,38,39,40,41,42,43,44,45]);
