const dotenv = require("dotenv");
const app = require("./app");
const connectDB = require("./config/database");

dotenv.config();

const port = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    const server = app.listen(port, () => {
      console.log(`Library Management System API running on port ${port}`);
    });

    process.on("unhandledRejection", (error) => {
      console.error("Unhandled rejection:", error);
      server.close(() => process.exit(1));
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();
