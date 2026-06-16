import dotenv from "dotenv";
import path from "path";

dotenv.config({
  path: path.join(process.cwd(), ".env"),
});

const config = {
  port: process.env.PORT,
  connection_string: process.env.DATABASE_URL,
  secret: process.env.ACCESS_SECRET,
  refresh_secret: process.env.REFRESH_SECRET,
};

export default config;
