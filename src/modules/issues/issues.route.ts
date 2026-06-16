import { Router } from "express";
import { issueController } from "./issues.controller";
import auth from "../../middleware/auth";

const router = Router();

router.post(
  "/",
  auth("contributor", "maintainer"),
  issueController.createIssue,
);
router.get("/", issueController.getAllISues);
router.patch(
  "/:id",
  auth("contributor", "maintainer"),
  issueController.updateIssue,
);
router.delete("/:id", auth("maintainer"), issueController.deleteIssue);
export const issueRoute = router;
