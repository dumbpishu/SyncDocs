import { Response } from "express";

type SuccessOptions<T> = {
    statusCode?: number;
    message: string;
    data?: T;
    meta?: Record<string, unknown>;
};

type ErrorOptions = {
    statusCode: number;
    message: string;
    errors?: unknown;
};

export const sendSuccessResponse = <T>(res: Response, options: SuccessOptions<T>) => {
    const { statusCode = 200, message, data, meta } = options;

    return res.status(statusCode).json({
        success: true,
        message,
        data: data ?? null,
        meta: meta ?? null
    });
};

export const sendErrorResponse = (res: Response, options: ErrorOptions) => {
    const { statusCode, message, errors } = options;

    return res.status(statusCode).json({
        success: false,
        message,
        errors: errors ?? null
    });
};
