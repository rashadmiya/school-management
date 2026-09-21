// utils/decimal.js
// utils/decimal.js
const { Decimal } = require('decimal.js');
const mongoose = require('mongoose');
const { Decimal128 } = mongoose.Types;



// Configure Decimal.js globally for money
Decimal.set({
    precision: 20,
    rounding: Decimal.ROUND_HALF_UP,
    toExpNeg: -30,
    toExpPos: 30,
});

const CURRENCY_PRECISION = 2;

/**
 * Convert any value to a Decimal instance.
 * Accepts: number, string, Decimal, mongoose Decimal128, { $numberDecimal: '...' }
 */
// function toDecimal(value) {
//     if (value === null || value === undefined) return new Decimal(0);
//     if (value instanceof Decimal) return value;
//     if (value instanceof Number || typeof value === 'number') return new Decimal(value);
//     if (typeof value === 'string') return new Decimal(value);
//     // Mongo Decimal128
//     if (value.$numberDecimal) return new Decimal(value.$numberDecimal);
//     if (value._bsontype === 'Decimal128') return new Decimal(value.toString());
//     throw new Error(`Cannot convert ${value} to Decimal`);
// }

/**
 * Coerce any of the following into a Decimal:
 *   - number
 *   - string
 *   - Decimal
 *   - mongoose.Types.Decimal128
 *   - null/undefined → Decimal(0)
 */
function toDecimal(value) {
    if (value === null || value === undefined) return new Decimal(0);

    // Already a Decimal — fastest path
    if (value instanceof Decimal) return value;

    // Primitive — direct
    if (typeof value === 'number' || typeof value === 'string') {
        return new Decimal(value);
    }

    // Decimal128 — check THREE ways because different bson versions
    // give different class identities
    if (
        value instanceof Decimal128 ||
        value._bsontype === 'Decimal128' ||
        value.constructor?.name === 'Decimal128'
    ) {
        return new Decimal(value.toString());
    }

    // Plain object with $numberDecimal (JSON-serialized shape)
    if (typeof value === 'object' && typeof value.$numberDecimal === 'string') {
        return new Decimal(value.$numberDecimal);
    }

    // Last resort — let Decimal throw with a useful message
    throw new Error(
        `toDecimal: unsupported value — type=${typeof value}, ` +
        `constructor=${value?.constructor?.name}, ` +
        `_bsontype=${value?._bsontype}`
    );
}

/** Money add */
function add(a, b) {
    return toDecimal(a).plus(toDecimal(b));
}

/** Money subtract */
function sub(a, b) {
    return toDecimal(a).minus(toDecimal(b));
}

/** Money multiply */
function mul(a, b) {
    return toDecimal(a).times(toDecimal(b));
}

/** Money divide */
function div(a, b) {
    return toDecimal(a).dividedBy(toDecimal(b));
}

/** Round to currency precision */
function round(a) {
    return toDecimal(a).toDecimalPlaces(CURRENCY_PRECISION, Decimal.ROUND_HALF_UP);
}

/** Compare: -1, 0, 1 */
function cmp(a, b) {
    return toDecimal(a).comparedTo(toDecimal(b));
}

/** Check zero */
function isZero(a) {
    return toDecimal(a).isZero();
}

/** Check positive */
function isPositive(a) {
    return toDecimal(a).isPositive();
}

/** Check negative */
function isNegative(a) {
    return toDecimal(a).isNegative();
}

/** Convert to Mongo Decimal128 (for saving) */
function toDecimal128(value) {
    const mongoose = require('mongoose');
    return mongoose.Types.Decimal128.fromString(round(value).toString());
}

/** Convert to JS number for display (lossy but fine for UI) */
function toNumber(value) {
    return round(value).toNumber();
}

/** Convert to string for display */
function toString(value) {
    return round(value).toFixed(CURRENCY_PRECISION);
}

/** Percentage of a value */
function percent(value, percentage) {
    return round(toDecimal(value).times(percentage).dividedBy(100));
}

/** Sum an array of Decimals */
function sum(values) {
    return values.reduce((acc, v) => acc.plus(toDecimal(v)), new Decimal(0));
}

/** Min of two */
function min(a, b) {
    return cmp(a, b) <= 0 ? toDecimal(a) : toDecimal(b);
}

/** Max of two */
function max(a, b) {
    return cmp(a, b) >= 0 ? toDecimal(a) : toDecimal(b);
}

module.exports = {
    Decimal,
    toDecimal,
    toDecimal128,
    toNumber,
    toString,
    add,
    sub,
    mul,
    div,
    round,
    cmp,
    isZero,
    isPositive,
    isNegative,
    percent,
    sum,
    min,
    max,
    CURRENCY_PRECISION,
};