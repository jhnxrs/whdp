import { Transaction, Firestore, BulkWriter } from "firebase-admin/firestore";
import Observation from "src/Domain/Entities/Observation/Entity";
import { EntityMapper } from "src/Infra/Database/Utilities/EntityMapper";
import { Database } from "src/Infra/Firebase/Connection";
import { IObservation } from "src/Domain/Entities/Observation/Contract";

export class ObservationRepository implements IObservation.Repository<Transaction> {
    async createBatch(
        streamId: string,
        observations: Observation[]
    ): Promise<{ duplicates: string[]; }> {
        if (observations.length === 0) {
            return { duplicates: [] };
        }

        const firestore = Database as Firestore;

        const duplicates: string[] = [];
        let failed = 0;

        const writer: BulkWriter = firestore.bulkWriter();

        writer.onWriteError((err) => {
            failed++;

            // 6 = ALREADY_EXISTS
            if (err.code === 6) {
                duplicates.push(err.documentRef.id);
                return false; // = dont retry
            }

            console.error("BulkWriter write error:", err.code, err.message);

            return err.failedAttempts < 3;
        });

        try {
            for (const observation of observations) {
                const dayKey = observation.observedAt
                    .toISOString()
                    .slice(0, 10)
                    .replace(/-/g, "");

                const ref = firestore.doc(
                    `streams/${streamId}/days/${dayKey}/observations/${observation.id}`,
                );

                const data = EntityMapper.toFirestore(observation.toPersist());

                writer.create(ref, data);
            }

            await writer.close();

            return { duplicates };
        } finally { }
    }

    async findByUserAndMetric(
        userId: string,
        metricCode: string,
        options?: {
            limit?: number;
            startAfter?: Date;
            endBefore?: Date;
        }
    ): Promise<Observation[]> {
        let query: FirebaseFirestore.Query = Database
            .collectionGroup("observations")
            .where("userId", "==", userId)
            .where("metricCode", "==", metricCode);

        // Range filters must come BEFORE orderBy on the same field for sanity.
        // Firestore allows it either way but this is the common pattern.
        if (options?.startAfter) {
            query = query.where("observedAt", ">=", options.startAfter);
        }

        if (options?.endBefore) {
            query = query.where("observedAt", "<=", options.endBefore);
        }

        query = query.orderBy("observedAt", "desc");

        if (options?.limit) {
            query = query.limit(options.limit);
        }

        const snapshot = await query.get();

        return snapshot.docs.map((doc) =>
            Observation.restore(
                EntityMapper.toDomain<IObservation.Domain>(doc.data() as IObservation.Database),
                doc.id
            )
        );
    }

    async findByStreamAndRange(
        streamId: string,
        start: Date,
        end: Date,
    ): Promise<Observation[]> {
        const snap = await Database
            .collectionGroup("observations")
            .where("streamId", "==", streamId)
            .where("observedAt", ">=", start)
            .where("observedAt", "<=", end)
            .orderBy("observedAt", "asc")
            .get();

        return snap.docs.map(doc =>
            Observation.restore(
                EntityMapper.toDomain<IObservation.Domain>(doc.data() as IObservation.Database),
                doc.id,
            ),
        );
    }
}