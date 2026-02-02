import { BaseUseCase } from "src/Application/BaseUseCase";
import Device from "src/Domain/Entities/Device/Entity";
import { DeviceRepository } from "src/Infra/Database/Repositories/DeviceRepository";

type Input = {
    userId: string;
};

type Output = {
    devices: Device[];
};

export class GetUserDevicesUseCase implements BaseUseCase<Input, Output> {
    constructor(
        private readonly deviceRepository: DeviceRepository,
    ) { }

    async execute(input: Input): Promise<Output> {
        const { userId } = input;

        // find all devices for userId and return it
        const devices = await this.deviceRepository.findByUserId(userId);
        return { devices };
    }
}