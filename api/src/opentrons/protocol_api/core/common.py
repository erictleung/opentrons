"""Common APIs for protocol core interfaces."""

# TODO(mc, 2022-08-22): move to __init__ when dependency cycles are resolved
from .instrument import AbstractInstrument
from .labware import AbstractLabware
from .module import (
    AbstractModuleCore,
    AbstractTemperatureModuleCore,
    AbstractMagneticModuleCore,
    AbstractThermocyclerCore,
    AbstractHeaterShakerCore,
    AbstractMagneticBlockCore,
)
from .protocol import AbstractProtocol
from .well import AbstractWellCore


WellCore = AbstractWellCore
LabwareCore = AbstractLabware[WellCore]
InstrumentCore = AbstractInstrument[WellCore]
ModuleCore = AbstractModuleCore
TemperatureModuleCore = AbstractTemperatureModuleCore
MagneticModuleCore = AbstractMagneticModuleCore
ThermocyclerCore = AbstractThermocyclerCore
HeaterShakerCore = AbstractHeaterShakerCore
MagneticBlockCore = AbstractMagneticBlockCore
ProtocolCore = AbstractProtocol[InstrumentCore, LabwareCore, ModuleCore]
