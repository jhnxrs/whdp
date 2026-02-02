import 'reflect-metadata';
import 'dotenv/config';
import { SetupRegistry } from 'src/Common/DI/Registry';
import Container from 'typedi';
import { IngestDataUseCase } from 'src/Application/UseCases/Ingestion/IngestDataUseCase';
import { TOKENS } from 'src/Common/DI/Tokens';

SetupRegistry();

const RunDexcomMockedData = async (userId: string, deviceId: string) => {
    const manufacturerId = 'dexcom';
    const payloadFormat = 'egv';
    const payload = {
        recordType: "egv",
        records: [
            // -----------------
            // Existing records
            // -----------------
            {
                recordId: "egv-00",
                systemTime: "2026-01-30T00:00:00Z",
                displayTime: "2026-01-29T16:00:00-08:00",
                transmitterId: "cdb4f8eea4392295413c64d5bc7a9e0e0ee9b215fb43c5a6d71d4431e540046b",
                transmitterTicks: 0,
                value: 105,
                status: "normal",
                trend: "flat",
                trendRate: 0,
                unit: "mg/dL",
                rateUnit: "mg/dL/min",
                displayDevice: "iOS",
                transmitterGeneration: "g7",
                displayApp: "G7"
            },
            {
                recordId: "egv-01",
                systemTime: "2026-01-30T01:00:00Z",
                displayTime: "2026-01-29T17:00:00-08:00",
                transmitterTicks: 3600,
                value: 112,
                status: "normal",
                trend: "rising",
                trendRate: 0.3,
                unit: "mg/dL",
                rateUnit: "mg/dL/min",
                displayDevice: "iOS",
                transmitterGeneration: "g7",
                displayApp: "G7"
            },
            {
                recordId: "egv-02",
                systemTime: "2026-01-30T02:00:00Z",
                displayTime: "2026-01-29T18:00:00-08:00",
                transmitterTicks: 7200,
                value: 128,
                status: "normal",
                trend: "rising",
                trendRate: 0.5,
                unit: "mg/dL",
                rateUnit: "mg/dL/min",
                displayDevice: "iOS",
                transmitterGeneration: "g7",
                displayApp: "G7"
            },
            {
                recordId: "egv-03",
                systemTime: "2026-01-30T03:00:00Z",
                displayTime: "2026-01-29T19:00:00-08:00",
                transmitterTicks: 10800,
                value: 142,
                status: "high",
                trend: "rising",
                trendRate: 0.4,
                unit: "mg/dL",
                rateUnit: "mg/dL/min",
                displayDevice: "iOS",
                transmitterGeneration: "g7",
                displayApp: "G7"
            },
            {
                recordId: "egv-04",
                systemTime: "2026-01-30T04:00:00Z",
                displayTime: "2026-01-29T20:00:00-08:00",
                transmitterTicks: 14400,
                value: 150,
                status: "high",
                trend: "flat",
                trendRate: 0,
                unit: "mg/dL",
                rateUnit: "mg/dL/min",
                displayDevice: "iOS",
                transmitterGeneration: "g7",
                displayApp: "G7"
            },
            {
                recordId: "egv-05",
                systemTime: "2026-01-30T05:00:00Z",
                displayTime: "2026-01-29T21:00:00-08:00",
                transmitterTicks: 18000,
                value: 138,
                status: "normal",
                trend: "falling",
                trendRate: -0.4,
                unit: "mg/dL",
                rateUnit: "mg/dL/min",
                displayDevice: "iOS",
                transmitterGeneration: "g7",
                displayApp: "G7"
            },
            {
                recordId: "egv-06",
                systemTime: "2026-01-30T06:00:00Z",
                displayTime: "2026-01-29T22:00:00-08:00",
                transmitterTicks: 21600,
                value: 120,
                status: "normal",
                trend: "falling",
                trendRate: -0.3,
                unit: "mg/dL",
                rateUnit: "mg/dL/min",
                displayDevice: "iOS",
                transmitterGeneration: "g7",
                displayApp: "G7"
            },
            {
                recordId: "egv-07",
                systemTime: "2026-01-30T07:00:00Z",
                displayTime: "2026-01-29T23:00:00-08:00",
                transmitterTicks: 25200,
                value: 98,
                status: "normal",
                trend: "falling",
                trendRate: -0.4,
                unit: "mg/dL",
                rateUnit: "mg/dL/min",
                displayDevice: "iOS",
                transmitterGeneration: "g7",
                displayApp: "G7"
            },
            {
                recordId: "egv-08",
                systemTime: "2026-01-30T08:00:00Z",
                displayTime: "2026-01-30T00:00:00-08:00",
                transmitterTicks: 28800,
                value: 85,
                status: "normal",
                trend: "flat",
                trendRate: 0,
                unit: "mg/dL",
                rateUnit: "mg/dL/min",
                displayDevice: "iOS",
                transmitterGeneration: "g7",
                displayApp: "G7"
            },
            {
                recordId: "egv-09",
                systemTime: "2026-01-30T09:00:00Z",
                displayTime: "2026-01-30T01:00:00-08:00",
                transmitterTicks: 32400,
                value: 78,
                status: "low",
                trend: "falling",
                trendRate: -0.2,
                unit: "mg/dL",
                rateUnit: "mg/dL/min",
                displayDevice: "iOS",
                transmitterGeneration: "g7",
                displayApp: "G7"
            },
            {
                recordId: "egv-10",
                systemTime: "2026-01-30T10:00:00Z",
                displayTime: "2026-01-30T02:00:00-08:00",
                transmitterTicks: 36000,
                value: 92,
                status: "normal",
                trend: "rising",
                trendRate: 0.3,
                unit: "mg/dL",
                rateUnit: "mg/dL/min",
                displayDevice: "iOS",
                transmitterGeneration: "g7",
                displayApp: "G7"
            },
            {
                recordId: "egv-23",
                systemTime: "2026-01-30T23:00:00Z",
                displayTime: "2026-01-30T15:00:00-08:00",
                transmitterTicks: 82800,
                value: 110,
                status: "normal",
                trend: "flat",
                trendRate: 0,
                unit: "mg/dL",
                rateUnit: "mg/dL/min",
                displayDevice: "iOS",
                transmitterGeneration: "g7",
                displayApp: "G7"
            },

            // -----------------
            // NEW records (18) across multiple days (Jan 28, Jan 29, Jan 31)
            // -----------------

            // Jan 31, 2026 (Z) - 6 records
            {
                recordId: "egv-31-00",
                systemTime: "2026-01-31T00:00:00Z",
                displayTime: "2026-01-30T16:00:00-08:00",
                transmitterTicks: 0,
                value: 101,
                status: "normal",
                trend: "flat",
                trendRate: 0,
                unit: "mg/dL",
                rateUnit: "mg/dL/min",
                displayDevice: "iOS",
                transmitterGeneration: "g7",
                displayApp: "G7"
            },
            {
                recordId: "egv-31-01",
                systemTime: "2026-01-31T02:00:00Z",
                displayTime: "2026-01-30T18:00:00-08:00",
                transmitterTicks: 7200,
                value: 118,
                status: "normal",
                trend: "rising",
                trendRate: 0.2,
                unit: "mg/dL",
                rateUnit: "mg/dL/min",
                displayDevice: "iOS",
                transmitterGeneration: "g7",
                displayApp: "G7"
            },
            {
                recordId: "egv-31-02",
                systemTime: "2026-01-31T04:00:00Z",
                displayTime: "2026-01-30T20:00:00-08:00",
                transmitterTicks: 14400,
                value: 134,
                status: "normal",
                trend: "rising",
                trendRate: 0.3,
                unit: "mg/dL",
                rateUnit: "mg/dL/min",
                displayDevice: "iOS",
                transmitterGeneration: "g7",
                displayApp: "G7"
            },
            {
                recordId: "egv-31-03",
                systemTime: "2026-01-31T06:00:00Z",
                displayTime: "2026-01-30T22:00:00-08:00",
                transmitterTicks: 21600,
                value: 147,
                status: "high",
                trend: "flat",
                trendRate: 0,
                unit: "mg/dL",
                rateUnit: "mg/dL/min",
                displayDevice: "iOS",
                transmitterGeneration: "g7",
                displayApp: "G7"
            },
            {
                recordId: "egv-31-04",
                systemTime: "2026-01-31T08:00:00Z",
                displayTime: "2026-01-31T00:00:00-08:00",
                transmitterTicks: 28800,
                value: 132,
                status: "normal",
                trend: "falling",
                trendRate: -0.2,
                unit: "mg/dL",
                rateUnit: "mg/dL/min",
                displayDevice: "iOS",
                transmitterGeneration: "g7",
                displayApp: "G7"
            },
            {
                recordId: "egv-31-05",
                systemTime: "2026-01-31T10:00:00Z",
                displayTime: "2026-01-31T02:00:00-08:00",
                transmitterTicks: 36000,
                value: 109,
                status: "normal",
                trend: "falling",
                trendRate: -0.3,
                unit: "mg/dL",
                rateUnit: "mg/dL/min",
                displayDevice: "iOS",
                transmitterGeneration: "g7",
                displayApp: "G7"
            },

            // Jan 29, 2026 (Z) - 6 records
            {
                recordId: "egv-29-00",
                systemTime: "2026-01-29T00:00:00Z",
                displayTime: "2026-01-28T16:00:00-08:00",
                transmitterTicks: 0,
                value: 96,
                status: "normal",
                trend: "flat",
                trendRate: 0,
                unit: "mg/dL",
                rateUnit: "mg/dL/min",
                displayDevice: "iOS",
                transmitterGeneration: "g7",
                displayApp: "G7"
            },
            {
                recordId: "egv-29-01",
                systemTime: "2026-01-29T02:00:00Z",
                displayTime: "2026-01-28T18:00:00-08:00",
                transmitterTicks: 7200,
                value: 104,
                status: "normal",
                trend: "rising",
                trendRate: 0.2,
                unit: "mg/dL",
                rateUnit: "mg/dL/min",
                displayDevice: "iOS",
                transmitterGeneration: "g7",
                displayApp: "G7"
            },
            {
                recordId: "egv-29-02",
                systemTime: "2026-01-29T04:00:00Z",
                displayTime: "2026-01-28T20:00:00-08:00",
                transmitterTicks: 14400,
                value: 121,
                status: "normal",
                trend: "rising",
                trendRate: 0.4,
                unit: "mg/dL",
                rateUnit: "mg/dL/min",
                displayDevice: "iOS",
                transmitterGeneration: "g7",
                displayApp: "G7"
            },
            {
                recordId: "egv-29-03",
                systemTime: "2026-01-29T06:00:00Z",
                displayTime: "2026-01-28T22:00:00-08:00",
                transmitterTicks: 21600,
                value: 139,
                status: "normal",
                trend: "rising",
                trendRate: 0.3,
                unit: "mg/dL",
                rateUnit: "mg/dL/min",
                displayDevice: "iOS",
                transmitterGeneration: "g7",
                displayApp: "G7"
            },
            {
                recordId: "egv-29-04",
                systemTime: "2026-01-29T08:00:00Z",
                displayTime: "2026-01-29T00:00:00-08:00",
                transmitterTicks: 28800,
                value: 126,
                status: "normal",
                trend: "falling",
                trendRate: -0.2,
                unit: "mg/dL",
                rateUnit: "mg/dL/min",
                displayDevice: "iOS",
                transmitterGeneration: "g7",
                displayApp: "G7"
            },
            {
                recordId: "egv-29-05",
                systemTime: "2026-01-29T10:00:00Z",
                displayTime: "2026-01-29T02:00:00-08:00",
                transmitterTicks: 36000,
                value: 113,
                status: "normal",
                trend: "flat",
                trendRate: 0,
                unit: "mg/dL",
                rateUnit: "mg/dL/min",
                displayDevice: "iOS",
                transmitterGeneration: "g7",
                displayApp: "G7"
            },

            // Jan 28, 2026 (Z) - 6 records
            {
                recordId: "egv-28-00",
                systemTime: "2026-01-28T00:00:00Z",
                displayTime: "2026-01-27T16:00:00-08:00",
                transmitterTicks: 0,
                value: 88,
                status: "normal",
                trend: "flat",
                trendRate: 0,
                unit: "mg/dL",
                rateUnit: "mg/dL/min",
                displayDevice: "iOS",
                transmitterGeneration: "g7",
                displayApp: "G7"
            },
            {
                recordId: "egv-28-01",
                systemTime: "2026-01-28T02:00:00Z",
                displayTime: "2026-01-27T18:00:00-08:00",
                transmitterTicks: 7200,
                value: 97,
                status: "normal",
                trend: "rising",
                trendRate: 0.2,
                unit: "mg/dL",
                rateUnit: "mg/dL/min",
                displayDevice: "iOS",
                transmitterGeneration: "g7",
                displayApp: "G7"
            },
            {
                recordId: "egv-28-02",
                systemTime: "2026-01-28T04:00:00Z",
                displayTime: "2026-01-27T20:00:00-08:00",
                transmitterTicks: 14400,
                value: 116,
                status: "normal",
                trend: "rising",
                trendRate: 0.4,
                unit: "mg/dL",
                rateUnit: "mg/dL/min",
                displayDevice: "iOS",
                transmitterGeneration: "g7",
                displayApp: "G7"
            },
            {
                recordId: "egv-28-03",
                systemTime: "2026-01-28T06:00:00Z",
                displayTime: "2026-01-27T22:00:00-08:00",
                transmitterTicks: 21600,
                value: 130,
                status: "normal",
                trend: "rising",
                trendRate: 0.3,
                unit: "mg/dL",
                rateUnit: "mg/dL/min",
                displayDevice: "iOS",
                transmitterGeneration: "g7",
                displayApp: "G7"
            },
            {
                recordId: "egv-28-04",
                systemTime: "2026-01-28T08:00:00Z",
                displayTime: "2026-01-28T00:00:00-08:00",
                transmitterTicks: 28800,
                value: 114,
                status: "normal",
                trend: "falling",
                trendRate: -0.2,
                unit: "mg/dL",
                rateUnit: "mg/dL/min",
                displayDevice: "iOS",
                transmitterGeneration: "g7",
                displayApp: "G7"
            },
            {
                recordId: "egv-28-05",
                systemTime: "2026-01-28T10:00:00Z",
                displayTime: "2026-01-28T02:00:00-08:00",
                transmitterTicks: 36000,
                value: 102,
                status: "normal",
                trend: "flat",
                trendRate: 0,
                unit: "mg/dL",
                rateUnit: "mg/dL/min",
                displayDevice: "iOS",
                transmitterGeneration: "g7",
                displayApp: "G7"
            },
        ]
    };

    const useCase = Container.get<IngestDataUseCase>(TOKENS.IngestDataUseCase);

    try {
        const result = await useCase.execute({
            deviceId,
            manufacturerId,
            payload,
            payloadFormat,
            userId
        });

        console.log(result);
    } catch (error) {
        console.error(error);
    }
}

// heart rate data from apple health
const RunAppleHealthMockedData = async (userId: string, deviceId: string) => {
    const manufacturerId = 'apple_health';
    const payloadFormat = 'healthkit_v1';

    // Apple Health "HKQuantitySample"-like shape (heart rate)
    const payload = {
        type: "HKQuantityTypeIdentifierHeartRate",
        samples: [
            {
                recordId: "hr-00",
                startDate: "2026-01-30T10:00:00Z",
                endDate: "2026-01-30T10:00:05Z",
                value: 72,
                unit: "count/min",
                metadata: {
                    // common Apple metadata keys you might see in exports
                    HKWasUserEntered: false,
                    HKDevicePlacementSide: "unknown"
                },
                source: {
                    name: "Apple Watch",
                    bundleId: "com.apple.health"
                },
                device: {
                    model: "Apple Watch",
                    manufacturer: "Apple",
                    hardwareVersion: "Watch6,6",
                    softwareVersion: "10.2"
                }
            },
            {
                recordId: "hr-01",
                startDate: "2026-01-30T10:15:00Z",
                endDate: "2026-01-30T10:15:05Z",
                value: 78,
                unit: "count/min",
                metadata: {
                    HKWasUserEntered: false
                },
                source: {
                    name: "Apple Watch",
                    bundleId: "com.apple.health"
                },
                device: {
                    model: "Apple Watch",
                    manufacturer: "Apple",
                    hardwareVersion: "Watch6,6",
                    softwareVersion: "10.2"
                }
            },
            {
                recordId: "hr-02",
                startDate: "2026-01-30T10:30:00Z",
                endDate: "2026-01-30T10:30:05Z",
                value: 84,
                unit: "count/min",
                metadata: {
                    HKWasUserEntered: false
                },
                source: {
                    name: "Apple Watch",
                    bundleId: "com.apple.health"
                },
                device: {
                    model: "Apple Watch",
                    manufacturer: "Apple",
                    hardwareVersion: "Watch6,6",
                    softwareVersion: "10.2"
                }
            },

            // another day (Jan 29)
            {
                recordId: "hr-03",
                startDate: "2026-01-29T22:05:00Z",
                endDate: "2026-01-29T22:05:05Z",
                value: 65,
                unit: "count/min",
                metadata: {
                    HKWasUserEntered: false
                },
                source: {
                    name: "Apple Watch",
                    bundleId: "com.apple.health"
                },
                device: {
                    model: "Apple Watch",
                    manufacturer: "Apple",
                    hardwareVersion: "Watch6,6",
                    softwareVersion: "10.2"
                }
            },
            {
                recordId: "hr-04",
                startDate: "2026-01-29T22:20:00Z",
                endDate: "2026-01-29T22:20:05Z",
                value: 62,
                unit: "count/min",
                metadata: {
                    HKWasUserEntered: false
                },
                source: {
                    name: "Apple Watch",
                    bundleId: "com.apple.health"
                },
                device: {
                    model: "Apple Watch",
                    manufacturer: "Apple",
                    hardwareVersion: "Watch6,6",
                    softwareVersion: "10.2"
                }
            },

            // Jan 31 (post-sleep / morning)
            {
                recordId: "hr-05",
                startDate: "2026-01-31T12:10:00Z",
                endDate: "2026-01-31T12:10:05Z",
                value: 70,
                unit: "count/min",
                metadata: {
                    HKWasUserEntered: false
                },
                source: {
                    name: "Apple Watch",
                    bundleId: "com.apple.health"
                },
                device: {
                    model: "Apple Watch",
                    manufacturer: "Apple",
                    hardwareVersion: "Watch6,6",
                    softwareVersion: "10.2"
                }
            },
            {
                recordId: "hr-06",
                startDate: "2026-01-31T12:25:00Z",
                endDate: "2026-01-31T12:25:05Z",
                value: 90,
                unit: "count/min",
                metadata: {
                    HKWasUserEntered: false,
                    HKWorkoutType: "running"
                },
                source: {
                    name: "Apple Watch",
                    bundleId: "com.apple.health"
                },
                device: {
                    model: "Apple Watch",
                    manufacturer: "Apple",
                    hardwareVersion: "Watch6,6",
                    softwareVersion: "10.2"
                }
            },
            {
                recordId: "hr-07",
                startDate: "2026-01-31T12:40:00Z",
                endDate: "2026-01-31T12:40:05Z",
                value: 110,
                unit: "count/min",
                metadata: {
                    HKWasUserEntered: false,
                    HKWorkoutType: "running"
                },
                source: {
                    name: "Apple Watch",
                    bundleId: "com.apple.health"
                },
                device: {
                    model: "Apple Watch",
                    manufacturer: "Apple",
                    hardwareVersion: "Watch6,6",
                    softwareVersion: "10.2"
                }
            }
        ]
    };

    const useCase = Container.get<IngestDataUseCase>(TOKENS.IngestDataUseCase);

    try {
        const result = await useCase.execute({
            deviceId,
            manufacturerId,
            payload,
            payloadFormat,
            userId
        });

        console.log(result);
    } catch (error) {
        console.error(error);
    }
}

/**
 * Simulate data hitting the ingestion useCase
 * using mocked data
 */
const RunMockedIngestion = async () => {
    const userId = '5YmoLwcRX4ZML4TJey0gOmnfSPm1';
    const dexcomDeviceId = 'dexcom_DEXCOM_GCM_001';
    const appleDeviceId = 'apple_health_APPLE_WATCH_SE';

    await Promise.all([
        RunDexcomMockedData(userId, dexcomDeviceId),
        RunAppleHealthMockedData(userId, appleDeviceId),
    ]);
}

RunMockedIngestion();