import { BaseUseCase } from "src/Application/BaseUseCase";
import { IDeviceAssignment } from "src/Domain/Entities/DeviceAssignment/Contract";
import DeviceAssignment from "src/Domain/Entities/DeviceAssignment/Entity";
import { DeviceAssignmentRepository } from "src/Infra/Database/Repositories/DeviceAssignmentRepository";
import { DeviceRepository } from "src/Infra/Database/Repositories/DeviceRepository";
import { Database } from "src/Infra/Firebase/Connection";

type Input = {
    userId: string;
    deviceId: string;
    reason?: IDeviceAssignment.AssignmentReason;
};

type Output = {
    deviceAssignment: DeviceAssignment;
};

export class AssignDeviceToUserUseCase implements BaseUseCase<Input, Output> {
    constructor(
        private readonly deviceRepository: DeviceRepository,
        private readonly deviceAssignmentRepository: DeviceAssignmentRepository
    ) { }

    async execute(input: Input): Promise<Output> {
        const { deviceId, userId, reason } = input;

        // check if device exists
        const device = await this.deviceRepository.findById(deviceId);
        if (!device) {
            throw new Error('Device not found');
        }

        // check if device is already assigned to the user
        if (device.isAssignedToUser(userId)) {
            throw new Error('Device is already assigned')
        }

        // create device assignment entity
        const assignmentId = DeviceAssignment.generateId(deviceId, userId);
        const deviceAssignment = DeviceAssignment.create(
            {
                deviceId,
                userId,
                assignmentReason: reason || "initial_pairing",
                assignedAt: new Date(),
                status: IDeviceAssignment.DeviceAssignmentStatus.Assigned,
                unassignedAt: null,
                unassignmentReason: null,
            },
            assignmentId
        );

        // update device currentAssignment
        const updatedDevice = device.update({
            status: "active",
            currentAssignment: {
                deviceAssignmentId: assignmentId,
                userId,
                assignedAt: new Date(),
            },
            lastSeenAt: new Date()
        });

        // run a transaction to store/update it
        await Database.runTransaction(async (tx) => {
            // if device was already assigned, we unassign it
            const currentDeviceAssignment = device.currentAssignment ? await this.deviceAssignmentRepository.findById(device.currentAssignment.deviceAssignmentId) : null;
            if (currentDeviceAssignment) {
                const updatedDeviceAssignment = currentDeviceAssignment.update({
                    status: IDeviceAssignment.DeviceAssignmentStatus.Unassigned,
                    unassignedAt: new Date(),
                    unassignmentReason: "other",
                });

                await this.deviceAssignmentRepository.update(updatedDeviceAssignment, tx);
            }

            // create new device assignment and update device
            await this.deviceAssignmentRepository.create(deviceAssignment, tx);
            await this.deviceRepository.update(updatedDevice, tx);
        });

        return { deviceAssignment };
    }
}