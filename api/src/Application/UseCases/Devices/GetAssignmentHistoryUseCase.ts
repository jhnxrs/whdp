import { BaseUseCase } from "src/Application/BaseUseCase";
import DeviceAssignment from "src/Domain/Entities/DeviceAssignment/Entity";
import { DeviceAssignmentRepository } from "src/Infra/Database/Repositories/DeviceAssignmentRepository";
import { DeviceRepository } from "src/Infra/Database/Repositories/DeviceRepository";

type Input = {
    userId: string;
    deviceId: string;
}

type Output = {
    deviceAssignments: DeviceAssignment[];
}

export class GetAssignmentHistoryUseCase implements BaseUseCase<Input, Output> {
    constructor(
        private readonly deviceRepository: DeviceRepository,
        private readonly deviceAssignmentRepository: DeviceAssignmentRepository
    ) { }

    async execute(input: Input): Promise<Output> {
        const { deviceId, userId } = input;

        // check if device exists
        const device = await this.deviceRepository.findById(deviceId);
        if (!device) {
            throw new Error('Device not found');
        }

        // we check if the device is assigned to the user
        if (!device.isAssignedToUser(userId)) {
            throw new Error('Device is not assigned to the user');
        }

        // get assignment history & return it
        const deviceAssignments = await this.deviceAssignmentRepository.findByDeviceId(deviceId);
        return { deviceAssignments };
    }
}