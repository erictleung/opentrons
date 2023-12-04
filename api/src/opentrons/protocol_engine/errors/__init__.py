"""Protocol engine errors module."""

from .exceptions import (
    ProtocolEngineError,
    UnexpectedProtocolError,
    FailedToLoadPipetteError,
    PipetteNotAttachedError,
    InvalidSpecificationForRobotTypeError,
    InvalidLoadPipetteSpecsError,
    TipNotAttachedError,
    TipAttachedError,
    CommandDoesNotExistError,
    LabwareNotLoadedError,
    LabwareNotLoadedOnModuleError,
    LabwareNotLoadedOnLabwareError,
    LabwareNotOnDeckError,
    LiquidDoesNotExistError,
    LabwareDefinitionDoesNotExistError,
    LabwareCannotBeStackedError,
    LabwareIsInStackError,
    LabwareOffsetDoesNotExistError,
    LabwareIsNotTipRackError,
    LabwareIsTipRackError,
    LabwareIsAdapterError,
    TouchTipDisabledError,
    WellDoesNotExistError,
    PipetteNotLoadedError,
    ModuleNotLoadedError,
    ModuleNotOnDeckError,
    ModuleNotConnectedError,
    SlotDoesNotExistError,
    CutoutDoesNotExistError,
    FixtureDoesNotExistError,
    AddressableAreaDoesNotExistError,
    FixtureDoesNotProvideAreasError,
    AreaNotInDeckConfigurationError,
    IncompatibleAddressableAreaError,
    FailedToPlanMoveError,
    MustHomeError,
    RunStoppedError,
    SetupCommandNotAllowedError,
    ModuleNotAttachedError,
    ModuleAlreadyPresentError,
    WrongModuleTypeError,
    ThermocyclerNotOpenError,
    RobotDoorOpenError,
    PipetteMovementRestrictedByHeaterShakerError,
    HeaterShakerLabwareLatchNotOpenError,
    HeaterShakerLabwareLatchStatusUnknown,
    EngageHeightOutOfRangeError,
    NoTargetTemperatureSetError,
    InvalidTargetSpeedError,
    InvalidTargetTemperatureError,
    InvalidBlockVolumeError,
    InvalidHoldTimeError,
    CannotPerformModuleAction,
    PauseNotAllowedError,
    GripperNotAttachedError,
    CannotPerformGripperAction,
    HardwareNotSupportedError,
    LabwareMovementNotAllowedError,
    LabwareIsNotAllowedInLocationError,
    LocationIsOccupiedError,
    LocationNotAccessibleByPipetteError,
    LocationIsStagingSlotError,
    InvalidAxisForRobotType,
    NotSupportedOnRobotType,
)

from .error_occurrence import ErrorOccurrence, ProtocolCommandFailedError

__all__ = [
    # exceptions
    "ProtocolEngineError",
    "UnexpectedProtocolError",
    "FailedToLoadPipetteError",
    "PipetteNotAttachedError",
    "InvalidSpecificationForRobotTypeError",
    "InvalidLoadPipetteSpecsError",
    "TipNotAttachedError",
    "TipAttachedError",
    "CommandDoesNotExistError",
    "LabwareNotLoadedError",
    "LabwareNotLoadedOnModuleError",
    "LabwareNotLoadedOnLabwareError",
    "LabwareNotOnDeckError",
    "LiquidDoesNotExistError",
    "LabwareDefinitionDoesNotExistError",
    "LabwareCannotBeStackedError",
    "LabwareIsInStackError",
    "LabwareOffsetDoesNotExistError",
    "LabwareIsNotTipRackError",
    "LabwareIsTipRackError",
    "LabwareIsAdapterError",
    "TouchTipDisabledError",
    "WellDoesNotExistError",
    "PipetteNotLoadedError",
    "ModuleNotLoadedError",
    "ModuleNotOnDeckError",
    "ModuleNotConnectedError",
    "SlotDoesNotExistError",
    "CutoutDoesNotExistError",
    "FixtureDoesNotExistError",
    "AddressableAreaDoesNotExistError",
    "FixtureDoesNotProvideAreasError",
    "AreaNotInDeckConfigurationError",
    "IncompatibleAddressableAreaError",
    "FailedToPlanMoveError",
    "MustHomeError",
    "RunStoppedError",
    "SetupCommandNotAllowedError",
    "ModuleNotAttachedError",
    "ModuleAlreadyPresentError",
    "WrongModuleTypeError",
    "ThermocyclerNotOpenError",
    "RobotDoorOpenError",
    "PipetteMovementRestrictedByHeaterShakerError",
    "HeaterShakerLabwareLatchNotOpenError",
    "HeaterShakerLabwareLatchStatusUnknown",
    "EngageHeightOutOfRangeError",
    "NoTargetTemperatureSetError",
    "InvalidTargetTemperatureError",
    "InvalidTargetSpeedError",
    "InvalidBlockVolumeError",
    "InvalidHoldTimeError",
    "CannotPerformModuleAction",
    "PauseNotAllowedError",
    "ProtocolCommandFailedError",
    "GripperNotAttachedError",
    "CannotPerformGripperAction",
    "HardwareNotSupportedError",
    "LabwareMovementNotAllowedError",
    "LabwareIsNotAllowedInLocationError",
    "LocationIsOccupiedError",
    "LocationNotAccessibleByPipetteError",
    "LocationIsStagingSlotError",
    "InvalidAxisForRobotType",
    "NotSupportedOnRobotType",
    # error occurrence models
    "ErrorOccurrence",
]
