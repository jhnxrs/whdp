import type { NextFunction, Request, Response } from "express";

export class AppError extends Error {
    public readonly statusCode: number;
    public readonly isOperational: boolean;

    constructor(message: string, statusCode = 500, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        Object.setPrototypeOf(this, AppError.prototype);
    }
}

export class NotFoundError extends AppError {
    constructor(message = "Resource not found") {
        super(message, 404);
    }
}

export class BadRequestError extends AppError {
    constructor(message = "Bad request") {
        super(message, 400);
    }
}

export class UnauthorizedError extends AppError {
    constructor(message = "Unauthorized") {
        super(message, 401);
    }
}

export class ConflictError extends AppError {
    constructor(message = "Resource already exists") {
        super(message, 409);
    }
}

export const ErrorHandler = async (
    error: Error,
    _request: Request,
    response: Response,
    _next: NextFunction
) => {
    console.error("Error:", error);

    if (error instanceof AppError) {
        response.status(error.statusCode).json({
            success: false,
            error: {
                message: error.message,
                code: error.statusCode,
            },
        });
        return;
    }

    if (error.message.includes("not found")) {
        response.status(404).json({
            success: false,
            error: {
                message: error.message,
                code: 404,
            },
        });
        return;
    }

    if (error.message.includes("already exists")) {
        response.status(409).json({
            success: false,
            error: {
                message: error.message,
                code: 409,
            },
        });
        return;
    }

    response.status(500).json({
        success: false,
        error: {
            message: "Internal server error",
            code: 500,
        },
    });
}

export function asyncHandler<T>(
    fn: (req: Request, res: Response, next: NextFunction) => Promise<T>,
) {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}