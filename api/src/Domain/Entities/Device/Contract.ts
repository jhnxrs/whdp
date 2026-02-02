import Device from "src/Domain/Entities/Device/Entity";

export namespace IDevice {
    export type DeviceStatus =
        | "active"
        | "disconnected"
        | "replaced"
        | "retired"
        | (string & {});

    export type DeviceType =
        | "cgm"
        | "watch"
        | "ring"
        | (string & {});

    export type DeviceAssignment = {
        deviceAssignmentId: string;
        userId: string;
        assignedAt: Date;
    };

    export type Database = {
        manufacturerId: string;
        type: DeviceType;
        status: DeviceStatus;

        currentAssignment: DeviceAssignment | null;
        lastSeenAt: Date | null;

        model: string | null;
        externalId: string | null;

        createdAt: Date;
        updatedAt: Date;
    };

    export type Domain = Database;

    export type Create = Omit<Domain, 'createdAt' | 'updatedAt'>;

    export type Update = Pick<
        Domain,
        'currentAssignment' |
        'lastSeenAt' |
        'status'
    >;

    export interface Repository<Transaction = unknown> {
        findById: (id: string) => Promise<Device | null>;
        findByUserId: (userId: string) => Promise<Device[]>;
        create: (device: Device, transaction?: Transaction) => Promise<void>;
        update: (device: Device, transaction?: Transaction) => Promise<void>;
        updateLastSeen: (deviceId: string, transaction?: Transaction) => Promise<void>;
    }
}