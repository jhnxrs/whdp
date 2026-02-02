import 'reflect-metadata';
import 'dotenv/config';
import { UserRecord } from "firebase-admin/auth";
import { TOKENS } from "src/Common/DI/Tokens";
import { IDevice } from "src/Domain/Entities/Device/Contract";
import Device from "src/Domain/Entities/Device/Entity";
import { IDeviceAssignment } from "src/Domain/Entities/DeviceAssignment/Contract";
import DeviceAssignment from "src/Domain/Entities/DeviceAssignment/Entity";
import { IManufacturer } from "src/Domain/Entities/Manufacturer/Contract";
import Manufacturer from "src/Domain/Entities/Manufacturer/Entity";
import Metric from "src/Domain/Entities/Metric/Entity";
import MetricMapping from "src/Domain/Entities/MetricMapping/Entity";
import User from "src/Domain/Entities/User/Entity";
import { DeviceAssignmentRepository } from "src/Infra/Database/Repositories/DeviceAssignmentRepository";
import { DeviceRepository } from "src/Infra/Database/Repositories/DeviceRepository";
import { ManufacturerRepository } from "src/Infra/Database/Repositories/ManufacturerRepository";
import { MetricMappingRepository } from "src/Infra/Database/Repositories/MetricMappingRepository";
import { MetricRepository } from "src/Infra/Database/Repositories/MetricRepository";
import { UserRepository } from "src/Infra/Database/Repositories/UserRepository";
import { Auth } from "src/Infra/Firebase/Connection";
import Container from "typedi";
import { SetupRegistry } from 'src/Common/DI/Registry';

SetupRegistry();

const CreateSeedUser = async (): Promise<User> => {
    const userPayload = {
        email: 'test.user@gmail.com',
        password: '123123123',
        name: 'Test User'
    };

    let record: UserRecord | undefined;

    try {
        record = await Auth.getUserByEmail(userPayload.email);
    } catch (e: any) {
        if (e?.code === "auth/user-not-found") {
            record = await Auth.createUser({
                email: userPayload.email,
                password: userPayload.password,
                emailVerified: true,
            });
        } else {
            throw e;
        }
    }

    const user = User.create(
        {
            email: userPayload.email,
            name: userPayload.name,
        },
        record.uid
    );

    const userRepository = Container.get<UserRepository>(TOKENS.UserRepository);

    const alreadyExists = await userRepository.findById(user.id);
    if (alreadyExists) {
        return user;
    }

    await userRepository.create(user);

    return user;
}

const CreateSeedManufacturers = async (): Promise<Manufacturer[]> => {
    const manufacturersList: IManufacturer.Create[] = [
        {
            key: "dexcom",
            name: "Dexcom",
            acceptedPayloadFormats: ["egv"],
            supportedMetrics: ["glucose"],
            authType: "oauth",
            category: "gcm",
            status: IManufacturer.ManufacturerStatus.Active,
        },
        {
            key: "apple_health",
            name: "Apple Health",
            acceptedPayloadFormats: ["healthkit_v1"],
            supportedMetrics: ["heart_rate", "sleep_duration"],
            authType: "device_permission",
            category: "health_platform",
            status: IManufacturer.ManufacturerStatus.Active,
        },
    ];

    const entities = manufacturersList.map((e) => {
        return Manufacturer.create(e, e.key);
    });

    const manufacturerRepository = Container.get<ManufacturerRepository>(TOKENS.ManufacturerRepository);

    for (const entity of entities) {
        const exists = await manufacturerRepository.findById(entity.id);
        if (!exists) {
            await manufacturerRepository.create(entity);
        }
    }

    return entities;
}

const CreateSeedDevices = async (manufacturers: Manufacturer[]): Promise<Device[]> => {
    const dexcom = manufacturers
        .find(e => e.key === 'dexcom');

    const appleHealth = manufacturers
        .find(e => e.key === 'apple_health');

    if (!dexcom || !appleHealth) throw new Error('Manufacturers not found');

    const dexcomDevicePayload: IDevice.Create = {
        manufacturerId: dexcom.id,
        currentAssignment: null,
        lastSeenAt: null,
        status: "active",
        type: "gcm",
        externalId: 'DEXCOM_GCM_001',
        model: "Dexcom EGV G7",
    };

    const dexcomDeviceId = Device.generateId(
        dexcomDevicePayload.manufacturerId,
        dexcomDevicePayload.externalId,
        dexcomDevicePayload.model,
    );

    const dexcomDevice = Device.create(
        dexcomDevicePayload,
        dexcomDeviceId
    );

    const appleDevicePayload: IDevice.Create = {
        manufacturerId: appleHealth.id,
        currentAssignment: null,
        lastSeenAt: null,
        status: "active",
        type: "watch",
        externalId: 'APPLE_WATCH_SE',
        model: "Apple Watch SE",
    };

    const appleDeviceId = Device.generateId(
        appleDevicePayload.manufacturerId,
        appleDevicePayload.externalId,
        appleDevicePayload.model,
    );

    const appleDevice = Device.create(
        appleDevicePayload,
        appleDeviceId
    );

    const deviceRepository = Container.get<DeviceRepository>(TOKENS.DeviceRepository);
    const devices = [dexcomDevice, appleDevice];

    for (const device of devices) {
        const exists = await deviceRepository.findById(device.id);
        if (exists) continue;

        await deviceRepository.create(device);
    }

    return devices;
}

const CreateSeedMetrics = async (): Promise<Metric[]> => {
    const metrics = [
        Metric.create(
            {
                metricCode: "glucose",
                displayName: "Blood Glucose",
                aggregationMethods: ["average", "min", "max", "latest"],
                canonicalUnit: { code: "mg/dL" },
                dataType: "numeric",
                referenceRanges: [
                    {
                        low: 70,
                        high: 99,
                        unit: { code: "mg/dL" },
                        conditions: {
                            state: "fasting",
                            population: "adult",
                        },
                    },
                    {
                        low: 70,
                        high: 140,
                        unit: { code: "mg/dL" },
                        conditions: {
                            state: "postprandial",
                            population: "adult",
                        },
                    },
                ],
                typicalFrequency: {
                    kind: "continuous",
                }
            },
            "glucose"
        ),
        Metric.create(
            {
                aggregationMethods: [
                    "average",
                    "min",
                    "max",
                    "latest",
                ],
                canonicalUnit: { code: "bpm" },
                dataType: "numeric",
                displayName: "Heart Rate",
                metricCode: "heart_rate",
                referenceRanges: [
                    {
                        low: 60,
                        high: 100,
                        unit: { code: "bpm" },
                        conditions: {
                            state: "resting",
                            population: "adult",
                        },
                    },
                    {
                        low: 50,
                        high: 85,
                        unit: { code: "bpm" },
                        conditions: {
                            state: "resting",
                            population: "athlete",
                        },
                    },
                    {
                        high: 120,
                        unit: { code: "bpm" },
                        conditions: {
                            state: "sleeping",
                            population: "adult",
                        },
                    },
                ],
                typicalFrequency: {
                    kind: "periodic",
                    intervalSeconds: 60,
                },
            },
            "heart_rate"
        )
    ];

    const metricRepository = Container.get<MetricRepository>(TOKENS.MetricRepository);

    for (const metric of metrics) {
        const exists = await metricRepository.findByMetricCode(metric.metricCode);
        if (!exists) {
            await metricRepository.create(metric);
        }
    }

    return metrics;
}

const CreateSeedMetricMappings = async (metrics: Metric[], manufacturers: Manufacturer[]): Promise<MetricMapping[]> => {
    const dexcom = manufacturers
        .find(e => e.key === 'dexcom');

    const appleHealth = manufacturers
        .find(e => e.key === 'apple_health');

    if (!dexcom || !appleHealth) throw new Error('Manufacturers not found');

    const glucose = metrics
        .find(e => e.metricCode === 'glucose');

    const heartRate = metrics
        .find(e => e.metricCode === 'heart_rate');

    if (!glucose || !heartRate) throw new Error('Metrics not found');

    const metricMappingRepository = Container.get<MetricMappingRepository>(
        TOKENS.MetricMappingRepository
    );

    const mappingsToSeed: MetricMapping[] = [
        // Dexcom EGV -> glucose
        MetricMapping.create(
            {
                manufacturerId: dexcom.id,
                externalCode: "egv",
                metricCode: glucose.metricCode,
                payloadFormat: dexcom.acceptedPayloadFormats[0],
                externalUnit: "mg/dL",
            },
            MetricMapping.generateId(dexcom.id, dexcom.acceptedPayloadFormats[0], "egv")
        ),

        // Apple Health HKQuantityTypeIdentifierHeartRate -> heart_rate
        MetricMapping.create(
            {
                manufacturerId: appleHealth.id,
                externalCode: "HKQuantityTypeIdentifierHeartRate",
                metricCode: heartRate.metricCode,
                payloadFormat: appleHealth.acceptedPayloadFormats[0],
                externalUnit: "count/min",
            },
            MetricMapping.generateId(
                appleHealth.id,
                appleHealth.acceptedPayloadFormats[0],
                "HKQuantityTypeIdentifierHeartRate"
            )
        ),
    ];

    // Ensure they exist (idempotent seed)
    for (const mapping of mappingsToSeed) {
        const existing = await metricMappingRepository.findById(mapping.id);
        if (!existing) {
            await metricMappingRepository.create(mapping);
        }
    }

    return mappingsToSeed;
}

const CreateDeviceAssignments = async (user: User, devices: Device[]): Promise<DeviceAssignment[]> => {
    const deviceAssignments: DeviceAssignment[] = [];

    for (const device of devices) {
        const deviceAssignmentId = DeviceAssignment.generateId(device.id, user.id);
        const deviceAssignment = DeviceAssignment.create(
            {
                deviceId: device.id,
                userId: user.id,
                assignmentReason: "initial_pairing",
                assignedAt: new Date(),
                status: IDeviceAssignment.DeviceAssignmentStatus.Assigned,
                unassignedAt: null,
                unassignmentReason: null,
            },
            deviceAssignmentId
        );

        deviceAssignments.push(deviceAssignment);

        const deviceAssignmentRepository = Container.get<DeviceAssignmentRepository>(TOKENS.DeviceAssignmentRepository);
        const deviceRepository = Container.get<DeviceRepository>(TOKENS.DeviceRepository);

        const exists = await deviceAssignmentRepository.findById(deviceAssignmentId);
        if (exists) {
            continue;
        }

        await deviceAssignmentRepository.create(deviceAssignment);

        const updatedDevice = device.update({
            currentAssignment: {
                deviceAssignmentId,
                userId: user.id,
                assignedAt: new Date(),
            },
            lastSeenAt: new Date(),
            status: "active"
        });

        await deviceRepository.update(updatedDevice);
    }

    return deviceAssignments;
}

/**
 * Create some mock data for testing purposes
 */
const SeedDatabase = async () => {
    const user = await CreateSeedUser();
    const manufacturers = await CreateSeedManufacturers();
    const devices = await CreateSeedDevices(manufacturers);
    const metrics = await CreateSeedMetrics();

    await CreateDeviceAssignments(user, devices);
    await CreateSeedMetricMappings(metrics, manufacturers);
}

SeedDatabase();