import { Transaction } from "firebase-admin/firestore";
import { EntityMapper } from "src/Infra/Database/Utilities/EntityMapper";
import { Database } from "src/Infra/Firebase/Connection";
import DataStream from "src/Domain/Entities/DataStream/Entity";
import { IDataStream } from "src/Domain/Entities/DataStream/Contract";

const COLLECTION = "streams";

export class DataStreamRepository implements IDataStream.Repository<Transaction> {
    async findById(id: string): Promise<DataStream | null> {
        const ref = Database.doc(`${COLLECTION}/${id}`);
        const snap = await ref.get();

        if (!snap.exists) {
            return null;
        }

        return DataStream.restore(
            EntityMapper.toDomain<IDataStream.Domain>(snap.data() as IDataStream.Database),
            snap.id,
        );
    }

    async findRecentByUserId(userId: string, limit: number): Promise<DataStream[]> {
        const querySnap = await Database.collection(COLLECTION)
            .where("userId", "==", userId)
            .orderBy("lastObservationAt", "desc")
            .limit(limit)
            .get();

        return querySnap.docs.map((doc) =>
            DataStream.restore(
                EntityMapper.toDomain<IDataStream.Domain>(doc.data() as IDataStream.Database),
                doc.id
            )
        );
    }

    async createBatch(
        dataStreams: DataStream[],
        transaction?: FirebaseFirestore.Transaction,
    ): Promise<void> {
        const BATCH_SIZE = 500;

        // writeBatch does not work with transaction
        // so, if transaction is set, we do normal writes
        if (transaction) {
            for (let i = 0; i < dataStreams.length; i += BATCH_SIZE) {
                const chunk = dataStreams.slice(i, i + BATCH_SIZE);

                for (const dataStream of chunk) {
                    const ref = Database.doc(`${COLLECTION}/${dataStream.id}`);

                    transaction.set(ref, EntityMapper.toFirestore(dataStream.toPersist()));
                }
            }

            return;
        }

        const batches: FirebaseFirestore.WriteBatch[] = [];
        for (let i = 0; i < dataStreams.length; i += BATCH_SIZE) {
            const batch = Database.batch();
            const chunk = dataStreams.slice(i, i + BATCH_SIZE);

            for (const dataStream of chunk) {
                const ref = Database.doc(`${COLLECTION}/${dataStream.id}`);

                batch.set(ref, EntityMapper.toFirestore(dataStream.toPersist()));
            }

            batches.push(batch);
        }

        await Promise.all(batches.map((b) => b.commit()));
    }
}