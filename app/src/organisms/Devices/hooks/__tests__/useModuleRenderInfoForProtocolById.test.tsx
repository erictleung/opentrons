import { renderHook } from '@testing-library/react'
import { when, resetAllWhenMocks } from 'jest-when'
import { UseQueryResult } from 'react-query'

import { STAGING_AREA_RIGHT_SLOT_FIXTURE } from '@opentrons/shared-data'
import _heaterShakerCommandsWithResultsKey from '@opentrons/shared-data/protocol/fixtures/6/heaterShakerCommandsWithResultsKey.json'
import { useMostRecentCompletedAnalysis } from '../../../LabwarePositionCheck/useMostRecentCompletedAnalysis'
import { useDeckConfigurationQuery } from '@opentrons/react-api-client/src/deck_configuration'

import { getProtocolModulesInfo } from '../../ProtocolRun/utils/getProtocolModulesInfo'

import {
  mockMagneticModuleGen2,
  mockTemperatureModuleGen2,
  mockThermocycler,
} from '../../../../redux/modules/__fixtures__'
import {
  useAttachedModules,
  useModuleRenderInfoForProtocolById,
  useStoredProtocolAnalysis,
} from '..'

import type {
  CutoutConfig,
  DeckConfiguration,
  ModuleModel,
  ModuleType,
  ProtocolAnalysisOutput,
} from '@opentrons/shared-data'

jest.mock('@opentrons/react-api-client/src/deck_configuration')
jest.mock('../../ProtocolRun/utils/getProtocolModulesInfo')
jest.mock('../useAttachedModules')
jest.mock('../useProtocolDetailsForRun')
jest.mock('../useStoredProtocolAnalysis')
jest.mock('../../../LabwarePositionCheck/useMostRecentCompletedAnalysis')

const mockGetProtocolModulesInfo = getProtocolModulesInfo as jest.MockedFunction<
  typeof getProtocolModulesInfo
>
const mockUseAttachedModules = useAttachedModules as jest.MockedFunction<
  typeof useAttachedModules
>
const mockUseStoredProtocolAnalysis = useStoredProtocolAnalysis as jest.MockedFunction<
  typeof useStoredProtocolAnalysis
>
const mockUseMostRecentCompletedAnalysis = useMostRecentCompletedAnalysis as jest.MockedFunction<
  typeof useMostRecentCompletedAnalysis
>
const mockUseDeckConfigurationQuery = useDeckConfigurationQuery as jest.MockedFunction<
  typeof useDeckConfigurationQuery
>
const heaterShakerCommandsWithResultsKey = (_heaterShakerCommandsWithResultsKey as unknown) as ProtocolAnalysisOutput

const PROTOCOL_DETAILS = {
  displayName: 'fake protocol',
  protocolData: {
    ...heaterShakerCommandsWithResultsKey,
    labware: [
      {
        displayName: 'Trash',
        definitionId: 'opentrons/opentrons_1_trash_3200ml_fixed/1',
      },
    ],
  },
  protocolKey: 'fakeProtocolKey',
}

const mockMagneticModuleDefinition = {
  moduleId: 'someMagneticModule',
  model: 'magneticModuleV2' as ModuleModel,
  type: 'magneticModuleType' as ModuleType,
  labwareOffset: { x: 5, y: 5, z: 5 },
  cornerOffsetFromSlot: { x: 1, y: 1, z: 1 },
  dimensions: {
    xDimension: 100,
    yDimension: 100,
    footprintXDimension: 50,
    footprintYDimension: 50,
    labwareInterfaceXDimension: 80,
    labwareInterfaceYDimension: 120,
  },
  twoDimensionalRendering: { children: [] },
}

const mockTemperatureModuleDefinition = {
  moduleId: 'someMagneticModule',
  model: 'temperatureModuleV2' as ModuleModel,
  type: 'temperatureModuleType' as ModuleType,
  labwareOffset: { x: 5, y: 5, z: 5 },
  cornerOffsetFromSlot: { x: 1, y: 1, z: 1 },
  dimensions: {
    xDimension: 100,
    yDimension: 100,
    footprintXDimension: 50,
    footprintYDimension: 50,
    labwareInterfaceXDimension: 80,
    labwareInterfaceYDimension: 120,
  },
  twoDimensionalRendering: { children: [] },
}

const MAGNETIC_MODULE_INFO = {
  moduleId: 'magneticModuleId',
  x: 0,
  y: 0,
  z: 0,
  moduleDef: mockMagneticModuleDefinition as any,
  nestedLabwareDef: null,
  nestedLabwareId: null,
  nestedLabwareDisplayName: null,
  protocolLoadOrder: 0,
  slotName: 'D1',
}

const TEMPERATURE_MODULE_INFO = {
  moduleId: 'temperatureModuleId',
  x: 0,
  y: 0,
  z: 0,
  moduleDef: mockTemperatureModuleDefinition,
  nestedLabwareDef: null,
  nestedLabwareId: null,
  nestedLabwareDisplayName: null,
  protocolLoadOrder: 0,
  slotName: 'D1',
}

const mockCutoutConfig: CutoutConfig = {
  cutoutId: 'cutoutD1',
  cutoutFixtureId: STAGING_AREA_RIGHT_SLOT_FIXTURE,
}

describe('useModuleRenderInfoForProtocolById hook', () => {
  beforeEach(() => {
    when(mockUseDeckConfigurationQuery).mockReturnValue({
      data: [mockCutoutConfig],
    } as UseQueryResult<DeckConfiguration>)
    when(mockUseAttachedModules)
      .calledWith()
      .mockReturnValue([
        mockMagneticModuleGen2,
        mockTemperatureModuleGen2,
        mockThermocycler,
      ])
    when(mockUseStoredProtocolAnalysis)
      .calledWith('1')
      .mockReturnValue((PROTOCOL_DETAILS as unknown) as ProtocolAnalysisOutput)
    when(mockUseMostRecentCompletedAnalysis)
      .calledWith('1')
      .mockReturnValue(PROTOCOL_DETAILS.protocolData as any)
    mockGetProtocolModulesInfo.mockReturnValue([
      TEMPERATURE_MODULE_INFO,
      MAGNETIC_MODULE_INFO,
    ])
  })

  afterEach(() => {
    resetAllWhenMocks()
  })
  it('should return no module render info when protocol details not found', () => {
    when(mockUseMostRecentCompletedAnalysis)
      .calledWith('1')
      .mockReturnValue(null)
    when(mockUseStoredProtocolAnalysis).calledWith('1').mockReturnValue(null)
    const { result } = renderHook(() => useModuleRenderInfoForProtocolById('1'))
    expect(result.current).toStrictEqual({})
  })
  it('should return module render info', () => {
    const { result } = renderHook(() => useModuleRenderInfoForProtocolById('1'))
    expect(result.current).toStrictEqual({
      magneticModuleId: {
        conflictedFixture: mockCutoutConfig,
        attachedModuleMatch: mockMagneticModuleGen2,
        ...MAGNETIC_MODULE_INFO,
      },
      temperatureModuleId: {
        conflictedFixture: mockCutoutConfig,
        attachedModuleMatch: mockTemperatureModuleGen2,
        ...TEMPERATURE_MODULE_INFO,
      },
    })
  })
})
