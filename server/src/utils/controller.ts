import { AppError } from "./appError";

export const getErrorResponse = (error: unknown, fallbackMessage: string) => {
    if (error instanceof AppError) {
        return {
            statusCode: error.statusCode,
            message: error.message,
            errors: error.details ?? null
        };
    }

    if (error instanceof Error) {
        return {
            statusCode: 500,
            message: error.message || fallbackMessage,
            errors: null
        };
    }

    return {
        statusCode: 500,
        message: fallbackMessage,
        errors: null
    };
};
