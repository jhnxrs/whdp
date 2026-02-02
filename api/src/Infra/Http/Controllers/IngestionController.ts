import type { Response } from "express";
import { IngestDataUseCase } from "src/Application/UseCases/Ingestion/IngestDataUseCase";
import { TOKENS } from "src/Common/DI/Tokens";
import { AuthenticatedRequest } from "src/Infra/Http/Middleware/Authentication";
import { asyncHandler } from "src/Infra/Http/Middleware/ErrorHandler";
import Container from "typedi";
import { z } from 'zod';

const IngestDataControllerSchema = z.object({
    deviceId: z.string(),
    manufacturerId: z.string(),
    payloadFormat: z.string(),
    payload: z.union([
        z.record(z.string(), z.unknown()),
        z.array(z.record(z.string(), z.unknown()))
    ])
})

export const IngestDataController = asyncHandler(
    async (request: AuthenticatedRequest, response: Response) => {
        const userId = request.userId!;

        const result = IngestDataControllerSchema.safeParse(request.body);

        if (!result.success) {
            return response.status(400).json({
                error: "Invalid request body",
                details: z.treeifyError(result.error),
            });
        }

        const useCase = Container.get<IngestDataUseCase>(TOKENS.IngestDataUseCase);
        const useCaseResult = await useCase.execute({
            ...result.data,
            userId
        });

        return response.status(201).json(useCaseResult);
    }
);