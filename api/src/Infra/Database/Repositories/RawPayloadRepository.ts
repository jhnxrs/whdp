import { Transaction } from "firebase-admin/firestore";
import { EntityMapper } from "src/Infra/Database/Utilities/EntityMapper";
import { IRawPayload } from "src/Domain/Entities/RawPayload/Contract";
import RawPayload from "src/Domain/Entities/RawPayload/Entity";
import { Database } from "src/Infra/Firebase/Connection";

const COLLECTION = "rawPayloads";

export class RawPayloadRepository implements IRawPayload.Repository<Transaction> {
    async createBatch(
        rawPayloads: RawPayload[],
        transaction?: FirebaseFirestore.Transaction,
    ): Promise<void> {
        const BATCH_SIZE = 500;

        // writeBatch does not work with transaction
        // so, if transaction is set, we do normal writes
        if (transaction) {
            for (let i = 0; i < rawPayloads.length; i += BATCH_SIZE) {
                const chunk = rawPayloads.slice(i, i + BATCH_SIZE);

                for (const rawPayload of chunk) {
                    const ref = Database.doc(`${COLLECTION}/${rawPayload.id}`);

                    transaction.set(ref, EntityMapper.toFirestore(rawPayload.toPersist()));
                }
            }

            return;
        }

        const batches: FirebaseFirestore.WriteBatch[] = [];
        for (let i = 0; i < rawPayloads.length; i += BATCH_SIZE) {
            const batch = Database.batch();
            const chunk = rawPayloads.slice(i, i + BATCH_SIZE);

            for (const rawPayload of chunk) {
                const ref = Database.doc(`${COLLECTION}/${rawPayload.id}`);

                batch.set(ref, EntityMapper.toFirestore(rawPayload.toPersist()));
            }

            batches.push(batch);
        }

        await Promise.all(batches.map((b) => b.commit()));
    }
}