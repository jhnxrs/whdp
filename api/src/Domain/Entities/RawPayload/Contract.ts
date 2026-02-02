export namespace IRawPayload {
    export type RawPayload = Record<string, any> | Array<Record<string, any>>;

    export type Database = {
        manufacturerId: string;
        derivedObservationIds: string[];
        payloadHash: string;
        payload: RawPayload;
        receivedAt: Date;
        createdAt: Date;
        updatedAt: Date;
    };

    export type Domain = Database;

    export type Create = Omit<Domain, 'createdAt' | 'updatedAt'>;

    export type Update = Pick<Domain, 'derivedObservationIds'>;

    export interface Repository<Transaction = unknown> {
        createBatch(rawPayloads: RawPayload[], transaction?: Transaction): Promise<void>;
    }
}