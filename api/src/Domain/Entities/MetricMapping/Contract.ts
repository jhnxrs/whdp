import { IMetric } from "src/Domain/Entities/Metric/Contract";
import MetricMapping from "src/Domain/Entities/MetricMapping/Entity";

export namespace IMetricMapping {
    export type Database = {
        manufacturerId: string; // "apple_health"
        payloadFormat: string; // "healthkit_v1" or "dexcom-egv-samples"
        metricCode: IMetric.MetricCode; // "heart_rate"
        externalCode: string; // "HKQuantityTypeIdentifierHeartRate"
        externalUnit?: string; // "bpm"
        createdAt: Date;
        updatedAt: Date;
    };

    export type Domain = Database;

    export type Create = Omit<Domain, 'createdAt' | 'updatedAt'>;

    export interface Repository<Transaction = unknown> {
        findById: (id: string) => Promise<MetricMapping | null>;
        create: (metricMapping: MetricMapping, transaction?: Transaction) => Promise<void>;
        update: (metricMapping: MetricMapping, transaction?: Transaction) => Promise<void>;
    }
}