import User from "src/Domain/Entities/User/Entity";

export namespace IUser {
    export type Database = {
        email: string;
        name: string;

        createdAt: Date;
        updatedAt: Date;
    }

    export type Domain = Database;

    export type Create = Omit<Domain, 'createdAt' | 'updatedAt'>;

    export interface Repository<Transaction = unknown> {
        findById: (id: string) => Promise<User | null>;
        create: (user: User, transaction?: Transaction) => Promise<void>;
    }
}