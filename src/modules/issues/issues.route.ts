import { Router } from "express";
import { issueController } from "./issues.controller";

const router = Router();

router.post("/issues", issueController.createIssue);

export const authRoute = router;
