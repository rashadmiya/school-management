const mongoose = require("mongoose");

const connectDatabase = async () => {
  try {
    const conn = await mongoose.connect(process.env.DB_URL, {
      // these options are no longer needed:
      // useNewUrlParser: true,
      // useUnifiedTopology: true,
      // optional timeouts (still okay to keep)
      connectTimeoutMS: 30000,
      socketTimeoutMS: 45000,
    });

    console.log(
      `✅ MongoDB connected: ${conn.connection.name} @ ${conn.connection.host}`
    );
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDatabase;

