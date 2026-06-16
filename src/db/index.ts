import { Pool } from "pg";
import config from "../config";

export const pool = new Pool({
  connectionString: config.connection_string,
  ssl: {
    rejectUnauthorized: false,
  },
});

export const initDB = async () => {
  try {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS users(
        id SERIAL PRIMARY KEY,
        name TEXT,
        email VARCHAR(100) UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role varchar(15) NOT NULL DEFAULT 'contributor',

        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
        )
        `);
    await pool.query(`
                CREATE TABLE IF NOT EXISTS issues(
                id SERIAL PRIMARY KEY,
                reporter_id INT NOT NULL,

                title VARCHAR(150) NOT NULL ,
                description TEXT NOT NULL,
                type VARCHAR(20) NOT NULL,
                status VARCHAR(25) NOT NULL,

                 created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
                )
                `);
    console.log("Database Connected!");
  } catch (error) {
    console.log(error);
  }
};
