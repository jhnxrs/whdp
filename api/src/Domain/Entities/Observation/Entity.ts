import crypto from 'node:crypto';
import { BaseEntity } from "src/Domain/BaseEntity";
import { IMetric } from "src/Domain/Entities/Metric/Contract";
import { IObservation } from "src/Domain/Entities/Observation/Contract";

export default class Observation extends BaseEntity<IObservation.Domain> {
    private constructor(props: IObservation.Domain, id: string) {
        super(props, id);
    }

    public static create(props: IObservation.Create, id: string): Observation {
        return new Observation(
            {
                ...props,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            id
        );
    }

    public static restore(props: IObservation.Database, id: string): Observation {
        return new Observation(props, id);
    }

    toPersist() {
        return {
            ...this.props,
        }
    }

    public static generateHash(props: {
        userId: string;
        metricCode: IMetric.MetricCode;
        observedAt: Date;
        value: IObservation.ObservationValue;
    }): string {
        const content = JSON.stringify({
            userId: props.userId,
            metricCode: props.metricCode,
            observedAt: Math.floor(props.observedAt.getTime() / 1000),
            value: props.value,
        });

        return crypto
            .createHash("sha256")
            .update(content)
            .digest("hex")
            .slice(0, 16);
    }

    get receivedAt(): Date {
        return this.props.receivedAt;
    }

    get hash(): string {
        return this.props.hash;
    }

    get observedAt(): Date {
        return this.props.observedAt;
    }

    get streamId(): string {
        return this.props.streamId;
    }

    get value(): IObservation.ObservationValue {
        return this.props.value;
    }

    public getNumericValue(): number | undefined {
        return (
            this.props.value.numeric ??
            this.props.value.count ??
            this.props.value.duration
        );
    }
}