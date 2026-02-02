import { Token } from "typedi";

export const TOKENS = {
    // Repositories
    DeviceRepository: new Token("DeviceRepository"),
    ManufacturerRepository: new Token("ManufacturerRepository"),
    MetricRepository: new Token("MetricRepository"),
    MetricMappingRepository: new Token("MetricMappingRepository"),
    ObservationRepository: new Token("ObservationRepository"),
    DataStreamRepository: new Token("DataStreamRepository"),
    RawPayloadRepository: new Token("RawPayloadRepository"),
    DataStreamDailyRollupRepository: new Token("DataStreamDailyRollupRepository"),
    UserRepository: new Token("UserRepository"),
    DeviceAssignmentRepository: new Token("DeviceAssignmentRepository"),
    // UseCases
    NormalizePayloadUseCase: new Token("NormalizePayloadUseCase"),
    IngestNormalizedPayloadUseCase: new Token("IngestNormalizedPayloadUseCase"),
    IngestDataUseCase: new Token("IngestDataUseCase"),
    AssignDeviceToUserUseCase: new Token("AssignDeviceToUserUseCase"),
    CreateDeviceUseCase: new Token("CreateDeviceUseCase"),
    GetUserDevicesUseCase: new Token("GetUserDevicesUseCase"),
    GetAssignmentHistoryUseCase: new Token("GetAssignmentHistoryUseCase"),
    UnassignDeviceUseCase: new Token("UnassignDeviceUseCase"),
    GetUserRecentMetricsUseCase: new Token("GetUserRecentMetricsUseCase"),
    GetUserHistoricalMetricsUseCase: new Token("GetUserHistoricalMetricsUseCase"),
    GetUserAggregatedViewsUseCase: new Token("GetUserAggregatedViewsUseCase"),
} as const;