import { BaseEntity } from "src/Domain/BaseEntity";
import { IMetric } from "src/Domain/Entities/Metric/Contract";
import { IMetricMapping } from "src/Domain/Entities/MetricMapping/Contract";

export default class MetricMapping extends BaseEntity<IMetricMapping.Domain> {
    private constructor(props: IMetricMapping.Domain, id: string) {
        super(props, id);
    }

    public static create(props: IMetricMapping.Create, id: string): MetricMapping {
        return new MetricMapping(
            {
                ...props,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            id
        );
    }

    public static restore(props: IMetricMapping.Database, id: string): MetricMapping {
        return new MetricMapping(props, id);
    }

    toPersist() {
        return {
            ...this.props,
        }
    }

    public static generateId(manufacturerId: string, payloadFormat: string, externalCode: string): string {
        return `${manufacturerId}_${payloadFormat}_${externalCode}`;
    }

    get metricCode(): IMetric.MetricCode {
        return this.props.metricCode;
    }
}