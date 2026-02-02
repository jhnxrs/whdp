import { BaseEntity } from "src/Domain/BaseEntity";
import { IManufacturer } from "src/Domain/Entities/Manufacturer/Contract";

export default class Manufacturer extends BaseEntity<IManufacturer.Domain> {
    private constructor(props: IManufacturer.Domain, id: string) {
        super(props, id);
    }

    public static create(props: IManufacturer.Create, id: string): Manufacturer {
        return new Manufacturer(
            {
                ...props,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            id
        );
    }

    public static restore(props: IManufacturer.Database, id: string): Manufacturer {
        return new Manufacturer(props, id);
    }

    toPersist() {
        return {
            ...this.props,
        }
    }

    public isActive(): boolean {
        return this.props.status === IManufacturer.ManufacturerStatus.Active;
    }

    get acceptedPayloadFormats(): string[] {
        return this.props.acceptedPayloadFormats;
    }

    get key(): string {
        return this.props.key;
    }
}