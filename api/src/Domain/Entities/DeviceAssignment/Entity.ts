import { BaseEntity } from "src/Domain/BaseEntity";
import { IDeviceAssignment } from "src/Domain/Entities/DeviceAssignment/Contract";

export default class DeviceAssignment extends BaseEntity<IDeviceAssignment.Domain> {
    private constructor(props: IDeviceAssignment.Domain, id: string) {
        super(props, id);
    }

    public static create(props: IDeviceAssignment.Create, id: string): DeviceAssignment {
        return new DeviceAssignment(
            {
                ...props,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            id
        );
    }

    public static restore(props: IDeviceAssignment.Database, id: string): DeviceAssignment {
        return new DeviceAssignment(props, id);
    }

    public static generateId(deviceId: string, userId: string): string {
        const timestamp = Math.floor(Date.now() / 1000);
        return `${deviceId}_${userId}_${timestamp}`;
    }

    update(props: IDeviceAssignment.Update): DeviceAssignment {
        const payload = {
            ...this.props,
            ...props
        }

        return new DeviceAssignment(payload, this.id);
    }

    toPersist() {
        return {
            ...this.props,
        }
    }
}