import { Transaction } from "firebase-admin/firestore";
import { IManufacturer } from "src/Domain/Entities/Manufacturer/Contract";
import Manufacturer from "src/Domain/Entities/Manufacturer/Entity";
import { EntityMapper } from "src/Infra/Database/Utilities/EntityMapper";
import { setDoc } from "src/Infra/Database/Utilities/SetDoc";
import { Database } from "src/Infra/Firebase/Connection";

const COLLECTION = "manufacturers";

export class ManufacturerRepository implements IManufacturer.Repository<Transaction> {
    async findById(id: string): Promise<Manufacturer | null> {
        const ref = Database.doc(`${COLLECTION}/${id}`);
        const snapshot = await ref.get();

        if (!snapshot.exists) {
            return null;
        }

        const data = (snapshot.data()) as IManufacturer.Database;

        return Manufacturer.restore(
            EntityMapper.toDomain<IManufacturer.Domain>(data),
            snapshot.id
        );
    }

    async findAll(): Promise<Manufacturer[]> {
        const snapshot = await Database
            .collection(COLLECTION)
            .where("status", "==", "active")
            .get();

        return snapshot.docs.map((doc) =>
            Manufacturer.restore(
                EntityMapper.toDomain<IManufacturer.Domain>(doc.data() as IManufacturer.Database),
                doc.id,
            ),
        );
    }

    async create(manufacturer: Manufacturer, transaction?: Transaction): Promise<void> {
        const ref = Database.doc(`${COLLECTION}/${manufacturer.id}`);
        const data = EntityMapper.toFirestore(manufacturer.toPersist())

        await setDoc(
            {
                reference: ref,
                data,
                transaction
            }
        );
    }
}
