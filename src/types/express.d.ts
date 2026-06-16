import type { JwtPayload } from "jsonwebtoken";

type TRole = "contributor" | "maintainer";

interface TDecodedUser extends JwtPayload {
  id: number;
  name: string;

  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: TDecodedUser;
    }
  }
}
