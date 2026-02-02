import { BaseUseCase } from "src/Application/BaseUseCase";
import { IDevice } from "src/Domain/Entities/Device/Contract";
import Device from "src/Domain/Entities/Device/Entity";
import { DeviceRepository } from "src/Infra/Database/Repositories/DeviceRepository";
import { ManufacturerRepository } from "src/Infra/Database/Repositories/ManufacturerRepository";

type Input = Omit<IDevice.Create, 'currentAssignment' | 'lastSeenAt' | 'status'>;

type Output = {
    device: Device;
};

export class CreateDeviceUseCase implements BaseUseCase<Input, Output> {
    constructor(
        private readonly deviceRepository: DeviceRepository,
        private readonly manufacturerRepository: ManufacturerRepository
    ) { }

    async execute(input: Input): Promise<Output> {
        const { manufacturerId, externalId, model } = input;

        // check if manufacturer exists
        const manufacturer = await this.manufacturerRepository.findById(manufacturerId);
        if (!manufacturer) {
            throw new Error('Manufacturer not found');
        }

        // generate an id for the device
        const id = Device.generateId(
            manufacturerId,
            externalId,
            model
        );

        // check if device already exists
        const deviceExists = await this.deviceRepository.findById(id);
        if (deviceExists) {
            throw new Error('Device already exists');
        }

        // create entity and store
        const device = Device.create(
            {
                ...input,
                currentAssignment: null,
                lastSeenAt: null,
                status: "active",
            },
            id
        );
        await this.deviceRepository.create(device);

        return { device };
    }
}