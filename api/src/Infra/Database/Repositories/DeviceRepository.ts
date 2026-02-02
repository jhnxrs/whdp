import { Transaction } from "firebase-admin/firestore";
import { IDevice } from "src/Domain/Entities/Device/Contract";
import Device from "src/Domain/Entities/Device/Entity";
import { EntityMapper } from "src/Infra/Database/Utilities/EntityMapper";
import { setDoc } from "src/Infra/Database/Utilities/SetDoc";
import { Database } from "src/Infra/Firebase/Connection";

const COLLECTION = "devices";

export class DeviceRepository implements IDevice.Repository<Transaction> {
    async findById(id: string): Promise<Device | null> {
        const ref = Database.doc(`${COLLECTION}/${id}`);
        const snapshot = await ref.get();

        if (!snapshot.exists) {
            return null;
        }

        const data = (snapshot.data()) as IDevice.Database;

        return Device.restore(
            EntityMapper.toDomain<IDevice.Domain>(data),
            snapshot.id
        );
    }

    async findByUserId(userId: string): Promise<Device[]> {
        const snapshot = await Database
            .collection(COLLECTION)
            .where("currentAssignment.userId", "==", userId)
            .get();

        return snapshot.docs.map((doc) =>
            Device.restore(
                EntityMapper.toDomain<IDevice.Domain>(doc.data()),
                doc.id
            ),
        );
    }

    async create(device: Device, transaction?: Transaction): Promise<void> {
        const ref = Database.doc(`${COLLECTION}/${device.id}`);
        const data = EntityMapper.toFirestore(device.toPersist())

        await setDoc(
            {
                reference: ref,
                data,
                transaction
            }
        );
    }

    async update(device: Device, transaction?: Transaction): Promise<void> {
        const ref = Database.doc(`${COLLECTION}/${device.id}`);
        const data = EntityMapper.toFirestore(device.toPersist());

        await setDoc(
            {
                reference: ref,
                data,
                transaction,
                merge: true
            }
        );
    }

    async updateLastSeen(deviceId: string, transaction?: Transaction): Promise<void> {
        const ref = Database.doc(`${COLLECTION}/${deviceId}`);

        await setDoc(
            {
                reference: ref,
                data: {
                    lastSeenAt: new Date(),
                    updatedAt: new Date(),
                },
                transaction,
                merge: true
            }
        );
    }
}