import { BaseUseCase } from "src/Application/BaseUseCase";
import { IDeviceAssignment } from "src/Domain/Entities/DeviceAssignment/Contract";
import { DeviceAssignmentRepository } from "src/Infra/Database/Repositories/DeviceAssignmentRepository";
import { DeviceRepository } from "src/Infra/Database/Repositories/DeviceRepository";
import { Database } from "src/Infra/Firebase/Connection";

type Input = {
    userId: string;
    deviceId: string;
    reason?: IDeviceAssignment.UnassignmentReason;
};

type Output = {
    success: boolean;
};

export class UnassignDeviceUseCase implements BaseUseCase<Input, Output> {
    constructor(
        private readonly deviceRepository: DeviceRepository,
        private readonly deviceAssignmentRepository: DeviceAssignmentRepository,
    ) { }

    async execute(input: Input): Promise<Output> {
        const { userId, deviceId, reason } = input;

        // check if device exists
        const device = await this.deviceRepository.findById(deviceId);
        if (!device) {
            throw new Error(`Device not found`);
        }

        // check if current user has assignment for the device
        if (!device.isAssignedToUser(userId) || !device?.currentAssignment?.deviceAssignmentId) {
            throw new Error(`Device is not assigned for the user`);
        }

        const deviceAssignment = await this.deviceAssignmentRepository.findById(device.currentAssignment.deviceAssignmentId);

        if (!deviceAssignment) {
            // server error here.. should not happen
            throw new Error("Assignment was not found");
        }

        // update entities
        const updatedDeviceAssignment = deviceAssignment.update({
            status: IDeviceAssignment.DeviceAssignmentStatus.Unassigned,
            unassignedAt: new Date(),
            unassignmentReason: reason ?? "other",
        });

        const updatedDevice = device.update({
            currentAssignment: null,
            lastSeenAt: device.lastSeenAt,
            status: IDeviceAssignment.DeviceAssignmentStatus.Unassigned
        });

        // persist changes
        await Database.runTransaction(async (tx) => {
            await this.deviceAssignmentRepository.update(updatedDeviceAssignment, tx);
            await this.deviceRepository.update(updatedDevice, tx);
        });

        return {
            success: true,
        };
    }
}