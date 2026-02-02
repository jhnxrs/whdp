import type { NextFunction, Request, Response } from "express";
import { Auth } from "src/Infra/Firebase/Connection";
import { UnauthorizedError } from "src/Infra/Http/Middleware/ErrorHandler";

export interface AuthenticatedRequest extends Request {
    userId?: string;
    userEmail?: string;
}

export const AuthenticationMiddleware = async (
    request: AuthenticatedRequest,
    _response: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const authHeader = request.headers.authorization;

        // dev mode: accepts x-user-id header for testing
        const devUserId = request.headers["x-user-id"] as string | undefined;
        if (devUserId && process.env.NODE_ENV !== "production") {
            request.userId = devUserId;
            return next();
        }

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            throw new UnauthorizedError("Missing or invalid authorization header");
        }

        const idToken = authHeader.split("Bearer ")[1];
        const decodedToken = await Auth.verifyIdToken(idToken);

        request.userId = decodedToken.uid;
        request.userEmail = decodedToken.email;

        next();
    } catch (error) {
        if (error instanceof UnauthorizedError) {
            next(error);
            return;
        }

        next(new UnauthorizedError("Invalid authentication token"));
    }
}