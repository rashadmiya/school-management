// utils/moneySchemaPlugin.js
const mongoose = require('mongoose');
const { toDecimal, toDecimal128, toString } = require('./decimal');

const Decimal128 = mongoose.Schema.Types.Decimal128;

/**
 * Apply to any schema that stores money.
 * Auto-adds a `toJSON` transform that returns money as a formatted string.
 */
function moneyPlugin(schema) {
    // Ensure Decimal128 is available
    schema.eachPath((path, type) => {
        if (type.instance === 'Decimal128') {
            // Set default to 0 if none
            if (type.defaultValue === undefined) {
                type.defaultValue = () => Decimal128.fromString('0');
            }
        }
    });

    // Add getter/setter for all money fields
    schema.set('toJSON', {
        getters: true,
        transform: (doc, ret) => {
            // Walk ret and convert any Decimal128 to string
            const convert = (obj) => {
                if (!obj || typeof obj !== 'object') return obj;
                for (const key of Object.keys(obj)) {
                    const val = obj[key];
                    if (val instanceof Decimal128) {
                        obj[key] = val.toString();
                    } else if (val && val._bsontype === 'Decimal128') {
                        obj[key] = val.toString();
                    } else if (Array.isArray(val)) {
                        val.forEach(convert);
                    } else if (val && typeof val === 'object') {
                        convert(val);
                    }
                }
                return obj;
            };
            return convert(ret);
        },
    });

    // Add a helper for money virtuals
    schema.methods.moneyToNumber = function (path) {
        return toDecimal(this[path]).toNumber();
    };
}

module.exports = { moneyPlugin, Decimal128 };