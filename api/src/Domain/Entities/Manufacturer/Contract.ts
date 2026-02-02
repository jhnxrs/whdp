import Manufacturer from "src/Domain/Entities/Manufacturer/Entity";

export namespace IManufacturer {
    export type ManufacturerCategory =
        | "gcm"
        | "wearable"
        | "health_platform"
        | (string & {});

    export type ManufacturerAuthType =
        | "oauth"
        | "apiKey"
        | "webhook"
        | "device_permission"
        | (string & {});

    export enum ManufacturerStatus {
        Active = 'active',
        Inactive = 'inactive'
    };

    export type Database = {
        key: string; // "apple_health"
        name: string; // "Apple Health"

        category: ManufacturerCategory; // "health_platform"
        authType: ManufacturerAuthType; // "device_permission"
        status: ManufacturerStatus; // "active"

        acceptedPayloadFormats: string[]; // ["healthkit_v1"]
        supportedMetrics: string[]; // ["heart_rate", "steps", "sleep", "glucose"]

        createdAt: Date;
        updatedAt: Date;
    }

    export type Domain = Database;

    export type Create = Omit<Domain, 'createdAt' | 'updatedAt'>;

    export interface Repository<Transaction = unknown> {
        findById: (id: string) => Promise<Manufacturer | null>;
        findAll: () => Promise<Manufacturer[]>;
        create: (manufacturer: Manufacturer, transaction?: Transaction) => Promise<void>;
    }
}