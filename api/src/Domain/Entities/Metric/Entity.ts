import { BaseEntity } from "src/Domain/BaseEntity";
import { IMetric } from "src/Domain/Entities/Metric/Contract";

export default class Metric extends BaseEntity<IMetric.Domain> {
    private constructor(props: IMetric.Domain, id: string) {
        super(props, id);
    }

    public static create(props: IMetric.Create, id: string): Metric {
        return new Metric(
            {
                ...props,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            id
        );
    }

    public static restore(props: IMetric.Database, id: string): Metric {
        return new Metric(props, id);
    }

    toPersist() {
        return {
            ...this.props,
        }
    }

    get metricCode(): IMetric.MetricCode {
        return this.props.metricCode;
    }

    get canonicalUnit(): IMetric.MetricUnit {
        return this.props.canonicalUnit;
    }

    get dataType(): IMetric.MetricDataType {
        return this.props.dataType;
    }
}