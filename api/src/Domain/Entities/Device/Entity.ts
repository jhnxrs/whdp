import { BaseEntity } from "src/Domain/BaseEntity";
import { IDevice } from "src/Domain/Entities/Device/Contract";

export default class Device extends BaseEntity<IDevice.Domain> {
    private constructor(props: IDevice.Domain, id: string) {
        super(props, id);
    }

    public static create(props: IDevice.Create, id: string): Device {
        return new Device(
            {
                ...props,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            id
        );
    }

    public static restore(props: IDevice.Database, id: string): Device {
        return new Device(props, id);
    }

    toPersist() {
        return {
            ...this.props,
        }
    }

    update(props: IDevice.Update): Device {
        const payload = {
            ...this.props,
            ...props
        }

        return new Device(payload, this.id);
    }

    public static generateId(
        manufacturerId: string,
        externalId: string | null,
        model: string | null,
    ): string {
        if (externalId) {
            return `${manufacturerId}_${externalId}`;
        }
        return `${manufacturerId}_${(model ?? "unknown").toLowerCase().replace(/\s+/g, "_")}`;
    }

    public isAssignedToUser(userId: string): boolean {
        return this.props?.currentAssignment?.userId === userId;
    }

    get currentAssignment(): IDevice.DeviceAssignment | null {
        return this.props.currentAssignment;
    }

    get lastSeenAt(): Date | null {
        return this.props.lastSeenAt;
    }
}