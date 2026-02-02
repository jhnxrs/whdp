import DataStream from "src/Domain/Entities/DataStream/Entity";
import { IMetric } from "src/Domain/Entities/Metric/Contract";

export namespace IDataStream {
    export enum DataStreamStatus {
        Active = 'active',
        Closed = 'closed'
    };

    export type DataStreamType =
        | "continuous"
        | "periodic"
        | "daily_summary"
        | "on_demand"
        | (string & {});

    export type Database = {
        userId: string;
        deviceId: string;
        manufacturerId: string;
        metricCode: IMetric.MetricCode;

        type: DataStreamType;
        status: DataStreamStatus;

        startedAt: Date;
        endedAt: Date | null;
        lastObservationAt: Date | null;

        observationCount: number;

        createdAt: Date;
        updatedAt: Date;
    };

    export type Domain = Database;

    export type Create = Omit<Domain, 'createdAt' | 'updatedAt'>;

    export type Update = Pick<Domain, 'observationCount' | 'lastObservationAt'>;

    export interface Repository<Transaction = unknown> {
        findById: (id: string) => Promise<DataStream | null>;
        findRecentByUserId: (userId: string, limit: number) => Promise<DataStream[]>;
        createBatch(dataStreams: DataStream[], transaction?: Transaction): Promise<void>;
    }
}