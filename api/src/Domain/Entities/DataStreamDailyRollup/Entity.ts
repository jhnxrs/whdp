import { BaseEntity } from "src/Domain/BaseEntity";
import { IDataStreamDailyRollup } from "src/Domain/Entities/DataStreamDailyRollup/Contract";
import { IMetric } from "src/Domain/Entities/Metric/Contract";

export default class DataStreamDailyRollup extends BaseEntity<IDataStreamDailyRollup.Domain> {
    private constructor(props: IDataStreamDailyRollup.Domain, id: string) {
        super(props, id);
    }

    public static create(props: IDataStreamDailyRollup.Create, id: string): DataStreamDailyRollup {
        return new DataStreamDailyRollup(
            {
                ...props,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            id
        );
    }

    public static restore(props: IDataStreamDailyRollup.Database, id: string): DataStreamDailyRollup {
        return new DataStreamDailyRollup(props, id);
    }

    update(props: IDataStreamDailyRollup.Update): DataStreamDailyRollup {
        const payload = {
            ...this.props,
            ...props
        }

        return new DataStreamDailyRollup(payload, this.id);
    }

    toPersist() {
        return {
            ...this.props,
        }
    }

    get streamId(): string {
        return this.props.streamId;
    }

    get day(): string {
        return this.props.day;
    }

    get stats(): IDataStreamDailyRollup.DataStreamDailyRollupStats {
        return this.props.stats;
    }

    get lastObservedAt(): Date | null {
        return this.props.lastObservedAt;
    }

    get lastReceivedAt(): Date | null {
        return this.props.lastReceivedAt;
    }

    get unit(): IMetric.MetricUnit {
        return this.props.unit;
    }
}