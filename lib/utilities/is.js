module.exports = (() => {
	'use strict';

	return {
		nan(candidate) {
			return typeof(candidate) === 'number' && isNaN(candidate);
		},

		number(candidate) {
			return typeof(candidate) === 'number' && !isNaN(candidate);
		},

		integer(candidate) {
			return typeof(candidate) === 'number' && !isNaN(candidate) && candidate % 1 === 0;
		},

		string(candidate) {
			return typeof(candidate) === 'string';
		},

		date(candidate) {
			return candidate instanceof Date;
		},

		fn(candidate) {
			return typeof(candidate) === 'function';
		},

		array(candidate) {
			return Array.isArray(candidate);
		},

		boolean(candidate) {
			return typeof(candidate) === 'boolean';
		},

		object(candidate) {
			return typeof(candidate) === 'object' && candidate !== null;
		},

		null(candidate) {
			return candidate === null;
		},

		undefined(candidate) {
			return candidate === undefined;
		}
	};
})();