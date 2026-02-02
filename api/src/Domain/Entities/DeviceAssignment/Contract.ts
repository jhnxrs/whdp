import DeviceAssignment from "src/Domain/Entities/DeviceAssignment/Entity";

export namespace IDeviceAssignment {
    export enum DeviceAssignmentStatus {
        Assigned = 'assigned',
        Unassigned = 'unassigned'
    };

    export type AssignmentReason =
        | "initial_pairing"
        | "device_replacement"
        | "device_upgrade"
        | "other"
        | (string & {});

    export type UnassignmentReason =
        | "device_lost"
        | "device_broken"
        | "other"
        | (string & {});

    export type Database = {
        deviceId: string;
        userId: string;
        status: DeviceAssignmentStatus;

        assignedAt: Date;
        unassignedAt: Date | null;

        assignmentReason: AssignmentReason | null;
        unassignmentReason: UnassignmentReason | null;

        createdAt: Date;
        updatedAt: Date;
    }

    export type Domain = Database;

    export type Create = Omit<Domain, 'createdAt' | 'updatedAt'>;

    export type Update = Pick<
        Domain,
        'unassignedAt' |
        'unassignmentReason' |
        'status'
    >;

    export interface Repository<Transaction = unknown> {
        findById: (id: string) => Promise<DeviceAssignment | null>;
        findByDeviceId: (deviceId: string) => Promise<DeviceAssignment[]>;
        create: (deviceAssignment: DeviceAssignment, transaction?: Transaction) => Promise<void>;
        update: (deviceAssignment: DeviceAssignment, transaction?: Transaction) => Promise<void>;
    }
}