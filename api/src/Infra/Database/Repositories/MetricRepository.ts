import { Transaction } from "firebase-admin/firestore";
import { IMetric } from "src/Domain/Entities/Metric/Contract";
import Metric from "src/Domain/Entities/Metric/Entity";
import { EntityMapper } from "src/Infra/Database/Utilities/EntityMapper";
import { setDoc } from "src/Infra/Database/Utilities/SetDoc";
import { Database } from "src/Infra/Firebase/Connection";

const COLLECTION = "metrics";

export class MetricRepository implements IMetric.Repository<Transaction> {
    async findByMetricCode(metricCode: IMetric.MetricCode): Promise<Metric | null> {
        const ref = Database.doc(`${COLLECTION}/${metricCode}`);
        const snapshot = await ref.get();

        if (!snapshot.exists) {
            return null;
        }

        const data = (snapshot.data()) as IMetric.Database;

        return Metric.restore(
            EntityMapper.toDomain<IMetric.Database>(data),
            snapshot.id
        );
    }

    async create(metric: Metric, transaction?: Transaction): Promise<void> {
        const ref = Database.doc(`${COLLECTION}/${metric.id}`);
        const data = EntityMapper.toFirestore(metric.toPersist())

        await setDoc(
            {
                reference: ref,
                data,
                transaction
            }
        );
    }
}
