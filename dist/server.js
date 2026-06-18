// src/App.ts
import express from "express";

// src/modules/auth/auth.route.ts
import { Router } from "express";

// src/db/index.ts
import { Pool } from "pg";

// src/config/index.ts
import dotenv from "dotenv";
import path from "path";
dotenv.config({
  path: path.join(process.cwd(), ".env")
});
var config = {
  port: process.env.PORT,
  connection_string: process.env.DATABASE_URL,
  secret: process.env.ACCESS_SECRET,
  refresh_secret: process.env.REFRESH_SECRET
};
var config_default = config;

// src/db/index.ts
var pool = new Pool({
  connectionString: config_default.connection_string,
  ssl: {
    rejectUnauthorized: false
  }
});
var initDB = async () => {
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
                status VARCHAR(25) NOT NULL DEFAULT 'open',

                 created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
                )
                `);
    console.log("Database Connected!");
  } catch (error) {
    console.log(error);
  }
};

// src/modules/auth/auth.service.ts
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// src/utils/apiError.ts
var ApiError = class extends Error {
  statusCode;
  constructor(statusCode, message) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, new.target.prototype);
  }
};
var apiError_default = ApiError;

// src/modules/auth/auth.service.ts
var createUserIntoDB = async (payload) => {
  const { name, email, password, role } = payload;
  const hashPassword = await bcrypt.hash(password, 10);
  const result = await pool.query(
    "INSERT INTO users (name, email, password,role) VALUES ($1, $2, $3,COALESCE($4,'contributor') ) RETURNING *",
    [name, email, hashPassword, role]
  );
  delete result.rows[0].password;
  return result;
};
var logInUser = async (payload) => {
  const { email, password } = payload;
  const userResult = await pool.query(
    `
    SELECT id,name,email,password,role,created_at,updated_at
    FROM users
    WHERE email=$1
    LIMIT 1
    `,
    [email]
  );
  const user = userResult.rows[0];
  if (!user) throw new apiError_default(400, "Invalid Credentials");
  const isPasswordMatched = await bcrypt.compare(password, user.password);
  if (!isPasswordMatched) throw new apiError_default(400, "Invalid Password!");
  if (!config_default.secret || !config_default.refresh_secret)
    throw new apiError_default(401, "JWT Secrets are missing!");
  const jwtPayload = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role
  };
  const accessToken = jwt.sign(jwtPayload, config_default.secret, {
    expiresIn: "1d"
  });
  const refreshToken2 = jwt.sign(jwtPayload, config_default.refresh_secret, {
    expiresIn: "15d"
  });
  return {
    accessToken,
    refreshToken: refreshToken2,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      created_at: user.created_at,
      updated_at: user.updated_at
    }
  };
};
var generateRefreshToken = async (token) => {
  if (!token) {
    throw new apiError_default(401, "No Token Exists!");
  }
  const decode = jwt.verify(
    token,
    config_default.refresh_secret
  );
  const userData = await pool.query(
    `
        SELECT * FROM users WHERE email =$1`,
    [decode.email]
  );
  const user = userData.rows[0];
  if (!user) throw new apiError_default(400, "User Not Found");
  if (!user?.is_active) throw new apiError_default(403, "Forbidden!");
  const jwtPayload = {
    id: user.id,
    name: user.name,
    is_active: user.is_active,
    email: user.email,
    role: user.role
  };
  const accessToken = jwt.sign(jwtPayload, config_default.secret, {
    expiresIn: "1d"
  });
  return { accessToken };
};
var authServices = {
  createUserIntoDB,
  logInUser,
  generateRefreshToken
};

// src/utils/sendResponse.ts
var sendResponse = (res, data) => {
  res.status(data.statusCode).json({
    success: data.success,
    message: data.message,
    ...data.data !== void 0 ? { data: data.data } : {},
    ...data.error !== void 0 ? { error: data.error } : {}
  });
};
var sendResponse_default = sendResponse;

// src/utils/asyncHandler.ts
var catchAsync = (fn) => {
  return (req, res, next) => {
    void Promise.resolve(fn(req, res, next)).catch(next);
  };
};
var asyncHandler_default = catchAsync;

// src/modules/auth/auth.controller.ts
var signUpUser = asyncHandler_default(async (req, res) => {
  const result = await authServices.createUserIntoDB(req.body);
  sendResponse_default(res, {
    statusCode: 201,
    success: true,
    message: "User Created successfully!",
    data: result.rows[0]
  });
});
var logInUser2 = asyncHandler_default(async (req, res) => {
  const result = await authServices.logInUser(req.body);
  const { accessToken, refreshToken: refreshToken2, user } = result;
  res.cookie("refreshToken", refreshToken2, {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax"
  });
  sendResponse_default(res, {
    statusCode: 200,
    success: true,
    message: "Log In Successful",
    data: {
      token: accessToken,
      user
    }
  });
});
var refreshToken = asyncHandler_default(async (req, res) => {
  const result = await authServices.generateRefreshToken(
    req.cookies.refreshToken
  );
  sendResponse_default(res, {
    statusCode: 200,
    success: true,
    message: "Access Token Generated",
    data: result
  });
});
var authController = {
  signUpUser,
  logInUser: logInUser2,
  refreshToken
};

// src/modules/auth/auth.route.ts
var router = Router();
router.post("/signup", authController.signUpUser);
router.post("/login", authController.logInUser);
router.post("/refresh-token", authController.refreshToken);
var authRoute = router;

// src/middleware/globalErrorHandler.ts
var globalErrorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === "production" ? err.message || "Something went wrong" : err.message || "Something went wrong";
  res.status(statusCode).json({
    success: false,
    message,
    error: {
      message
    }
  });
};
var globalErrorHandler_default = globalErrorHandler;

// src/modules/issues/issues.route.ts
import { Router as Router2 } from "express";

// src/modules/issues/issues.interface.ts
import "readline";
var IssueType = /* @__PURE__ */ ((IssueType2) => {
  IssueType2["bug"] = "bug";
  IssueType2["feature_request"] = "feature_request";
  return IssueType2;
})(IssueType || {});
var IssueStatus = /* @__PURE__ */ ((IssueStatus2) => {
  IssueStatus2["open"] = "open";
  IssueStatus2["in_progress"] = "in_progress";
  IssueStatus2["resolved"] = "resolved";
  return IssueStatus2;
})(IssueStatus || {});

// src/modules/issues/issues.service.ts
var createIssueIntoDB = async (payload, reporterId) => {
  const { title, description, type } = payload;
  if (!title || title.trim().length === 0)
    throw new apiError_default(401, "Title is Required");
  if (title.length > 150) {
    throw new apiError_default(400, "Title cannot exceed 150 characters");
  }
  if (!description || description.trim().length < 20) {
    throw new apiError_default(400, "Description must be at least 20 characters");
  }
  if (!Object.values(IssueType).includes(type)) {
    throw new apiError_default(400, "Type must be either bug or feature_request");
  }
  const issue = await pool.query(
    `
INSERT INTO issues (title,description,type,reporter_id)
VALUES ($1,$2,$3,$4)
RETURNING *
`,
    [title, description, type, reporterId]
  );
  return issue.rows[0];
};
var getAllIssuesFromDB = async (query) => {
  const { sort = "newest", type, status } = query;
  const conditions = [];
  const values = [];
  if (sort !== "newest" && sort !== "oldest")
    throw new apiError_default(409, "Sort must be either newest or oldest");
  if (type) {
    if (!Object.values(IssueType).includes(type)) {
      throw new apiError_default(409, "Type must be either bug or feature request");
    }
    values.push(type);
    conditions.push(`type = $${values.length}`);
  }
  if (status) {
    if (!Object.values(IssueStatus).includes(status)) {
      throw new apiError_default(409, "Status must be open, in progress, or resolved");
    }
    values.push(status);
    conditions.push(`status = $${values.length}`);
  }
  const orderDirection = sort === "oldest" ? "ASC" : "DESC";
  const whereQuery = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const issueResult = await pool.query(
    `
       SELECT id, title, description, type, status, reporter_id, created_at, updated_at FROM issues
       ${whereQuery}
       ORDER BY created_at  ${orderDirection}
        `,
    values
  );
  const issues = issueResult.rows;
  if (issues.length === 0) return [];
  const reporterIds = [...new Set(issues.map((issue) => issue.reporter_id))];
  const reporterResult = await pool.query(
    `
    SELECT id,name,role
    FROM users
    WHERE id = ANY($1::int[])
    `,
    [reporterIds]
  );
  const reporterMap = /* @__PURE__ */ new Map();
  reporterResult.rows.forEach((reporter) => {
    reporterMap.set(reporter.id, reporter);
  });
  const issuesWithReporter = issues.map((issue) => {
    const { reporter_id, ...issueData } = issue;
    return {
      ...issueData,
      reporter: reporterMap.get(reporter_id) || null
    };
  });
  return issuesWithReporter;
};
var UpdateIssueinDB = async (issueId, payload, user) => {
  const { title, description, type } = payload;
  if (!title && !description && !type) {
    throw new Error("At least one field is required to update");
  }
  if (title !== void 0 && title.trim().length === 0) {
    throw new apiError_default(400, "Title cannot be empty");
  }
  if (title !== void 0 && title.length > 150) {
    throw new apiError_default(400, "Title cannot exceed 150 characters");
  }
  if (description !== void 0 && description.trim().length < 20) {
    throw new apiError_default(400, "Description must be at least 20 characters");
  }
  if (type !== void 0 && !Object.values(IssueType).includes(type)) {
    throw new apiError_default(400, "Type must be either bug or feature_request");
  }
  const existingIssueResult = await pool.query(
    `
    SELECT * FROM issues
    WHERE id = $1
    LIMIT 1
    `,
    [issueId]
  );
  const existingIssues = existingIssueResult.rows[0];
  if (!existingIssues) throw new apiError_default(400, "Issues not found!");
  if (user.role === "contributor") {
    if (existingIssues.reporter_id != user.id)
      throw new apiError_default(409, "You can only update your own issue");
    if (existingIssues.status !== "open" /* open */)
      throw new apiError_default(409, "You can only update an open issue");
  }
  const updateResult = await pool.query(
    `
  UPDATE issues
  SET
  title = COALESCE ($1,title),
  description = COALESCE($2, description),
  type = COALESCE($3, type),
  updated_at = NOW()
  WHERE id=$4
  RETURNING *
`,
    [
      title ? title.trim() : null,
      description ? description.trim() : null,
      type || null,
      issueId
    ]
  );
  const updatedIssue = updateResult.rows[0];
  if (!updatedIssue) {
    throw new apiError_default(400, "Failed to update issue");
  }
  return updatedIssue;
};
var deleteIssueFromDB = async (issueId, user) => {
  const existingIssueResult = await pool.query(
    `
    SELECT * FROM issues
    WHERE id = $1
    LIMIT 1
    `,
    [issueId]
  );
  const existingIssues = existingIssueResult.rows[0];
  if (!existingIssues) throw new Error("Issues not found!");
  if (user.role === "contributor")
    throw new apiError_default(409, "You can not delete any issues");
  const result = await pool.query(
    `
     DELETE FROM issues WHERE id=$1 
    `,
    [issueId]
  );
  return result;
};
var issueService = {
  createIssueIntoDB,
  getAllIssuesFromDB,
  UpdateIssueinDB,
  deleteIssueFromDB
};

// src/modules/issues/issues.controller.ts
var createIssue = async (req, res) => {
  try {
    const reporterId = req.user?.id;
    if (!reporterId) {
      return sendResponse_default(res, {
        statusCode: 401,
        success: false,
        message: "Unauthorized Access",
        error: {
          message: "User Information is not found in token"
        }
      });
    }
    const result = await issueService.createIssueIntoDB(req.body, reporterId);
    sendResponse_default(res, {
      statusCode: 201,
      success: true,
      message: "Issue Created Successfully",
      data: result
    });
  } catch (error) {
    const errorMessagge = error instanceof Error ? error.message : "Something Went Wrong";
    sendResponse_default(res, {
      statusCode: 400,
      success: false,
      message: errorMessagge,
      error: {
        message: errorMessagge
      }
    });
  }
};
var getAllISues = asyncHandler_default(async (req, res) => {
  const result = await issueService.getAllIssuesFromDB(req.query);
  sendResponse_default(res, {
    statusCode: 200,
    success: true,
    message: "Issues Retrived Successfully",
    data: result
  });
  {
  }
});
var updateIssue = asyncHandler_default(async (req, res) => {
  const issueId = Number(req.params.id);
  if (!Number.isInteger(issueId)) {
    return sendResponse_default(res, {
      statusCode: 400,
      success: false,
      message: "Invalid Issue ID"
    });
  }
  if (!req.user) {
    return sendResponse_default(res, {
      statusCode: 401,
      success: false,
      message: "Unauthorized access"
    });
  }
  const result = await issueService.UpdateIssueinDB(
    issueId,
    req.body,
    req.user
  );
  sendResponse_default(res, {
    statusCode: 200,
    success: true,
    message: "Issue Updated Succesfully",
    data: result
  });
});
var deleteIssue = asyncHandler_default(async (req, res) => {
  const issueId = Number(req.params.id);
  if (!Number.isInteger(issueId)) {
    return sendResponse_default(res, {
      statusCode: 400,
      success: false,
      message: "Invalid Issue ID"
    });
  }
  if (!req.user) {
    return sendResponse_default(res, {
      statusCode: 401,
      success: false,
      message: "Unauthorized access"
    });
  }
  const result = await issueService.deleteIssueFromDB(issueId, req.user);
  sendResponse_default(res, {
    statusCode: 200,
    success: true,
    message: "Issue Deleted Succesfully"
  });
});
var issueController = {
  createIssue,
  getAllISues,
  updateIssue,
  deleteIssue
};

// src/middleware/auth.ts
import "express";
import jwt2 from "jsonwebtoken";
var auth = (...roles) => {
  return async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized Access"
        });
      }
      const token = authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : authHeader;
      if (!token) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized Token"
        });
      }
      if (!config_default.secret) {
        return res.status(500).json({
          success: false,
          message: "JWT secret is not configured"
        });
      }
      const decoded = jwt2.verify(
        token,
        config_default.secret
      );
      const userResult = await pool.query(
        `
        SELECT id,name,email,role
        FROM users
        WHERE id =$1
        LIMIT 1`,
        [decoded.id]
      );
      const user = userResult.rows[0];
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User Not Found"
        });
      }
      if (roles.length && !roles.includes(user.role)) {
        return res.status(403).json({
          success: false,
          message: "Forbidden, This role has no access"
        });
      }
      req.user = {
        id: decoded.id,
        name: decoded.name,
        role: decoded.role
      };
      next();
    } catch (error) {
      next(error);
    }
  };
};
var auth_default = auth;

// src/modules/issues/issues.route.ts
var router2 = Router2();
router2.post(
  "/",
  auth_default("contributor", "maintainer"),
  issueController.createIssue
);
router2.get("/", issueController.getAllISues);
router2.patch(
  "/:id",
  auth_default("contributor", "maintainer"),
  issueController.updateIssue
);
router2.delete("/:id", auth_default("maintainer"), issueController.deleteIssue);
var issueRoute = router2;

// src/App.ts
import cors from "cors";
var app = express();
var corsOptions = {
  origin: "http://localhost:3000",
  optionsSuccessStatus: 200
};
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors(corsOptions));
app.use("/api/auth", authRoute);
app.use("/api/issues", issueRoute);
app.get("/", (req, res) => {
  res.status(200).json({ message: "Welcome to Devpulse" });
});
app.use(globalErrorHandler_default);
var App_default = app;

// src/server.ts
console.log("It's in server.ts");
var main = async () => {
  console.log("Intializing Database");
  await initDB();
  App_default.listen(config_default.port, () => {
    console.log(`app is running on port ${config_default.port}`);
  });
};
main();
//# sourceMappingURL=server.js.map