import jwt, {JwtPayload} from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";


export interface AuthenticatedRequest extends Request {
  userId?: string;
  userRole?: string;
}




const JWT_SECRET: string | undefined = process.env.JWT_SECRET;

if (JWT_SECRET === undefined) {
  throw new Error("FATAL: JWT_SECRET environment variable is missing.");
}

// Generate a token for a user with a 1-hour expiration
export function generateToken(userId: string, role: string): string {
  if (JWT_SECRET === undefined) {
    throw new Error("JWT secret is not configured.");
  }
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: "1h", algorithm: "HS256" });
}

export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const header:string|undefined = req.headers.authorization;

  if (!header) {
    return res.status(401).json({ error: "No token provided" });
  }

  const [scheme, token]: string[] = header.split(" ");

  if (scheme !== "Bearer" || token === undefined) {
    return res.status(401).json({
      error: "Invalid authorization header",
    });
  }


  if (JWT_SECRET === undefined) {
    throw new Error("JWT secret is not configured.");
  }

  try {
    const decoded: string | JwtPayload = jwt.verify(token, JWT_SECRET, { algorithms: ["HS256"] });

    if (typeof decoded === "string") {
      return res.status(401).json({ error: "Invalid token" });
    }

    if (
        typeof decoded.userId !== "string" ||
        typeof decoded.role !== "string"
    ) {
      return res.status(401).json({ error: "Invalid token payload" });
    }


    req.userId = decoded.userId;
    req.userRole = decoded.role;

    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
}
