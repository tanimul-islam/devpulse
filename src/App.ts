import express, {
  type Application,
  type Request,
  type Response,
} from "express";

import { authRoute } from "./modules/auth/auth.route";
import { globalErrorHandler } from "./middleware/globalErrorHandler";
import { issueRoute } from "./modules/issues/issues.route";

const app: Application = express();

app.use(express.json());
express.urlencoded({ extended: true });

app.use("/api/auth", authRoute);
app.use("/api/issues", issueRoute);

app.get("/", (req: Request, res: Response) => {
  res.status(200).json({ message: "Welcome to Devpulse" });
});
app.use(globalErrorHandler);

export default app;
