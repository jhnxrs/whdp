import { Transaction } from "firebase-admin/firestore";
import { IDeviceAssignment } from "src/Domain/Entities/DeviceAssignment/Contract";
import DeviceAssignment from "src/Domain/Entities/DeviceAssignment/Entity";
import { EntityMapper } from "src/Infra/Database/Utilities/EntityMapper";
import { setDoc } from "src/Infra/Database/Utilities/SetDoc";
import { Database } from "src/Infra/Firebase/Connection";

const COLLECTION = "deviceAssignments";

export class DeviceAssignmentRepository
    implements IDeviceAssignment.Repository<Transaction> {
    async findById(id: string): Promise<DeviceAssignment | null> {
        const ref = Database.doc(`${COLLECTION}/${id}`);
        const snapshot = await ref.get();

        if (!snapshot.exists) {
            return null;
        }

        const data = (snapshot.data()) as IDeviceAssignment.Database;

        return DeviceAssignment.restore(
            EntityMapper.toDomain<IDeviceAssignment.Domain>(data),
            snapshot.id
        );
    }

    async findByDeviceId(deviceId: string): Promise<DeviceAssignment[]> {
        const snapshot = await Database
            .collection(COLLECTION)
            .where("deviceId", "==", deviceId)
            .orderBy("createdAt", "asc")
            .get();

        return snapshot.docs.map((doc) =>
            DeviceAssignment.restore(
                EntityMapper.toDomain<IDeviceAssignment.Domain>(doc.data()),
                doc.id
            ),
        );
    }

    async create(deviceAssignment: DeviceAssignment, transaction?: Transaction): Promise<void> {
        const ref = Database.doc(`${COLLECTION}/${deviceAssignment.id}`);
        const data = EntityMapper.toFirestore(deviceAssignment.toPersist());

        await setDoc(
            {
                reference: ref,
                data,
                transaction
            }
        );
    }

    async update(
        deviceAssignment: DeviceAssignment,
        transaction?: Transaction,
    ): Promise<void> {
        const ref = Database.doc(`${COLLECTION}/${deviceAssignment.id}`);
        const data = EntityMapper.toFirestore(deviceAssignment.toPersist());

        await setDoc(
            {
                reference: ref,
                data,
                transaction,
                merge: true,
            }
        );
    }
}
