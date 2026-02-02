import { BaseEntity } from "src/Domain/BaseEntity";
import { IUser } from "src/Domain/Entities/User/Contract";

export default class User extends BaseEntity<IUser.Domain> {
    private constructor(props: IUser.Domain, id: string) {
        super(props, id);
    }

    public static create(props: IUser.Create, id: string): User {
        return new User(
            {
                ...props,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            id
        );
    }

    public static restore(props: IUser.Database, id: string): User {
        return new User(props, id);
    }

    toPersist() {
        return {
            ...this.props,
        }
    }
}