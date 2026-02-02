import DataStreamDailyRollup from "src/Domain/Entities/DataStreamDailyRollup/Entity";
import { IMetric } from "src/Domain/Entities/Metric/Contract";

export namespace IDataStreamDailyRollup {
    export type CompositeStats = Record<
        string,
        {
            count: number;
            sum?: number;
            min?: number;
            max?: number;
            latest?: number;
        }
    >;

    export type DataStreamDailyRollupStats = {
        count: number;
        sum?: number;
        min?: number;
        max?: number;
        latest?: number;
        latestAt?: Date;
        composite?: CompositeStats;
    };

    export type Database = {
        streamId: string;
        userId: string;
        deviceId: string;
        manufacturerId: string;
        metricCode: IMetric.MetricCode;

        day: string;
        dataType: IMetric.MetricDataType;
        unit: IMetric.MetricUnit;
        stats: DataStreamDailyRollupStats;

        firstObservedAt: Date | null;
        lastObservedAt: Date | null;
        lastReceivedAt: Date | null;

        updatedAt: Date;
        createdAt: Date;
    };

    export type Domain = Database;

    export type Create = Omit<Domain, 'createdAt' | 'updatedAt'>;

    export type Update = Pick<
        Domain,
        'stats' |
        'lastObservedAt' |
        'lastReceivedAt'
    >;

    export interface Repository<Transaction = unknown> {
        findOne: (streamId: string, day: string) => Promise<DataStreamDailyRollup | null>;
        create: (dataStreamDailyRollup: DataStreamDailyRollup, transaction?: Transaction) => Promise<void>;
        update: (dataStreamDailyRollup: DataStreamDailyRollup, transaction?: Transaction) => Promise<void>;
        findManyByStreamIdsAndDays: (streamIds: string[], days: string[]) => Promise<DataStreamDailyRollup[]>;
        findManyByStreamIdAndDays: (
            streamId: string,
            days: string[],
        ) => Promise<DataStreamDailyRollup[]>;
    }
}