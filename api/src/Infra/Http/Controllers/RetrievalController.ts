import type { Response } from "express";
import { AggregationPeriod, GetUserAggregatedViewsUseCase } from "src/Application/UseCases/Retrieval/GetUserAggregatedViewsUseCase";
import { GetUserHistoricalMetricsUseCase } from "src/Application/UseCases/Retrieval/GetUserHistoricalMetricsUseCase";
import { GetUserRecentMetricsUseCase } from "src/Application/UseCases/Retrieval/GetUserRecentMetricsUseCase";
import { TOKENS } from "src/Common/DI/Tokens";
import { AuthenticatedRequest } from "src/Infra/Http/Middleware/Authentication";
import { asyncHandler, BadRequestError } from "src/Infra/Http/Middleware/ErrorHandler";
import Container from "typedi";

export const GetUserRecentMetricsController = asyncHandler(
    async (request: AuthenticatedRequest, response: Response) => {
        const userId = request.userId!;

        const useCase = Container.get<GetUserRecentMetricsUseCase>(TOKENS.GetUserRecentMetricsUseCase);
        const useCaseResult = await useCase.execute({ userId });

        return response.status(200).json(useCaseResult);
    }
);

export const GetUserHistoricalMetricsController = asyncHandler(
    async (request: AuthenticatedRequest, response: Response) => {
        const userId = request.userId!;

        const metricCode = request.params.metricCode as string;
        const { startDate, endDate, limit } = request.query;

        if (!userId) {
            throw new BadRequestError("userId is required");
        }

        if (!metricCode) {
            throw new BadRequestError("metricCode is required");
        }

        if (!startDate || !endDate) {
            throw new BadRequestError("startDate and endDate are required");
        }

        const start = new Date(startDate as string);
        const end = new Date(endDate as string);

        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
            throw new BadRequestError("Invalid date format");
        }

        const useCase = Container.get<GetUserHistoricalMetricsUseCase>(TOKENS.GetUserHistoricalMetricsUseCase);
        const useCaseResult = await useCase.execute({
            userId,
            metricCode,
            startDate: start,
            endDate: end,
            limit: limit ? Number.parseInt(limit as string, 10) : undefined,
        });

        return response.status(200).json(useCaseResult);
    }
);

export const GetUserAggregatedViewsController = asyncHandler(
    async (request: AuthenticatedRequest, response: Response) => {
        const userId = request.userId!;

        const { startDate, endDate, streamId, period, rollingWindowDays } = request.query;

        if (!userId) {
            throw new BadRequestError("userId is required");
        }

        if (!startDate || !endDate || !period) {
            throw new BadRequestError("startDate, endDate and period are required");
        }

        if (!streamId) {
            throw new BadRequestError("streamId are required");
        }

        const start = new Date(startDate as string);
        const end = new Date(endDate as string);

        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
            throw new BadRequestError("Invalid date format");
        }

        const useCase = Container.get<GetUserAggregatedViewsUseCase>(TOKENS.GetUserAggregatedViewsUseCase);
        const useCaseResult = await useCase.execute({
            userId,
            streamId: streamId as string,
            endDate: end,
            startDate: start,
            period: period as AggregationPeriod,
            rollingWindowDays: (rollingWindowDays ? (+rollingWindowDays) : undefined) as number | undefined,
        });

        return response.status(200).json(useCaseResult);
    }
);