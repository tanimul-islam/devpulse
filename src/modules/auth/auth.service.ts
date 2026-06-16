import { pool } from "../../db";
import type { IUser } from "../user/user.interface";

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { TJwtPayload, TUserRow } from "./auth.interface";
import config from "../../config";
const createUserIntoDB = async (payload: IUser) => {
  const { name, email, password, role } = payload;

  const hashPassword = await bcrypt.hash(password, 10);
  const result = await pool.query(
    "INSERT INTO users (name, email, password,role) VALUES ($1, $2, $3,COALESCE($4,'contributor') ) RETURNING *",
    [name, email, hashPassword, role],
  );

  delete result.rows[0].password;
  return result;
};

const logInUser = async (payload: IUser) => {
  const { email, password } = payload;

  const userResult = await pool.query<TUserRow>(
    `
    SELECT id,name,email,password,role,created_at,updated_at
    FROM users
    WHERE email=$1
    LIMIT 1
    `,
    [email],
  );

  const user = userResult.rows[0];

  if (!user) throw new Error("Invalid Credentials");

  const isPasswordMatched = await bcrypt.compare(password, user.password);

  if (!isPasswordMatched) throw new Error("Invalid Password!");

  if (!config.secret || !config.refresh_secret)
    throw new Error("JWT Secrets are missing!");

  const jwtPayload: TJwtPayload = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };

  const accessToken = jwt.sign(jwtPayload, config.secret, {
    expiresIn: "1d",
  });

  const refreshToken = jwt.sign(jwtPayload, config.refresh_secret, {
    expiresIn: "15d",
  });
  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      created_at: user.created_at,
      updated_at: user.updated_at,
    },
  };
};

export const authServices = {
  createUserIntoDB,
  logInUser,
};
