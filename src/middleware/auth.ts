import { type NextFunction, type Request, type Response } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import config from "../config";
import { pool } from "../db";
import type { TDecodedUser, TRole } from "../types/express";
const auth = (...roles: TRole[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader) {
        res.status(401).json({
          success: false,
          message: "Unauthorized Access",
        });
      }
      const token = authHeader?.startsWith("Bearer ")
        ? authHeader.split(" ")[1]
        : authHeader;

      if (!token) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized Access",
        });
      }

      if (!config.secret) {
        return res.status(500).json({
          success: false,
          message: "JWT secret is not configured",
        });
      }

      const decoded = jwt.verify(
        token as string,
        config.secret,
      ) as TDecodedUser;

      const userResult = await pool.query(
        `
        SELECT id,name,email,role
        FROM users
        WHERE email =$1
        LIMIT 1`,
        [decoded.id],
      );
      const user = userResult.rows[0];

      if (!user) {
        res.status(404).json({
          success: false,
          message: "User Not Found",
        });
      }

      if (roles.length && !roles.includes(user.role)) {
        res.status(403).json({
          success: false,
          message: "Forbidden, This role has no access",
        });
      }

      req.user = {
        id: decoded.id,
        name: decoded.name,
        role: decoded.role,
      };

      next();
    } catch (error) {
      next(error);
    }
  };
};

export default auth;
