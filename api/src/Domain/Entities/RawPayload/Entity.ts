import crypto from 'node:crypto';
import { BaseEntity } from "src/Domain/BaseEntity";
import { IRawPayload } from "src/Domain/Entities/RawPayload/Contract";

export default class RawPayload extends BaseEntity<IRawPayload.Domain> {
    private constructor(props: IRawPayload.Domain, id: string) {
        super(props, id);
    }

    public static create(props: IRawPayload.Create, id: string): RawPayload {
        return new RawPayload(
            {
                ...props,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            id
        );
    }

    public static restore(props: IRawPayload.Database, id: string): RawPayload {
        return new RawPayload(props, id);
    }

    update(props: IRawPayload.Update): RawPayload {
        const payload = {
            ...this.props,
            ...props
        }

        return new RawPayload(payload, this.id);
    }

    toPersist() {
        return {
            ...this.props,
        }
    }

    public static generateHash(props: {
        manufacturerId: string;
        payload: IRawPayload.RawPayload;
        receivedAt: Date;
    }): string {
        const content = JSON.stringify({
            manufacturerId: props.manufacturerId,
            receivedAt: Math.floor(props.receivedAt.getTime() / 1000),
            payload: props.payload,
        });

        return crypto
            .createHash("sha256")
            .update(content)
            .digest("hex")
            .slice(0, 16);
    }

    get derivedObservationIds(): string[] {
        return this.props.derivedObservationIds;
    }
}