import { Request, Response, NextFunction, RequestHandler } from "express";
import { ZodType } from "zod";

export interface ValidatedRequest<TBody> extends Request {
    body: TBody;
}

export function validateBody<TBody>(schema: ZodType<TBody>): RequestHandler {
    return (req: Request, res: Response, next: NextFunction) => {
        const result = schema.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({
                error: "Requête invalide",
                details: result.error.issues.map((issue) => ({
                    field: issue.path.join("."),
                    message: issue.message,
                })),
            });
        }

        req.body = result.data;
        next();
    };
}