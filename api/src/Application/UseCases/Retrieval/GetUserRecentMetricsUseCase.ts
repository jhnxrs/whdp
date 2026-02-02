import { BaseUseCase } from "src/Application/BaseUseCase";
import DataStream from "src/Domain/Entities/DataStream/Entity";
import { IDataStreamDailyRollup } from "src/Domain/Entities/DataStreamDailyRollup/Contract";
import DataStreamDailyRollup from "src/Domain/Entities/DataStreamDailyRollup/Entity";
import { IMetric } from "src/Domain/Entities/Metric/Contract";
import { IObservation } from "src/Domain/Entities/Observation/Contract";
import { DataStreamDailyRollupRepository } from "src/Infra/Database/Repositories/DataStreamDailyRollupRepository";
import { DataStreamRepository } from "src/Infra/Database/Repositories/DataStreamRepository";

type Input = {
    userId: string;
    limit?: number;
}

type StreamMetricSummary = {
    streamId: string;
    metricCode: string;
    manufacturerId: string;
    deviceId: string;

    latest?: {
        value: IObservation.ObservationValue;
        unit: IMetric.MetricUnit;
        observedAt: string;
    };

    window: {
        fromDay: string;
        toDay: string;
        count: number;
        sum?: number;
        min?: number;
        max?: number;
        latest?: number;
        latestAt?: string;
        composite?: IDataStreamDailyRollup.CompositeStats;
    };
};

type Output = {
    summaries: StreamMetricSummary[];
};

export class GetUserRecentMetricsUseCase implements BaseUseCase<Input, Output> {
    constructor(
        private readonly dataStreamRepository: DataStreamRepository,
        private readonly dataStreamDailyRollupRepository: DataStreamDailyRollupRepository,
    ) { }

    private toYYYYMMDD(d: Date): string {
        const y = d.getUTCFullYear();
        const m = String(d.getUTCMonth() + 1).padStart(2, "0");
        const day = String(d.getUTCDate()).padStart(2, "0");
        return `${y}-${m}-${day}`;
    }

    private buildRecentDays(days: number): string[] {
        /**
         * normalize to UTC
         */
        const out: string[] = [];
        const now = new Date();
        const utc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
        for (let i = 0; i < days; i++) {
            const d = new Date(utc);
            d.setUTCDate(d.getUTCDate() - i);
            out.push(this.toYYYYMMDD(d));
        }
        return out;
    }

    private summarizeStream(
        stream: DataStream,
        rollups: DataStreamDailyRollup[],
        daysList: string[]
    ): StreamMetricSummary {
        // aggregate window stats
        let count = 0;
        let sum: number | undefined = undefined;
        let min: number | undefined = undefined;
        let max: number | undefined = undefined;
        let latest: number | undefined = undefined;
        let latestAt: Date | undefined = undefined;

        // composite aggregation: merge per-key stats
        const composite: IDataStreamDailyRollup.CompositeStats = {};

        for (const r of rollups) {
            const s = r.stats;

            count += s.count ?? 0;

            if (typeof s.sum === "number") sum = (sum ?? 0) + s.sum;

            if (typeof s.min === "number") min = min === undefined ? s.min : Math.min(min, s.min);
            if (typeof s.max === "number") max = max === undefined ? s.max : Math.max(max, s.max);

            if (typeof s.latest === "number" && s.latestAt) {
                if (!latestAt || s.latestAt > latestAt) {
                    latestAt = s.latestAt;
                    latest = s.latest;
                }
            }

            if (s.composite) {
                for (const [key, val] of Object.entries(s.composite)) {
                    const cur = composite[key] ?? { count: 0 };
                    cur.count += val.count;

                    if (typeof val.sum === "number") cur.sum = (cur.sum ?? 0) + val.sum;
                    if (typeof val.min === "number") cur.min = cur.min === undefined ? val.min : Math.min(cur.min, val.min);
                    if (typeof val.max === "number") cur.max = cur.max === undefined ? val.max : Math.max(cur.max, val.max);

                    if (typeof val.latest === "number") {
                        // you don't store per-key latestAt, so this is "best effort"
                        cur.latest = val.latest;
                    }

                    composite[key] = cur;
                }
            }
        }

        const fromDay = daysList[daysList.length - 1]!;
        const toDay = daysList[0]!;

        const latestBlock =
            latestAt && latest !== undefined
                ? {
                    value: { numeric: latest } as IObservation.ObservationValue,
                    unit: rollups[0]?.unit,
                    observedAt: latestAt.toISOString(),
                }
                : undefined;

        return {
            streamId: stream.id,
            metricCode: stream.metricCode,
            manufacturerId: stream.manufacturerId,
            deviceId: stream.deviceId,
            latest: latestBlock,
            window: {
                fromDay,
                toDay,
                count,
                sum,
                min,
                max,
                latest,
                latestAt: latestAt?.toISOString(),
                composite: Object.keys(composite).length ? composite : undefined,
            },
        };
    }

    async execute(input: Input): Promise<Output> {
        const { userId, limit } = input;

        const streams = await this.dataStreamRepository.findRecentByUserId(userId, limit || 20);
        const streamIds = streams.map((s) => s.id);

        if (streamIds.length === 0) {
            return { summaries: [] };
        }

        const days = this.buildRecentDays(3); // utc strings
        const rollups = await this.dataStreamDailyRollupRepository.findManyByStreamIdsAndDays(streamIds, days);

        const rollupsByStream = new Map<string, DataStreamDailyRollup[]>();
        for (const r of rollups) {
            const arr = rollupsByStream.get(r.streamId) ?? [];
            arr.push(r);
            rollupsByStream.set(r.streamId, arr);
        }

        const summaries: StreamMetricSummary[] = streams.map((stream) => {
            const streamRollups = rollupsByStream.get(stream.id) ?? [];
            return this.summarizeStream(stream, streamRollups, days);
        });

        return { summaries };
    }
}