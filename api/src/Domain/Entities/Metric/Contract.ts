import Metric from "src/Domain/Entities/Metric/Entity";

export namespace IMetric {
    export type MetricCode =
        | "glucose"
        | "heart_rate"
        | "sleep_duration"
        | (string & {});

    export type MetricDataType =
        | "numeric"
        | "count"
        | "duration"
        | "composite"
        | (string & {});

    export type MetricAggregationMethod =
        | "average"
        | "sum"
        | "min"
        | "max"
        | "latest"
        | "count"
        | (string & {});

    export type MetricFrequency =
        | { kind: "continuous" }
        | { kind: "periodic"; intervalSeconds: number }
        | { kind: "daily_summary" };

    export type MetricUnit = {
        code: string; // e.g. "mg/dL", "mmol/L", "bpm", "s"
    };

    export type MetricReferenceRange = {
        low?: number;
        high?: number;
        conditions?: Record<string, string>; // { "state": "fasting", "population": "adult" }
        unit: MetricUnit;
    };

    export type Database = {
        metricCode: MetricCode; // "glucose"
        displayName: string; // "Blood Glucose"
        dataType: MetricDataType; // numeric
        canonicalUnit: MetricUnit; // { code: "mg/dL" }
        referenceRanges: MetricReferenceRange[]; // [{ low: 70, high: 99, unit: { code: "mg/dL" } }]
        aggregationMethods: MetricAggregationMethod[]; // ["average", "min", "max", "latest"]
        typicalFrequency: MetricFrequency; // { kind: "continuous" }
        createdAt: Date;
        updatedAt: Date;
    };

    export type Domain = Database;

    export type Create = Omit<Domain, 'createdAt' | 'updatedAt'>;

    export interface Repository<Transaction = unknown> {
        findByMetricCode: (metricCode: IMetric.MetricCode) => Promise<Metric | null>;
        create: (metric: Metric, transaction?: Transaction) => Promise<void>;
    };
}