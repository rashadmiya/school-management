// middleware/requestContext.js
const { runWithContext } = require('../utils/requestContext');

module.exports = (req, res, next) => {
    runWithContext(req, () => next());
};