import type { JwtPayload } from "jsonwebtoken";
import type { TUserRole } from ".";

interface TDecodedUser extends JwtPayload {
  id: number;
  name: string;

  role: TUserRole;
}

declare global {
  namespace Express {
    interface Request {
      user?: TDecodedUser;
    }
  }
}
