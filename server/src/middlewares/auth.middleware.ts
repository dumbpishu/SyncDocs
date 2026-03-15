import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model";
import { sendErrorResponse } from "../utils/apiResponse";

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = req.cookies?.accessToken || req.headers.authorization?.split(" ")[1];

        if (!token) {
            return sendErrorResponse(res, {
                statusCode: 401,
                message: "Unauthorized"
            });
        }

        const decoded: any = jwt.verify(token, process.env.JWT_ACCESS_SECRET!);

        const user = await User.findById(decoded?.id);

        if (!user) {
            return sendErrorResponse(res, {
                statusCode: 401,
                message: "Unauthorized"
            });
        }

        req.user = {
            _id: user._id.toString(),
            email: typeof user.email === "string" ? user.email : undefined,
            username: user.username
        };

        next();
    } catch (error) {
        return sendErrorResponse(res, {
            statusCode: 401,
            message: "Unauthorized"
        });
    }
};
