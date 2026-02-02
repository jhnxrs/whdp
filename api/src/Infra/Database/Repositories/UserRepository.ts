import { Transaction } from "firebase-admin/firestore";
import { IUser } from "src/Domain/Entities/User/Contract";
import User from "src/Domain/Entities/User/Entity";
import { EntityMapper } from "src/Infra/Database/Utilities/EntityMapper";
import { setDoc } from "src/Infra/Database/Utilities/SetDoc";
import { Database } from "src/Infra/Firebase/Connection";

const COLLECTION = "users";

export class UserRepository implements IUser.Repository<Transaction> {
    async findById(id: string): Promise<User | null> {
        const ref = Database.doc(`${COLLECTION}/${id}`);
        const snapshot = await ref.get();

        if (!snapshot.exists) {
            return null;
        }

        const data = (snapshot.data()) as IUser.Database;

        return User.restore(
            EntityMapper.toDomain<IUser.Domain>(data),
            snapshot.id
        );
    }

    async create(user: User, transaction?: Transaction): Promise<void> {
        const ref = Database.doc(`${COLLECTION}/${user.id}`);
        const data = EntityMapper.toFirestore(user.toPersist())

        await setDoc(
            {
                reference: ref,
                data,
                transaction
            }
        );
    }
}