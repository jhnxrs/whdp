import { BaseEntity } from "src/Domain/BaseEntity";
import { IDataStream } from "src/Domain/Entities/DataStream/Contract";
import { IMetric } from "src/Domain/Entities/Metric/Contract";

export default class DataStream extends BaseEntity<IDataStream.Domain> {
    private constructor(props: IDataStream.Domain, id: string) {
        super(props, id);
    }

    public static create(props: IDataStream.Create, id: string): DataStream {
        return new DataStream(
            {
                ...props,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            id
        );
    }

    public static restore(props: IDataStream.Database, id: string): DataStream {
        return new DataStream(props, id);
    }

    update(props: IDataStream.Update): DataStream {
        const payload = {
            ...this.props,
            ...props
        }

        return new DataStream(payload, this.id);
    }

    toPersist() {
        return {
            ...this.props,
        }
    }

    public static generateId(
        userId: string,
        deviceId: string,
        metricCode: IMetric.MetricCode,
    ): string {
        return `${userId}_${deviceId}_${metricCode}`;
    }

    get lastObservationAt(): Date | null {
        return this.props.lastObservationAt;
    }

    get observationsCount(): number {
        return this.props.observationCount;
    }

    get metricCode(): IMetric.MetricCode {
        return this.props.metricCode;
    }

    get manufacturerId(): string {
        return this.props.manufacturerId;
    }

    get deviceId(): string {
        return this.props.deviceId;
    }

    get userId(): string {
        return this.props.userId;
    }
}