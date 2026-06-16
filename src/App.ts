import express, {
  type Application,
  type Request,
  type Response,
} from "express";
import { globalErrorHandler } from "./middleware/globalErrorhandler";
import { authRoute } from "./modules/auth/auth.route";

const app: Application = express();

app.use(express.json());
express.urlencoded({ extended: true });

app.use("/api/auth", authRoute);
app.get("/", (req: Request, res: Response) => {
  res.status(200).json({ message: "Welcome to Devpulse" });
});
app.use(globalErrorHandler);

export default app;
