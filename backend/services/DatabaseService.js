// services/DatabaseService.js
const mongoose = require('mongoose');

class DatabaseService {
    static async withTransaction(operation) {
        const session = await mongoose.startSession();
        session.startTransaction();
        
        try {
            const result = await operation(session);
            await session.commitTransaction();
            return result;
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }
}

module.exports = DatabaseService;