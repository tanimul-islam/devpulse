import app from "./App";
import config from "./config";
import { initDB } from "./db";
console.log("It's in server.ts");
const main = async () => {
  console.log("Intializing Database");
  await initDB();
  app.listen(config.port, () => {
    console.log(`app is running on port ${config.port}`);
  });
};
main();
