const NodeCache = require('node-cache');

// Default TTL = 5 minutes (300 seconds)
const cache = new NodeCache({
    stdTTL: 300,
    checkperiod: 120,
    useClones: false
});

module.exports = {
    /**
     * Get cached value
     * @param {string} key
     */
    get: async (key) => {
        try {
            return cache.get(key);
        } catch (err) {
            console.error('Cache GET error:', err);
            return null;
        }
    },

    /**
     * Set cache value
     * @param {string} key
     * @param {any} value
     * @param {number} ttl seconds
     */
    set: async (key, value, ttl = 300) => {
        try {
            cache.set(key, value, ttl);
            return true;
        } catch (err) {
            console.error('Cache SET error:', err);
            return false;
        }
    },

    /**
     * Delete cache key
     */
    del: async (key) => {
        try {
            cache.del(key);
        } catch (err) {
            console.error('Cache DEL error:', err);
        }
    },

    /**
     * Flush all cache
     */
    flush: async () => {
        try {
            cache.flushAll();
        } catch (err) {
            console.error('Cache FLUSH error:', err);
        }
    }
};
