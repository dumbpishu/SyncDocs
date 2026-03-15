import { ZodTypeAny } from "zod";
import { Request, Response, NextFunction } from "express";
import { sendErrorResponse } from "../utils/apiResponse";

export const validateRequest = (schema: ZodTypeAny) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const result = schema.safeParse(req.body);

        if (!result.success) {
            return sendErrorResponse(res, {
                statusCode: 400,
                message: "Validation error",
                errors: result.error.flatten()
            });
        }

        req.body = result.data;
        next();
    };
};
