const process = require("process");

module.exports = {
  development: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST || "db",
    port: process.env.DB_PORT || 5432,
    dialect: "postgres",
  },
};
