import { IMetric } from "src/Domain/Entities/Metric/Contract";
import Observation from "src/Domain/Entities/Observation/Entity";

export namespace IObservation {
    export type ObservationSource =
        | "device"
        | "manual"
        | (string & {});

    export type ObservationValue = {
        numeric?: number;
        duration?: number; // in seconds
        count?: number;
        composite?: Record<string, number>;
    }

    export type Database = {
        userId: string;
        deviceId: string;
        streamId: string;
        manufacturerId: string;
        metricCode: IMetric.MetricCode;

        observedAt: Date;
        receivedAt: Date;

        value: ObservationValue;
        unit: IMetric.MetricUnit;
        source: ObservationSource;

        createdAt: Date;
        updatedAt: Date;

        // deduplication
        hash: string;
    }

    export type Domain = Database;

    export type Create = Omit<Domain, 'createdAt' | 'updatedAt'>;

    export interface Repository<Transaction = unknown> {
        createBatch(
            streamId: string,
            observations: Observation[],
            transaction?: Transaction
        ): Promise<{ duplicates: string[]; }>;

        findByUserAndMetric(
            userId: string,
            metricCode: string,
            options?: {
                limit?: number;
                startAfter?: Date;
                endBefore?: Date;
            },
        ): Promise<Observation[]>;

        findByStreamAndRange(
            streamId: string,
            start: Date,
            end: Date,
        ): Promise<Observation[]>;
    }
}