import { Transaction } from "firebase-admin/firestore";
import { EntityMapper } from "src/Infra/Database/Utilities/EntityMapper";
import { Database } from "src/Infra/Firebase/Connection";
import DataStreamDailyRollup from "src/Domain/Entities/DataStreamDailyRollup/Entity";
import { IDataStreamDailyRollup } from "src/Domain/Entities/DataStreamDailyRollup/Contract";
import { Chunk } from "src/Common/Chunk";

export class DataStreamDailyRollupRepository implements IDataStreamDailyRollup.Repository<Transaction> {
    async findOne(streamId: string, day: string): Promise<DataStreamDailyRollup | null> {
        const id = 'streams/' + streamId + '/rollups/' + day
        const ref = Database.doc(id);
        const snap = await ref.get();

        if (!snap.exists) {
            return null;
        }

        return DataStreamDailyRollup.restore(
            EntityMapper.toDomain<IDataStreamDailyRollup.Domain>(snap.data() as IDataStreamDailyRollup.Database),
            snap.id,
        );
    }

    async create(
        dataStreamDailyRollup: DataStreamDailyRollup,
        transaction?: Transaction,
    ): Promise<void> {
        const ref = Database.doc('streams/' + dataStreamDailyRollup.streamId + '/rollups/' + dataStreamDailyRollup.day);

        const data = EntityMapper.toFirestore(
            dataStreamDailyRollup.toPersist(),
        );

        if (transaction) {
            transaction.set(ref, data);
            return;
        }

        await ref.set(data);
    }

    async update(
        dataStreamDailyRollup: DataStreamDailyRollup,
        transaction?: Transaction,
    ): Promise<void> {
        const ref = Database.doc('streams/' + dataStreamDailyRollup.streamId + '/rollups/' + dataStreamDailyRollup.day);

        const data = EntityMapper.toFirestore(
            dataStreamDailyRollup.toPersist(),
        );

        if (transaction) {
            transaction.set(ref, data, { merge: true });
            return;
        }

        await ref.set(data, { merge: true });
    }

    async findManyByStreamIdsAndDays(streamIds: string[], days: string[]): Promise<DataStreamDailyRollup[]> {
        if (streamIds.length === 0 || days.length === 0) return [];

        // Firestore "in" queries allow up to 10 values.
        const streamChunks = Chunk(streamIds, 10);

        const queries: Promise<FirebaseFirestore.QuerySnapshot>[] = [];

        for (const day of days) {
            for (const ids of streamChunks) {
                console.log('day', day);
                const q = Database.collectionGroup("rollups")
                    .where("day", "==", day)
                    .where("streamId", "in", ids)
                    .get();

                queries.push(q);
            }
        }

        const snaps = await Promise.all(queries);

        const rollups: DataStreamDailyRollup[] = [];
        for (const snap of snaps) {
            for (const doc of snap.docs) {
                rollups.push(
                    DataStreamDailyRollup.restore(
                        EntityMapper.toDomain<IDataStreamDailyRollup.Domain>(doc.data() as IDataStreamDailyRollup.Database),
                        doc.id
                    )
                );
            }
        }

        return rollups;
    }

    async findManyByStreamIdAndDays(
        streamId: string,
        days: string[],
    ): Promise<DataStreamDailyRollup[]> {
        const refs = days.map(day =>
            Database.doc(`streams/${streamId}/rollups/${day}`)
        );

        const snaps = await Database.getAll(...refs);

        return snaps
            .filter(s => s.exists)
            .map(s =>
                DataStreamDailyRollup.restore(
                    EntityMapper.toDomain<IDataStreamDailyRollup.Domain>(
                        s.data() as IDataStreamDailyRollup.Database,
                    ),
                    s.id,
                ),
            );
    }
}