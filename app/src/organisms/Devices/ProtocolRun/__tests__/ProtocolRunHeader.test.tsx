import * as React from 'react'
import { BrowserRouter } from 'react-router-dom'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { when, resetAllWhenMocks } from 'jest-when'
import {
  RUN_STATUS_IDLE,
  RUN_STATUS_RUNNING,
  RUN_STATUS_PAUSED,
  RUN_STATUS_PAUSE_REQUESTED,
  RUN_STATUS_STOP_REQUESTED,
  RUN_STATUS_STOPPED,
  RUN_STATUS_FAILED,
  RUN_STATUS_SUCCEEDED,
  RUN_STATUS_BLOCKED_BY_OPEN_DOOR,
  instrumentsResponseLeftPipetteFixture,
  instrumentsResponseRightPipetteFixture,
} from '@opentrons/api-client'
import { renderWithProviders } from '@opentrons/components'
import {
  useHost,
  useRunQuery,
  useModulesQuery,
  usePipettesQuery,
  useDismissCurrentRunMutation,
  useEstopQuery,
  useDoorQuery,
  useInstrumentsQuery,
} from '@opentrons/react-api-client'
import {
  getPipetteModelSpecs,
  STAGING_AREA_SLOT_WITH_WASTE_CHUTE_RIGHT_ADAPTER_NO_COVER_FIXTURE,
} from '@opentrons/shared-data'
import _uncastedSimpleV6Protocol from '@opentrons/shared-data/protocol/fixtures/6/simpleV6.json'
import noModulesProtocol from '@opentrons/shared-data/protocol/fixtures/4/simpleV4.json'

import { i18n } from '../../../../i18n'
import {
  useCloseCurrentRun,
  useCurrentRunId,
} from '../../../../organisms/ProtocolUpload/hooks'
import { ConfirmCancelModal } from '../../../../organisms/RunDetails/ConfirmCancelModal'
import {
  useRunTimestamps,
  useRunControls,
  useRunStatus,
} from '../../../../organisms/RunTimeControl/hooks'
import {
  mockFailedRun,
  mockIdleUnstartedRun,
  mockPausedRun,
  mockPauseRequestedRun,
  mockRunningRun,
  mockStoppedRun,
  mockStopRequestedRun,
  mockSucceededRun,
} from '../../../../organisms/RunTimeControl/__fixtures__'
import { mockHeaterShaker } from '../../../../redux/modules/__fixtures__'
import {
  useTrackEvent,
  ANALYTICS_PROTOCOL_PROCEED_TO_RUN,
  ANALYTICS_PROTOCOL_RUN_AGAIN,
  ANALYTICS_PROTOCOL_RUN_FINISH,
  ANALYTICS_PROTOCOL_RUN_PAUSE,
  ANALYTICS_PROTOCOL_RUN_START,
  ANALYTICS_PROTOCOL_RUN_RESUME,
} from '../../../../redux/analytics'
import { getRobotUpdateDisplayInfo } from '../../../../redux/robot-update'
import { getIsHeaterShakerAttached } from '../../../../redux/config'
import { getRobotSettings } from '../../../../redux/robot-settings'

import {
  useProtocolDetailsForRun,
  useProtocolAnalysisErrors,
  useTrackProtocolRunEvent,
  useRunCalibrationStatus,
  useRunCreatedAtTimestamp,
  useModuleCalibrationStatus,
  useUnmatchedModulesForProtocol,
  useIsRobotViewable,
  useIsFlex,
} from '../../hooks'
import { useIsHeaterShakerInProtocol } from '../../../ModuleCard/hooks'
import { ConfirmAttachmentModal } from '../../../ModuleCard/ConfirmAttachmentModal'
import { RunProgressMeter } from '../../../RunProgressMeter'
import { formatTimestamp } from '../../utils'
import { ProtocolRunHeader } from '../ProtocolRunHeader'
import { HeaterShakerIsRunningModal } from '../../HeaterShakerIsRunningModal'
import { RunFailedModal } from '../RunFailedModal'
import { DISENGAGED, NOT_PRESENT } from '../../../EmergencyStop'
import { getPipettesWithTipAttached } from '../../../DropTipWizard/getPipettesWithTipAttached'
import { getIsFixtureMismatch } from '../../../../resources/deck_configuration/utils'
import { useDeckConfigurationCompatibility } from '../../../../resources/deck_configuration/hooks'
import { useMostRecentCompletedAnalysis } from '../../../LabwarePositionCheck/useMostRecentCompletedAnalysis'
import { useMostRecentRunId } from '../../../ProtocolUpload/hooks/useMostRecentRunId'

import type { UseQueryResult } from 'react-query'
import type { Run } from '@opentrons/api-client'
import type { CompletedProtocolAnalysis } from '@opentrons/shared-data'

const mockPush = jest.fn()

jest.mock('react-router-dom', () => {
  const reactRouterDom = jest.requireActual('react-router-dom')
  return {
    ...reactRouterDom,
    useHistory: () => ({ push: mockPush } as any),
  }
})
jest.mock('@opentrons/components', () => {
  const actualComponents = jest.requireActual('@opentrons/components')
  return {
    ...actualComponents,
    Tooltip: jest.fn(({ children }) => <div>{children}</div>),
  }
})
jest.mock('@opentrons/react-api-client')
jest.mock('@opentrons/shared-data', () => ({
  getAllPipetteNames: jest.fn(
    jest.requireActual('@opentrons/shared-data').getAllPipetteNames
  ),
  getPipetteNameSpecs: jest.fn(
    jest.requireActual('@opentrons/shared-data').getPipetteNameSpecs
  ),
  getPipetteModelSpecs: jest.fn(),
}))
jest.mock('../../../../organisms/ProtocolUpload/hooks')
jest.mock('../../../../organisms/RunDetails/ConfirmCancelModal')
jest.mock('../../../../organisms/RunTimeControl/hooks')
jest.mock('../../hooks')
jest.mock('../../HeaterShakerIsRunningModal')
jest.mock('../../../ModuleCard/ConfirmAttachmentModal')
jest.mock('../../../ModuleCard/hooks')
jest.mock('../../../RunProgressMeter')
jest.mock('../../../../redux/analytics')
jest.mock('../../../../redux/config')
jest.mock('../RunFailedModal')
jest.mock('../../../../redux/robot-update/selectors')
jest.mock('../../../../redux/robot-settings/selectors')
jest.mock('../../../DropTipWizard/getPipettesWithTipAttached')
jest.mock('../../../../resources/deck_configuration/utils')
jest.mock('../../../../resources/deck_configuration/hooks')
jest.mock('../../../LabwarePositionCheck/useMostRecentCompletedAnalysis')
jest.mock('../../../ProtocolUpload/hooks/useMostRecentRunId')

const mockGetIsHeaterShakerAttached = getIsHeaterShakerAttached as jest.MockedFunction<
  typeof getIsHeaterShakerAttached
>
const mockUseCurrentRunId = useCurrentRunId as jest.MockedFunction<
  typeof useCurrentRunId
>
const mockUseCloseCurrentRun = useCloseCurrentRun as jest.MockedFunction<
  typeof useCloseCurrentRun
>
const mockUseRunTimestamps = useRunTimestamps as jest.MockedFunction<
  typeof useRunTimestamps
>
const mockUseRunControls = useRunControls as jest.MockedFunction<
  typeof useRunControls
>
const mockUseRunStatus = useRunStatus as jest.MockedFunction<
  typeof useRunStatus
>
const mockUseProtocolDetailsForRun = useProtocolDetailsForRun as jest.MockedFunction<
  typeof useProtocolDetailsForRun
>
const mockUseTrackProtocolRunEvent = useTrackProtocolRunEvent as jest.MockedFunction<
  typeof useTrackProtocolRunEvent
>
const mockUseProtocolAnalysisErrors = useProtocolAnalysisErrors as jest.MockedFunction<
  typeof useProtocolAnalysisErrors
>
const mockUseRunQuery = useRunQuery as jest.MockedFunction<typeof useRunQuery>
const mockUseUnmatchedModulesForProtocol = useUnmatchedModulesForProtocol as jest.MockedFunction<
  typeof useUnmatchedModulesForProtocol
>
const mockUseRunCalibrationStatus = useRunCalibrationStatus as jest.MockedFunction<
  typeof useRunCalibrationStatus
>
const mockUseModuleCalibrationStatus = useModuleCalibrationStatus as jest.MockedFunction<
  typeof useModuleCalibrationStatus
>
const mockUseRunCreatedAtTimestamp = useRunCreatedAtTimestamp as jest.MockedFunction<
  typeof useRunCreatedAtTimestamp
>
const mockUseModulesQuery = useModulesQuery as jest.MockedFunction<
  typeof useModulesQuery
>
const mockUsePipettesQuery = usePipettesQuery as jest.MockedFunction<
  typeof usePipettesQuery
>
const mockConfirmCancelModal = ConfirmCancelModal as jest.MockedFunction<
  typeof ConfirmCancelModal
>
const mockUseDismissCurrentRunMutation = useDismissCurrentRunMutation as jest.MockedFunction<
  typeof useDismissCurrentRunMutation
>
const mockHeaterShakerIsRunningModal = HeaterShakerIsRunningModal as jest.MockedFunction<
  typeof HeaterShakerIsRunningModal
>
const mockUseIsHeaterShakerInProtocol = useIsHeaterShakerInProtocol as jest.MockedFunction<
  typeof useIsHeaterShakerInProtocol
>
const mockConfirmAttachmentModal = ConfirmAttachmentModal as jest.MockedFunction<
  typeof ConfirmAttachmentModal
>
const mockRunProgressMeter = RunProgressMeter as jest.MockedFunction<
  typeof RunProgressMeter
>
const mockUseTrackEvent = useTrackEvent as jest.MockedFunction<
  typeof useTrackEvent
>
const mockUseIsRobotViewable = useIsRobotViewable as jest.MockedFunction<
  typeof useIsRobotViewable
>
const mockGetBuildrootUpdateDisplayInfo = getRobotUpdateDisplayInfo as jest.MockedFunction<
  typeof getRobotUpdateDisplayInfo
>
const mockRunFailedModal = RunFailedModal as jest.MockedFunction<
  typeof RunFailedModal
>
const mockUseEstopQuery = useEstopQuery as jest.MockedFunction<
  typeof useEstopQuery
>
const mockUseIsFlex = useIsFlex as jest.MockedFunction<typeof useIsFlex>
const mockUseDoorQuery = useDoorQuery as jest.MockedFunction<
  typeof useDoorQuery
>
const mockGetRobotSettings = getRobotSettings as jest.MockedFunction<
  typeof getRobotSettings
>
const mockUseInstrumentsQuery = useInstrumentsQuery as jest.MockedFunction<
  typeof useInstrumentsQuery
>
const mockUseHost = useHost as jest.MockedFunction<typeof useHost>
const mockGetPipettesWithTipAttached = getPipettesWithTipAttached as jest.MockedFunction<
  typeof getPipettesWithTipAttached
>
const mockGetPipetteModelSpecs = getPipetteModelSpecs as jest.MockedFunction<
  typeof getPipetteModelSpecs
>
const mockGetIsFixtureMismatch = getIsFixtureMismatch as jest.MockedFunction<
  typeof getIsFixtureMismatch
>
const mockUseDeckConfigurationCompatibility = useDeckConfigurationCompatibility as jest.MockedFunction<
  typeof useDeckConfigurationCompatibility
>
const mockUseMostRecentCompletedAnalysis = useMostRecentCompletedAnalysis as jest.MockedFunction<
  typeof useMostRecentCompletedAnalysis
>
const mockUseMostRecentRunId = useMostRecentRunId as jest.MockedFunction<
  typeof useMostRecentRunId
>

const ROBOT_NAME = 'otie'
const RUN_ID = '95e67900-bc9f-4fbf-92c6-cc4d7226a51b'
const CREATED_AT = '03/03/2022 19:08:49'
const STARTED_AT = '2022-03-03T19:09:40.620530+00:00'
const COMPLETED_AT = '2022-03-03T19:39:53.620530+00:00'
const PROTOCOL_NAME = 'A Protocol for Otie'
const mockSettings = {
  id: 'enableDoorSafetySwitch',
  title: 'Enable Door Safety Switch',
  description: '',
  value: true,
  restart_required: false,
}
const MOCK_ROTOCOL_LIQUID_KEY = { liquids: [] }

const simpleV6Protocol = (_uncastedSimpleV6Protocol as unknown) as CompletedProtocolAnalysis

const PROTOCOL_DETAILS = {
  displayName: PROTOCOL_NAME,
  protocolData: simpleV6Protocol,
  protocolKey: 'fakeProtocolKey',
  isProtocolAnalyzing: false,
  robotType: 'OT-2 Standard' as const,
}

const mockMovingHeaterShaker = {
  id: 'heatershaker_id',
  moduleModel: 'heaterShakerModuleV1',
  moduleType: 'heaterShakerModuleType',
  serialNumber: 'jkl123',
  hardwareRevision: 'heatershaker_v4.0',
  firmwareVersion: 'v2.0.0',
  hasAvailableUpdate: true,
  data: {
    labwareLatchStatus: 'idle_closed',
    speedStatus: 'speeding up',
    temperatureStatus: 'idle',
    currentSpeed: null,
    currentTemperature: null,
    targetSpeed: null,
    targetTemp: null,
    errorDetails: null,
    status: 'idle',
  },
  usbPort: { path: '/dev/ot_module_heatershaker0', port: 1 },
} as any

const mockEstopStatus = {
  data: {
    status: DISENGAGED,
    leftEstopPhysicalStatus: DISENGAGED,
    rightEstopPhysicalStatus: NOT_PRESENT,
  },
}
const mockDoorStatus = {
  data: {
    status: 'closed',
    doorRequiredClosedForProtocol: true,
  },
}

const render = () => {
  return renderWithProviders(
    <BrowserRouter>
      <ProtocolRunHeader
        protocolRunHeaderRef={null}
        robotName={ROBOT_NAME}
        runId={RUN_ID}
        makeHandleJumpToStep={jest.fn(() => jest.fn())}
      />
    </BrowserRouter>,
    { i18nInstance: i18n }
  )
}
let mockTrackEvent: jest.Mock
let mockTrackProtocolRunEvent: jest.Mock
let mockCloseCurrentRun: jest.Mock

describe('ProtocolRunHeader', () => {
  beforeEach(() => {
    mockTrackEvent = jest.fn()
    mockTrackProtocolRunEvent = jest.fn(
      () => new Promise(resolve => resolve({}))
    )
    mockCloseCurrentRun = jest.fn()

    mockUseTrackEvent.mockReturnValue(mockTrackEvent)
    mockConfirmCancelModal.mockReturnValue(<div>Mock ConfirmCancelModal</div>)
    mockRunProgressMeter.mockReturnValue(<div>Mock RunProgressMeter</div>)
    mockHeaterShakerIsRunningModal.mockReturnValue(
      <div>Mock HeaterShakerIsRunningModal</div>
    )
    mockUseModulesQuery.mockReturnValue({
      data: { data: [] },
    } as any)
    mockUsePipettesQuery.mockReturnValue({
      data: {
        data: {
          left: null,
          right: null,
        },
      },
    } as any)
    mockGetIsHeaterShakerAttached.mockReturnValue(false)
    mockUseIsRobotViewable.mockReturnValue(true)
    mockConfirmAttachmentModal.mockReturnValue(
      <div>mock confirm attachment modal</div>
    )
    when(mockUseProtocolAnalysisErrors).calledWith(RUN_ID).mockReturnValue({
      analysisErrors: null,
    })
    mockUseIsHeaterShakerInProtocol.mockReturnValue(false)
    mockGetBuildrootUpdateDisplayInfo.mockReturnValue({
      autoUpdateAction: 'reinstall',
      autoUpdateDisabledReason: null,
      updateFromFileDisabledReason: null,
    })
    when(mockUseCurrentRunId).calledWith().mockReturnValue(RUN_ID)
    when(mockUseCloseCurrentRun).calledWith().mockReturnValue({
      isClosingCurrentRun: false,
      closeCurrentRun: mockCloseCurrentRun,
    })
    when(mockUseRunControls)
      .calledWith(RUN_ID, expect.anything())
      .mockReturnValue({
        play: () => {},
        pause: () => {},
        stop: () => {},
        reset: () => {},
        isPlayRunActionLoading: false,
        isPauseRunActionLoading: false,
        isStopRunActionLoading: false,
        isResetRunLoading: false,
      })
    when(mockUseRunStatus).calledWith(RUN_ID).mockReturnValue(RUN_STATUS_IDLE)
    when(mockUseRunTimestamps).calledWith(RUN_ID).mockReturnValue({
      startedAt: STARTED_AT,
      pausedAt: null,
      stoppedAt: null,
      completedAt: null,
    })
    when(mockUseRunCreatedAtTimestamp)
      .calledWith(RUN_ID)
      .mockReturnValue(CREATED_AT)
    when(mockUseRunQuery)
      .calledWith(RUN_ID, { staleTime: Infinity })
      .mockReturnValue({
        data: { data: mockIdleUnstartedRun },
      } as UseQueryResult<Run>)
    when(mockUseProtocolDetailsForRun)
      .calledWith(RUN_ID)
      .mockReturnValue(PROTOCOL_DETAILS)
    when(mockUseTrackProtocolRunEvent).calledWith(RUN_ID).mockReturnValue({
      trackProtocolRunEvent: mockTrackProtocolRunEvent,
    })
    when(mockUseDismissCurrentRunMutation)
      .calledWith()
      .mockReturnValue({
        dismissCurrentRun: jest.fn(),
      } as any)
    when(mockUseUnmatchedModulesForProtocol)
      .calledWith(ROBOT_NAME, RUN_ID)
      .mockReturnValue({ missingModuleIds: [], remainingAttachedModules: [] })
    when(mockUseRunCalibrationStatus)
      .calledWith(ROBOT_NAME, RUN_ID)
      .mockReturnValue({ complete: true })
    when(mockUseIsFlex).calledWith(ROBOT_NAME).mockReturnValue(true)
    when(mockUseModuleCalibrationStatus)
      .calledWith(ROBOT_NAME, RUN_ID)
      .mockReturnValue({ complete: true })
    mockRunFailedModal.mockReturnValue(<div>mock RunFailedModal</div>)
    mockUseEstopQuery.mockReturnValue({ data: mockEstopStatus } as any)
    mockUseDoorQuery.mockReturnValue({ data: mockDoorStatus } as any)
    mockGetRobotSettings.mockReturnValue([mockSettings])
    mockUseInstrumentsQuery.mockReturnValue({ data: {} } as any)
    mockUseHost.mockReturnValue({} as any)
    mockGetPipettesWithTipAttached.mockReturnValue(
      Promise.resolve([
        instrumentsResponseLeftPipetteFixture,
        instrumentsResponseRightPipetteFixture,
      ]) as any
    )
    mockGetPipetteModelSpecs.mockReturnValue('p10_single_v1' as any)
    when(mockUseMostRecentCompletedAnalysis)
      .calledWith(RUN_ID)
      .mockReturnValue({
        ...noModulesProtocol,
        ...MOCK_ROTOCOL_LIQUID_KEY,
      } as any)
    mockUseDeckConfigurationCompatibility.mockReturnValue([])
    when(mockGetIsFixtureMismatch).mockReturnValue(false)
    when(mockUseMostRecentRunId).mockReturnValue(RUN_ID)
  })

  afterEach(() => {
    resetAllWhenMocks()
    jest.restoreAllMocks()
  })

  it('renders a protocol name, run record id, status, and run time', () => {
    render()

    screen.getByText('A Protocol for Otie')
    screen.getByText('Run')
    screen.getByText('03/03/2022 19:08:49')
    screen.getByText('Status')
    screen.getByText('Not started')
    screen.getByText('Run Time')
  })

  it('links to a protocol details page', () => {
    render()

    const protocolNameLink = screen.getByRole('link', {
      name: 'A Protocol for Otie',
    })
    expect(protocolNameLink.getAttribute('href')).toBe(
      `/protocols/${PROTOCOL_DETAILS.protocolKey}`
    )
  })

  it('does not render link to protocol detail page if protocol key is absent', () => {
    when(mockUseProtocolDetailsForRun)
      .calledWith(RUN_ID)
      .mockReturnValue({ ...PROTOCOL_DETAILS, protocolKey: null })
    render()

    expect(
      screen.queryByRole('link', { name: 'A Protocol for Otie' })
    ).toBeNull()
  })

  it('renders a disabled "Analyzing on robot" button if robot-side analysis is not complete', () => {
    when(mockUseProtocolDetailsForRun).calledWith(RUN_ID).mockReturnValue({
      displayName: null,
      protocolData: null,
      protocolKey: null,
      isProtocolAnalyzing: true,
      robotType: 'OT-2 Standard',
    })

    render()

    const button = screen.getByRole('button', { name: 'Analyzing on robot' })
    expect(button).toBeDisabled()
  })

  it('renders a start run button and cancel run button when run is ready to start', () => {
    render()

    screen.getByRole('button', { name: 'Start run' })
    screen.queryByText(formatTimestamp(STARTED_AT))
    screen.queryByText('Protocol start')
    screen.queryByText('Protocol end')
    fireEvent.click(screen.getByRole('button', { name: 'Cancel run' }))
    screen.getByText('Mock ConfirmCancelModal')
    screen.getByText('Mock RunProgressMeter')
  })

  it('calls trackProtocolRunEvent when start run button clicked', () => {
    render()

    const button = screen.getByRole('button', { name: 'Start run' })
    fireEvent.click(button)
    expect(mockTrackProtocolRunEvent).toBeCalledTimes(1)
    expect(mockTrackProtocolRunEvent).toBeCalledWith({
      name: ANALYTICS_PROTOCOL_RUN_START,
      properties: {},
    })
  })

  it('dismisses a current but canceled run and calls trackProtocolRunEvent', () => {
    when(mockUseRunStatus)
      .calledWith(RUN_ID)
      .mockReturnValue(RUN_STATUS_STOPPED)
    when(mockUseRunQuery)
      .calledWith(RUN_ID)
      .mockReturnValue({
        data: { data: { ...mockIdleUnstartedRun, current: true } },
      } as UseQueryResult<Run>)
    render()
    expect(mockCloseCurrentRun).toBeCalled()
    expect(mockTrackProtocolRunEvent).toBeCalled()
    expect(mockTrackProtocolRunEvent).toBeCalledWith({
      name: ANALYTICS_PROTOCOL_RUN_FINISH,
      properties: {},
    })
  })

  it('disables the Start Run button with tooltip if calibration is incomplete', () => {
    when(mockUseRunCalibrationStatus)
      .calledWith(ROBOT_NAME, RUN_ID)
      .mockReturnValue({ complete: false })

    render()

    const button = screen.getByRole('button', { name: 'Start run' })
    expect(button).toBeDisabled()
    screen.getByText('Complete required steps in Setup tab')
  })

  it('disables the Start Run button with tooltip if a module is missing', () => {
    when(mockUseUnmatchedModulesForProtocol)
      .calledWith(ROBOT_NAME, RUN_ID)
      .mockReturnValue({
        missingModuleIds: ['temperatureModuleV1'],
        remainingAttachedModules: [],
      })

    render()
    const button = screen.getByRole('button', { name: 'Start run' })
    expect(button).toBeDisabled()
    screen.getByText('Complete required steps in Setup tab')
  })

  it('disables the Start Run button with tooltip if robot software update is available', () => {
    mockGetBuildrootUpdateDisplayInfo.mockReturnValue({
      autoUpdateAction: 'upgrade',
      autoUpdateDisabledReason: null,
      updateFromFileDisabledReason: null,
    })

    render()
    const button = screen.getByRole('button', { name: 'Start run' })
    expect(button).toBeDisabled()
    screen.getByText(
      'A software update is available for this robot. Update to run protocols.'
    )
  })

  it('disables the Start Run button when a fixture is not configured or conflicted', () => {
    mockUseDeckConfigurationCompatibility.mockReturnValue([
      {
        cutoutId: 'cutoutA1',
        cutoutFixtureId: STAGING_AREA_SLOT_WITH_WASTE_CHUTE_RIGHT_ADAPTER_NO_COVER_FIXTURE,
        requiredAddressableAreas: ['D4'],
        compatibleCutoutFixtureIds: [
          STAGING_AREA_SLOT_WITH_WASTE_CHUTE_RIGHT_ADAPTER_NO_COVER_FIXTURE,
        ],
        missingLabwareDisplayName: null,
      },
    ])
    when(mockGetIsFixtureMismatch).mockReturnValue(true)
    render()
    const button = screen.getByRole('button', { name: 'Start run' })
    expect(button).toBeDisabled()
  })

  it('renders a pause run button, start time, and end time when run is running, and calls trackProtocolRunEvent when button clicked', () => {
    when(mockUseRunQuery)
      .calledWith(RUN_ID)
      .mockReturnValue({
        data: { data: mockRunningRun },
      } as UseQueryResult<Run>)
    when(mockUseRunStatus)
      .calledWith(RUN_ID)
      .mockReturnValue(RUN_STATUS_RUNNING)
    render()

    const button = screen.getByRole('button', { name: 'Pause run' })
    screen.getByText(formatTimestamp(STARTED_AT))
    screen.getByText('Protocol start')
    screen.getByText('Protocol end')
    fireEvent.click(button)
    expect(mockTrackProtocolRunEvent).toBeCalledWith({
      name: ANALYTICS_PROTOCOL_RUN_PAUSE,
    })
  })

  it('renders a cancel run button when running and shows a confirm cancel modal when clicked', () => {
    when(mockUseRunQuery)
      .calledWith(RUN_ID)
      .mockReturnValue({
        data: { data: mockRunningRun },
      } as UseQueryResult<Run>)
    when(mockUseRunStatus)
      .calledWith(RUN_ID)
      .mockReturnValue(RUN_STATUS_RUNNING)
    render()

    expect(screen.queryByText('Mock ConfirmCancelModal')).toBeFalsy()
    const cancelButton = screen.getByText('Cancel run')
    fireEvent.click(cancelButton)
    screen.getByText('Mock ConfirmCancelModal')
  })

  it('renders a Resume Run button and Cancel Run button when paused and call trackProtocolRunEvent when resume button clicked', () => {
    when(mockUseRunQuery)
      .calledWith(RUN_ID)
      .mockReturnValue({
        data: { data: mockPausedRun },
      } as UseQueryResult<Run>)
    when(mockUseRunStatus).calledWith(RUN_ID).mockReturnValue(RUN_STATUS_PAUSED)

    render()

    const button = screen.getByRole('button', { name: 'Resume run' })
    screen.getByRole('button', { name: 'Cancel run' })
    screen.getByText('Paused')
    fireEvent.click(button)
    expect(mockTrackProtocolRunEvent).toBeCalledWith({
      name: ANALYTICS_PROTOCOL_RUN_RESUME,
      properties: {},
    })
  })

  it('renders a disabled Resume Run button and when pause requested', () => {
    when(mockUseRunQuery)
      .calledWith(RUN_ID)
      .mockReturnValue({
        data: { data: mockPauseRequestedRun },
      } as UseQueryResult<Run>)
    when(mockUseRunStatus)
      .calledWith(RUN_ID)
      .mockReturnValue(RUN_STATUS_PAUSE_REQUESTED)

    render()

    const button = screen.getByRole('button', { name: 'Resume run' })
    expect(button).toBeDisabled()
    screen.getByRole('button', { name: 'Cancel run' })
    screen.getByText('Pause requested')
  })

  it('renders a disabled Canceling Run button and when stop requested', () => {
    when(mockUseRunQuery)
      .calledWith(RUN_ID)
      .mockReturnValue({
        data: { data: mockStopRequestedRun },
      } as UseQueryResult<Run>)
    when(mockUseRunStatus)
      .calledWith(RUN_ID)
      .mockReturnValue(RUN_STATUS_STOP_REQUESTED)

    render()

    const button = screen.getByRole('button', { name: 'Canceling Run' })
    expect(button).toBeDisabled()
    screen.getByText('Stop requested')
  })

  it('renders a disabled button and when the robot door is open', () => {
    when(mockUseRunQuery)
      .calledWith(RUN_ID)
      .mockReturnValue({
        data: { data: mockRunningRun },
      } as UseQueryResult<Run>)
    when(mockUseRunStatus)
      .calledWith(RUN_ID)
      .mockReturnValue(RUN_STATUS_BLOCKED_BY_OPEN_DOOR)

    const mockOpenDoorStatus = {
      data: { status: 'open', doorRequiredClosedForProtocol: true },
    }
    mockUseDoorQuery.mockReturnValue({ data: mockOpenDoorStatus } as any)

    render()

    const button = screen.getByRole('button', { name: 'Resume run' })
    expect(button).toBeDisabled()
    screen.getByText('Close robot door')
  })

  it('renders a Run Again button and end time when run has stopped and calls trackProtocolRunEvent when run again button clicked', () => {
    when(mockUseRunQuery)
      .calledWith(RUN_ID)
      .mockReturnValue({
        data: { data: mockStoppedRun },
      } as UseQueryResult<Run>)
    when(mockUseRunStatus)
      .calledWith(RUN_ID)
      .mockReturnValue(RUN_STATUS_STOPPED)
    when(mockUseRunTimestamps).calledWith(RUN_ID).mockReturnValue({
      startedAt: STARTED_AT,
      pausedAt: null,
      stoppedAt: null,
      completedAt: COMPLETED_AT,
    })

    render()

    const button = screen.getByText('Run again')
    screen.getByText('Canceled')
    screen.getByText(formatTimestamp(COMPLETED_AT))
    fireEvent.click(button)
    expect(mockTrackProtocolRunEvent).toBeCalledWith({
      name: ANALYTICS_PROTOCOL_RUN_AGAIN,
    })
  })

  it('renders a Run Again button and end time when run has failed and calls trackProtocolRunEvent when run again button clicked', () => {
    when(mockUseRunQuery)
      .calledWith(RUN_ID)
      .mockReturnValue({
        data: { data: mockFailedRun },
      } as UseQueryResult<Run>)
    when(mockUseRunStatus).calledWith(RUN_ID).mockReturnValue(RUN_STATUS_FAILED)
    when(mockUseRunTimestamps).calledWith(RUN_ID).mockReturnValue({
      startedAt: STARTED_AT,
      pausedAt: null,
      stoppedAt: null,
      completedAt: COMPLETED_AT,
    })

    render()

    const button = screen.getByText('Run again')
    screen.getByText('Failed')
    screen.getByText(formatTimestamp(COMPLETED_AT))
    fireEvent.click(button)
    expect(mockTrackProtocolRunEvent).toBeCalledWith({
      name: ANALYTICS_PROTOCOL_RUN_AGAIN,
    })
  })

  it('renders a Run Again button and end time when run has succeeded and calls trackProtocolRunEvent when run again button clicked', () => {
    when(mockUseRunQuery)
      .calledWith(RUN_ID)
      .mockReturnValue({
        data: { data: mockSucceededRun },
      } as UseQueryResult<Run>)
    when(mockUseRunStatus)
      .calledWith(RUN_ID)
      .mockReturnValue(RUN_STATUS_SUCCEEDED)
    when(mockUseRunTimestamps).calledWith(RUN_ID).mockReturnValue({
      startedAt: STARTED_AT,
      pausedAt: null,
      stoppedAt: null,
      completedAt: COMPLETED_AT,
    })

    render()

    const button = screen.getByText('Run again')
    screen.getByText('Completed')
    screen.getByText(formatTimestamp(COMPLETED_AT))
    fireEvent.click(button)
    expect(mockTrackEvent).toBeCalledWith({
      name: ANALYTICS_PROTOCOL_PROCEED_TO_RUN,
      properties: { sourceLocation: 'RunRecordDetail' },
    })
    expect(mockTrackProtocolRunEvent).toBeCalledWith({
      name: ANALYTICS_PROTOCOL_RUN_AGAIN,
    })
  })

  it('disables the Run Again button with tooltip for a completed run if the robot is busy', () => {
    when(mockUseRunQuery)
      .calledWith(RUN_ID)
      .mockReturnValue({
        data: { data: mockSucceededRun },
      } as UseQueryResult<Run>)
    when(mockUseRunStatus)
      .calledWith(RUN_ID)
      .mockReturnValue(RUN_STATUS_SUCCEEDED)
    when(mockUseRunTimestamps).calledWith(RUN_ID).mockReturnValue({
      startedAt: STARTED_AT,
      pausedAt: null,
      stoppedAt: null,
      completedAt: COMPLETED_AT,
    })
    when(mockUseCurrentRunId).calledWith().mockReturnValue('some other run id')

    render()

    const button = screen.getByRole('button', { name: 'Run again' })
    expect(button).toBeDisabled()
    screen.getByText('Robot is busy')
  })

  it('renders an alert when the robot door is open', () => {
    when(mockUseRunStatus)
      .calledWith(RUN_ID)
      .mockReturnValue(RUN_STATUS_BLOCKED_BY_OPEN_DOOR)
    render()

    screen.getByText('Close robot door to resume run')
  })

  it('renders a error detail link banner when run has failed', () => {
    when(mockUseRunQuery)
      .calledWith(RUN_ID)
      .mockReturnValue({
        data: { data: mockFailedRun },
      } as UseQueryResult<Run>)
    when(mockUseRunStatus).calledWith(RUN_ID).mockReturnValue(RUN_STATUS_FAILED)
    render()

    fireEvent.click(screen.getByText('View error'))
    expect(mockCloseCurrentRun).toBeCalled()
    screen.getByText('mock RunFailedModal')
  })

  it('renders a clear protocol banner when run has been canceled', () => {
    when(mockUseRunStatus)
      .calledWith(RUN_ID)
      .mockReturnValue(RUN_STATUS_STOPPED)
    render()

    screen.getByText('Run canceled.')
    expect(screen.queryByTestId('Banner_close-button')).not.toBeInTheDocument()
  })

  it('renders a clear protocol banner when run has succeeded', () => {
    when(mockUseRunQuery)
      .calledWith(RUN_ID)
      .mockReturnValue({
        data: { data: mockSucceededRun },
      } as UseQueryResult<Run>)
    when(mockUseRunStatus)
      .calledWith(RUN_ID)
      .mockReturnValue(RUN_STATUS_SUCCEEDED)
    render()

    screen.getByText('Run completed.')
    fireEvent.click(screen.getByTestId('Banner_close-button'))
    expect(mockCloseCurrentRun).toBeCalled()
  })

  it('if a heater shaker is shaking, clicking on start run should render HeaterShakerIsRunningModal', async () => {
    when(mockUseRunStatus).calledWith(RUN_ID).mockReturnValue(RUN_STATUS_IDLE)
    mockUseIsHeaterShakerInProtocol.mockReturnValue(true)
    mockUseModulesQuery.mockReturnValue({
      data: { data: [mockMovingHeaterShaker] },
    } as any)
    render()
    const button = screen.getByRole('button', { name: 'Start run' })
    fireEvent.click(button)
    await waitFor(() => {
      screen.getByText('Mock HeaterShakerIsRunningModal')
    })
  })

  it('does not render the confirm attachment modal when there is a heater shaker in the protocol and run is idle', () => {
    mockUseModulesQuery.mockReturnValue({
      data: { data: [mockHeaterShaker] },
    } as any)
    mockUseIsHeaterShakerInProtocol.mockReturnValue(true)
    render()

    const button = screen.getByRole('button', { name: 'Start run' })
    fireEvent.click(button)
    screen.getByText('mock confirm attachment modal')
    expect(mockTrackProtocolRunEvent).toBeCalledTimes(0)
  })

  it('renders the confirm attachment modal when there is a heater shaker in the protocol and the heater shaker is idle status and run is paused', () => {
    when(mockUseRunStatus).calledWith(RUN_ID).mockReturnValue(RUN_STATUS_PAUSED)

    mockUseModulesQuery.mockReturnValue({
      data: { data: [mockHeaterShaker] },
    } as any)
    mockUseIsHeaterShakerInProtocol.mockReturnValue(true)
    render()

    const button = screen.getByRole('button', { name: 'Resume run' })
    fireEvent.click(button)
    expect(screen.queryByText('mock confirm attachment modal')).toBeFalsy()
    expect(mockTrackProtocolRunEvent).toBeCalledTimes(1)
  })

  it('does NOT render confirm attachment modal when the user already confirmed the heater shaker is attached', () => {
    mockGetIsHeaterShakerAttached.mockReturnValue(true)
    mockUseModulesQuery.mockReturnValue({
      data: { data: [mockHeaterShaker] },
    } as any)
    mockUseIsHeaterShakerInProtocol.mockReturnValue(true)
    render()
    const button = screen.getByRole('button', { name: 'Start run' })
    fireEvent.click(button)
    expect(mockUseRunControls).toHaveBeenCalled()
  })

  it('renders analysis error modal if there is an analysis error', () => {
    when(mockUseProtocolAnalysisErrors)
      .calledWith(RUN_ID)
      .mockReturnValue({
        analysisErrors: [
          {
            id: 'error_id',
            detail: 'protocol analysis error',
            errorType: 'analysis',
            createdAt: '100000',
          },
        ],
      })
    render()
    screen.getByText('protocol analysis error')
  })

  it('renders analysis error banner if there is an analysis error', () => {
    when(mockUseProtocolAnalysisErrors)
      .calledWith(RUN_ID)
      .mockReturnValue({
        analysisErrors: [
          {
            id: 'error_id',
            detail: 'protocol analysis error',
            errorType: 'analysis',
            createdAt: '100000',
          },
        ],
      })
    render()
    screen.getByText('Protocol analysis failed.')
  })

  it('renders the devices page when robot is not viewable but protocol is loaded', async () => {
    mockUseIsRobotViewable.mockReturnValue(false)
    render()
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/devices')
    })
  })

  it('renders banner with spinner if currently closing current run', async () => {
    when(mockUseRunQuery)
      .calledWith(RUN_ID)
      .mockReturnValue({
        data: { data: mockSucceededRun },
      } as UseQueryResult<Run>)
    when(mockUseRunStatus)
      .calledWith(RUN_ID)
      .mockReturnValue(RUN_STATUS_SUCCEEDED)
    when(mockUseCloseCurrentRun).calledWith().mockReturnValue({
      isClosingCurrentRun: true,
      closeCurrentRun: mockCloseCurrentRun,
    })
    render()
    screen.getByText('Run completed.')
    screen.getByLabelText('ot-spinner')
  })

  it('renders door close banner when the robot door is open', () => {
    const mockOpenDoorStatus = {
      data: { status: 'open', doorRequiredClosedForProtocol: true },
    }
    mockUseDoorQuery.mockReturnValue({ data: mockOpenDoorStatus } as any)
    render()
    screen.getByText('Close the robot door before starting the run.')
  })

  it('should render door close banner when door is open and enabled safety door switch is on - OT-2', () => {
    when(mockUseIsFlex).calledWith(ROBOT_NAME).mockReturnValue(false)
    const mockOpenDoorStatus = {
      data: { status: 'open', doorRequiredClosedForProtocol: true },
    }
    mockUseDoorQuery.mockReturnValue({ data: mockOpenDoorStatus } as any)
    render()
    screen.getByText('Close the robot door before starting the run.')
  })

  it('should not render door close banner when door is open and enabled safety door switch is off - OT-2', () => {
    when(mockUseIsFlex).calledWith(ROBOT_NAME).mockReturnValue(false)
    const mockOffSettings = { ...mockSettings, value: false }
    mockGetRobotSettings.mockReturnValue([mockOffSettings])
    const mockOpenDoorStatus = {
      data: { status: 'open', doorRequiredClosedForProtocol: true },
    }
    mockUseDoorQuery.mockReturnValue({ data: mockOpenDoorStatus } as any)
    render()
    expect(
      screen.queryByText('Close the robot door before starting the run.')
    ).not.toBeInTheDocument()
  })

  it('renders the drop tip banner when the run is over and a pipette has a tip attached and is a flex', async () => {
    when(mockUseRunQuery)
      .calledWith(RUN_ID)
      .mockReturnValue({
        data: {
          data: {
            ...mockIdleUnstartedRun,
            current: true,
            status: RUN_STATUS_SUCCEEDED,
          },
        },
      } as UseQueryResult<Run>)
    when(mockUseRunStatus)
      .calledWith(RUN_ID)
      .mockReturnValue(RUN_STATUS_SUCCEEDED)

    render()
    await waitFor(() => {
      screen.getByText('Tips may be attached.')
    })
  })

  it('does not render the drop tip banner when the run is not over', async () => {
    when(mockUseRunQuery)
      .calledWith(RUN_ID)
      .mockReturnValue({
        data: {
          data: {
            ...mockIdleUnstartedRun,
            current: true,
            status: RUN_STATUS_IDLE,
          },
        },
      } as UseQueryResult<Run>)
    when(mockUseRunStatus).calledWith(RUN_ID).mockReturnValue(RUN_STATUS_IDLE)

    render()
    await waitFor(() => {
      expect(
        screen.queryByText('Tips may be attached.')
      ).not.toBeInTheDocument()
    })
  })
})
