require("dotenv").config({ path: "config/.env" }); // Load environment variables at the top

const app = require("./app");
const connectDatabase = require("./config/db");

// Handling uncaught Exception (e.g., undefined variables, syntax errors)
process.on("uncaughtException", (err) => {
  console.error(`Uncaught Exception: ${err.message}`);
  console.error(err.stack);

  process.exit(1);
});

// Connect to Database
try {
  connectDatabase();
} catch (error) {
  console.error("Error connecting to the database:", error.message);
  process.exit(1); // Exit if database connection fails at startup
}

// Create Server
const server = app.listen(process.env.PORT, () => {
  console.log(`Server is running on http://localhost:${process.env.PORT}`);
});

// Handle Unhandled Promise Rejections (e.g., failed DB connections)
process.on("unhandledRejection", (err) => {
  console.error(`Unhandled Rejection: ${err.message}`);
  console.error(err.stack);

  server.close(() => {
    process.exit(1);
  });
});