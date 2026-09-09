import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

export interface AuthenticatedRequest extends Request {
  userId?: string;
}

const secret = process.env.JWT_SECRET;

if (secret === undefined) {
  throw new Error("FATAL: JWT_SECRET environment variable is missing.");
}

const JWT_SECRET: string = secret;

export function generateToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { algorithm: "HS256" });
}

export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header) {
    return res.status(401).json({ error: "No token provided" });
  }

  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || token === undefined) {
    return res.status(401).json({ error: "Invalid authorization header" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ["HS256"] });

    if (typeof decoded === "string" || typeof decoded.userId !== "string") {
      return res.status(401).json({ error: "Invalid token" });
    }

    req.userId = decoded.userId;

    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
}