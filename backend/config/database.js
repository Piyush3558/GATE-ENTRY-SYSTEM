const { Pool } = require("pg");

require("dotenv").config();

const connectionConfig =
    process.env.DATABASE_URL
        ? {
            connectionString:
                process.env.DATABASE_URL
        }
        : {
            host: process.env.DB_HOST,
            port: process.env.DB_PORT,
            database: process.env.DB_NAME,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD
        };


if (
    process.env.DB_SSL === "true"
) {

    connectionConfig.ssl = {
        rejectUnauthorized:
            process.env.DB_SSL_REJECT_UNAUTHORIZED !==
            "false"
    };

}


const pool =
    new Pool(
        connectionConfig
    );

pool.on("connect", () => {
    console.log("✅ PostgreSQL connected");
});

pool.on("error", (err) => {
    console.error("❌ PostgreSQL pool error:", err);
});

module.exports = pool;
