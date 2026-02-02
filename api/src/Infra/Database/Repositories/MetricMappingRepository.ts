import { Transaction } from "firebase-admin/firestore";
import { IMetricMapping } from "src/Domain/Entities/MetricMapping/Contract";
import MetricMapping from "src/Domain/Entities/MetricMapping/Entity";
import { EntityMapper } from "src/Infra/Database/Utilities/EntityMapper";
import { setDoc } from "src/Infra/Database/Utilities/SetDoc";
import { Database } from "src/Infra/Firebase/Connection";

const COLLECTION = "metricMappings";

export class MetricMappingRepository implements IMetricMapping.Repository<Transaction> {
    async findById(id: string): Promise<MetricMapping | null> {
        const ref = Database.doc(`${COLLECTION}/${id}`);
        const snapshot = await ref.get();

        if (!snapshot.exists) {
            return null;
        }

        const data = (snapshot.data()) as IMetricMapping.Database;

        return MetricMapping.restore(
            EntityMapper.toDomain<IMetricMapping.Domain>(data),
            snapshot.id
        );
    }

    async create(metricMapping: MetricMapping, transaction?: Transaction): Promise<void> {
        const ref = Database.doc(`${COLLECTION}/${metricMapping.id}`);
        const data = EntityMapper.toFirestore(metricMapping.toPersist())

        await setDoc(
            {
                reference: ref,
                data,
                transaction
            }
        );
    }

    async update(matricMapping: MetricMapping, transaction?: Transaction): Promise<void> {
        const ref = Database.doc(`${COLLECTION}/${matricMapping.id}`);
        const data = EntityMapper.toFirestore(matricMapping.toPersist());

        await setDoc(
            {
                reference: ref,
                data,
                transaction,
                merge: true
            }
        );
    }
}