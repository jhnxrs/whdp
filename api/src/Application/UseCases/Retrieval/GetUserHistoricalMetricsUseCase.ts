import { BaseUseCase } from "src/Application/BaseUseCase";
import { IMetric } from "src/Domain/Entities/Metric/Contract";
import { IObservation } from "src/Domain/Entities/Observation/Contract";
import { ObservationRepository } from "src/Infra/Database/Repositories/ObservationRepository";

type Input = {
    userId: string;
    metricCode: IMetric.MetricCode;
    startDate: Date;
    endDate: Date;
    limit?: number;
};

type Output = {
    timeRange: {
        start: string;
        end: string;
    };
    observations: IObservation.Database[];
    statistics: {
        count: number;
        min?: number;
        max?: number;
        avg?: number;
        first?: number;
        last?: number;
    };
};

/**
 * for a real production app, we would query the observations probably by streamId
 * rather than (userId, deviceId), but for this take-home test, it should be enough
 */

export class GetUserHistoricalMetricsUseCase implements BaseUseCase<Input, Output> {
    constructor(
        private readonly observationRepository: ObservationRepository,
    ) { }

    async execute(input: Input): Promise<Output> {
        const { userId, metricCode, startDate, endDate, limit = 1000 } = input;

        if (startDate > endDate) {
            throw new Error("Start date must be before end date");
        }

        const observations = await this.observationRepository.findByUserAndMetric(
            userId,
            metricCode,
            {
                startAfter: startDate,
                endBefore: endDate,
                limit,
            },
        );

        const values = observations
            .map((obs) => obs.getNumericValue())
            .filter((v): v is number => v !== undefined);

        const statistics: Output["statistics"] = {
            count: observations.length,
        };

        if (values.length > 0) {
            statistics.min = Math.min(...values);
            statistics.max = Math.max(...values);
            statistics.avg = values.reduce((a, b) => a + b, 0) / values.length;
            statistics.first = values[values.length - 1]; // Oldest
            statistics.last = values[0]; // Most recent
        }

        return {
            timeRange: {
                start: startDate.toISOString(),
                end: endDate.toISOString(),
            },
            observations: observations.map(e => e.toPersist()),
            statistics,
        };
    }
}