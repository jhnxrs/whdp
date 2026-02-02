import type { Response } from "express";
import { AssignDeviceToUserUseCase } from "src/Application/UseCases/Devices/AssignDeviceToUserUseCase";
import { CreateDeviceUseCase } from "src/Application/UseCases/Devices/CreateDeviceUseCase";
import { GetAssignmentHistoryUseCase } from "src/Application/UseCases/Devices/GetAssignmentHistoryUseCase";
import { GetUserDevicesUseCase } from "src/Application/UseCases/Devices/GetUserDevicesUseCase";
import { UnassignDeviceUseCase } from "src/Application/UseCases/Devices/UnassignDeviceUseCase";
import { TOKENS } from "src/Common/DI/Tokens";
import { AuthenticatedRequest } from "src/Infra/Http/Middleware/Authentication";
import { asyncHandler } from "src/Infra/Http/Middleware/ErrorHandler";
import Container from "typedi";
import { z } from 'zod';

const AssignDeviceToUserSchema = z.object({
    reason: z.string().optional(),
});

const UnassignDeviceToUserSchema = z.object({
    reason: z.string().optional(),
});

const CreateDeviceSchema = z.object({
    manufacturerId: z.string(),
    type: z.string(),
    model: z.string().optional(),
    externalId: z.string().optional(),
});

export const AssignDeviceToUserController = asyncHandler(
    async (request: AuthenticatedRequest, response: Response) => {
        const userId = request.userId!;
        const deviceId = request.params.deviceId as string;

        if (!deviceId) {
            return response.status(400).json({
                error: "Invalid request body",
                details: "Device ID not specified",
            });
        }

        const result = AssignDeviceToUserSchema.safeParse(request.body);

        if (!result.success) {
            return response.status(400).json({
                error: "Invalid request body",
                details: z.treeifyError(result.error),
            });
        }

        const useCase = Container.get<AssignDeviceToUserUseCase>(TOKENS.AssignDeviceToUserUseCase);
        const useCaseResult = await useCase.execute({
            ...result.data,
            deviceId,
            userId
        });

        return response.status(200).json(useCaseResult);
    }
);

export const UnassignDeviceToUserController = asyncHandler(
    async (request: AuthenticatedRequest, response: Response) => {
        const userId = request.userId!;
        const deviceId = request.params.deviceId as string;

        const result = UnassignDeviceToUserSchema.safeParse(request.body);

        if (!deviceId) {
            return response.status(400).json({
                error: "Invalid request body",
                details: "Device ID not specified",
            });
        }

        if (!result.success) {
            return response.status(400).json({
                error: "Invalid request body",
                details: z.treeifyError(result.error),
            });
        }

        const useCase = Container.get<UnassignDeviceUseCase>(TOKENS.UnassignDeviceUseCase);
        const useCaseResult = await useCase.execute({
            ...result.data,
            deviceId,
            userId
        });

        return response.status(200).json(useCaseResult);
    }
);

export const CreateDeviceController = asyncHandler(
    async (request: AuthenticatedRequest, response: Response) => {
        const result = CreateDeviceSchema.safeParse(request.body);

        if (!result.success) {
            return response.status(400).json({
                error: "Invalid request body",
                details: z.treeifyError(result.error),
            });
        }

        const useCase = Container.get<CreateDeviceUseCase>(TOKENS.CreateDeviceUseCase);
        const useCaseResult = await useCase.execute({
            ...result.data,
            externalId: result.data.externalId || null,
            model: result.data.model || null,
        });

        return response.status(201).json(useCaseResult);
    }
);

export const GetAssignmentHistoryController = asyncHandler(
    async (request: AuthenticatedRequest, response: Response) => {
        const userId = request.userId!;
        const deviceId = request.params.deviceId as string;

        if (!deviceId) {
            return response.status(400).json({
                error: "Invalid request body",
                details: "Device ID not specified",
            });
        }

        const useCase = Container.get<GetAssignmentHistoryUseCase>(TOKENS.GetAssignmentHistoryUseCase);
        const useCaseResult = await useCase.execute({
            deviceId,
            userId
        });

        return response.status(200).json(useCaseResult);
    }
);

export const GetUserDevicesController = asyncHandler(
    async (request: AuthenticatedRequest, response: Response) => {
        const userId = request.userId!;

        const useCase = Container.get<GetUserDevicesUseCase>(TOKENS.GetUserDevicesUseCase);
        const useCaseResult = await useCase.execute({ userId });

        return response.status(200).json(useCaseResult);
    }
);