import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'

import {
  ALIGN_CENTER,
  BORDERS,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  Icon,
  JUSTIFY_SPACE_BETWEEN,
  LocationIcon,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'
import { useDeckConfigurationQuery } from '@opentrons/react-api-client'
import {
  FLEX_ROBOT_TYPE,
  getCutoutIdForSlotName,
  getDeckDefFromRobotType,
  getModuleDisplayName,
  getModuleType,
  NON_CONNECTING_MODULE_TYPES,
  SINGLE_SLOT_FIXTURES,
  TC_MODULE_LOCATION_OT3,
  THERMOCYCLER_MODULE_TYPE,
} from '@opentrons/shared-data'

import { Portal } from '../../App/portal'
import { FloatingActionButton, SmallButton } from '../../atoms/buttons'
import { Chip } from '../../atoms/Chip'
import { InlineNotification } from '../../atoms/InlineNotification'
import { StyledText } from '../../atoms/text'
import { ChildNavigation } from '../../organisms/ChildNavigation'
import {
  useAttachedModules,
  useRunCalibrationStatus,
} from '../../organisms/Devices/hooks'
import { MultipleModulesModal } from '../Devices/ProtocolRun/SetupModuleAndDeck/MultipleModulesModal'
import { getProtocolModulesInfo } from '../../organisms/Devices/ProtocolRun/utils/getProtocolModulesInfo'
import { useMostRecentCompletedAnalysis } from '../../organisms/LabwarePositionCheck/useMostRecentCompletedAnalysis'
import { getLocalRobot } from '../../redux/discovery'
import { useChainLiveCommands } from '../../resources/runs/hooks'
import {
  getModulePrepCommands,
  ModulePrepCommandsType,
} from '../Devices/getModulePrepCommands'
import { useToaster } from '../ToasterOven'
import {
  getAttachedProtocolModuleMatches,
  getUnmatchedModulesForProtocol,
} from './utils'
import { SetupInstructionsModal } from './SetupInstructionsModal'
import { ModuleWizardFlows } from '../ModuleWizardFlows'
import { LocationConflictModal } from '../Devices/ProtocolRun/SetupModuleAndDeck/LocationConflictModal'
import { getModuleTooHot } from '../Devices/getModuleTooHot'
import { FixtureTable } from './FixtureTable'
import { ModulesAndDeckMapViewModal } from './ModulesAndDeckMapViewModal'

import type { CommandData } from '@opentrons/api-client'
import type {
  CutoutConfig,
  CutoutId,
  CutoutFixtureId,
} from '@opentrons/shared-data'
import type { SetupScreens } from '../../pages/ProtocolSetup'
import type { ProtocolCalibrationStatus } from '../../organisms/Devices/hooks'
import type { AttachedProtocolModuleMatch } from './utils'

const ATTACHED_MODULE_POLL_MS = 5000
const DECK_CONFIG_REFETCH_INTERVAL = 5000

interface RenderModuleStatusProps {
  isModuleReady: boolean
  isDuplicateModuleModel: boolean
  module: AttachedProtocolModuleMatch
  calibrationStatus: ProtocolCalibrationStatus
  setShowModuleWizard: (showModuleWizard: boolean) => void
  setPrepCommandErrorMessage: React.Dispatch<React.SetStateAction<string>>
  chainLiveCommands: (
    commands: ModulePrepCommandsType[],
    continuePastCommandFailure: boolean
  ) => Promise<CommandData[]>
  conflictedFixture?: CutoutConfig
  setShowLocationConflictModal: React.Dispatch<React.SetStateAction<boolean>>
}

function RenderModuleStatus({
  isModuleReady,
  isDuplicateModuleModel,
  module,
  calibrationStatus,
  setShowModuleWizard,
  setPrepCommandErrorMessage,
  chainLiveCommands,
  conflictedFixture,
  setShowLocationConflictModal,
}: RenderModuleStatusProps): JSX.Element {
  const { makeSnackbar } = useToaster()
  const { i18n, t } = useTranslation(['protocol_setup', 'module_wizard_flows'])

  const handleCalibrate = (): void => {
    if (module.attachedModuleMatch != null) {
      if (getModuleTooHot(module.attachedModuleMatch)) {
        makeSnackbar(t('module_wizard_flows:module_too_hot'))
      } else {
        chainLiveCommands(
          getModulePrepCommands(module.attachedModuleMatch),
          false
        ).catch((e: Error) => {
          setPrepCommandErrorMessage(e.message)
        })
        setShowModuleWizard(true)
      }
    } else {
      makeSnackbar(t('attach_module'))
    }
  }

  let moduleStatus: JSX.Element = (
    <>
      <Chip
        text={t('module_disconnected')}
        type="warning"
        background={false}
        iconName="connection-status"
      />
      {isDuplicateModuleModel ? <Icon name="information" size="2rem" /> : null}
    </>
  )
  if (conflictedFixture != null) {
    moduleStatus = (
      <>
        <Chip
          text={t('location_conflict')}
          type="warning"
          background={false}
          iconName="connection-status"
        />
        <SmallButton
          buttonCategory="rounded"
          buttonText={t('resolve')}
          onClick={() => setShowLocationConflictModal(true)}
        />
      </>
    )
  } else if (
    isModuleReady &&
    module.attachedModuleMatch?.moduleOffset?.last_modified != null
  ) {
    moduleStatus = (
      <>
        <Chip
          text={t('module_connected')}
          type="success"
          background={false}
          iconName="connection-status"
        />
        {isDuplicateModuleModel ? (
          <Icon name="information" size="2rem" />
        ) : null}
      </>
    )
  } else if (
    isModuleReady &&
    calibrationStatus.complete &&
    module.attachedModuleMatch?.moduleOffset?.last_modified == null
  ) {
    moduleStatus = (
      <SmallButton
        buttonCategory="rounded"
        buttonText={i18n.format(t('calibrate'), 'capitalize')}
        onClick={handleCalibrate}
      />
    )
  } else if (!calibrationStatus?.complete) {
    moduleStatus = (
      <StyledText as="p">
        {calibrationStatus?.reason === 'attach_pipette_failure_reason'
          ? t('calibration_required_attach_pipette_first')
          : t('calibration_required_calibrate_pipette_first')}
      </StyledText>
    )
  }
  return moduleStatus
}

interface RowModuleProps {
  isDuplicateModuleModel: boolean
  module: AttachedProtocolModuleMatch
  setShowMultipleModulesModal: (showMultipleModulesModal: boolean) => void
  calibrationStatus: ProtocolCalibrationStatus
  isLoading: boolean
  chainLiveCommands: (
    commands: ModulePrepCommandsType[],
    continuePastCommandFailure: boolean
  ) => Promise<CommandData[]>
  prepCommandErrorMessage: string
  setPrepCommandErrorMessage: React.Dispatch<React.SetStateAction<string>>
  conflictedFixture?: CutoutConfig
}

function RowModule({
  isDuplicateModuleModel,
  module,
  setShowMultipleModulesModal,
  calibrationStatus,
  chainLiveCommands,
  isLoading,
  prepCommandErrorMessage,
  setPrepCommandErrorMessage,
  conflictedFixture,
}: RowModuleProps): JSX.Element {
  const { t } = useTranslation('protocol_setup')
  const isNonConnectingModule = NON_CONNECTING_MODULE_TYPES.includes(
    module.moduleDef.moduleType
  )
  const isModuleReady =
    isNonConnectingModule || module.attachedModuleMatch != null

  const [showModuleWizard, setShowModuleWizard] = React.useState<boolean>(false)
  const [
    showLocationConflictModal,
    setShowLocationConflictModal,
  ] = React.useState<boolean>(false)

  return (
    <>
      {showModuleWizard && module.attachedModuleMatch != null ? (
        <ModuleWizardFlows
          attachedModule={module.attachedModuleMatch}
          closeFlow={() => setShowModuleWizard(false)}
          initialSlotName={module.slotName}
          isPrepCommandLoading={isLoading}
          prepCommandErrorMessage={
            prepCommandErrorMessage === '' ? undefined : prepCommandErrorMessage
          }
        />
      ) : null}
      {showLocationConflictModal && conflictedFixture != null ? (
        <LocationConflictModal
          onCloseClick={() => setShowLocationConflictModal(false)}
          cutoutId={conflictedFixture.cutoutId}
          requiredModule={module.moduleDef.model}
          isOnDevice={true}
        />
      ) : null}
      <Flex
        alignItems={ALIGN_CENTER}
        backgroundColor={
          isModuleReady &&
          module.attachedModuleMatch?.moduleOffset?.last_modified != null &&
          conflictedFixture == null
            ? COLORS.green3
            : COLORS.yellow3
        }
        borderRadius={BORDERS.borderRadiusSize3}
        cursor={isDuplicateModuleModel ? 'pointer' : 'inherit'}
        gridGap={SPACING.spacing24}
        padding={`${SPACING.spacing16} ${SPACING.spacing24}`}
        onClick={() =>
          isDuplicateModuleModel ? setShowMultipleModulesModal(true) : null
        }
      >
        <Flex flex="3.5 0 0" alignItems={ALIGN_CENTER}>
          <StyledText as="p" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
            {getModuleDisplayName(module.moduleDef.model)}
          </StyledText>
        </Flex>
        <Flex alignItems={ALIGN_CENTER} flex="2 0 0">
          <LocationIcon
            slotName={
              getModuleType(module.moduleDef.model) === THERMOCYCLER_MODULE_TYPE
                ? TC_MODULE_LOCATION_OT3
                : module.slotName
            }
          />
        </Flex>
        {isNonConnectingModule ? (
          <Flex flex="4 0 0" alignItems={ALIGN_CENTER}>
            <StyledText as="p" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
              {t('n_a')}
            </StyledText>
          </Flex>
        ) : (
          <Flex
            flex="4 0 0"
            alignItems={ALIGN_CENTER}
            justifyContent={JUSTIFY_SPACE_BETWEEN}
          >
            <RenderModuleStatus
              isModuleReady={isModuleReady}
              isDuplicateModuleModel={isDuplicateModuleModel}
              module={module}
              calibrationStatus={calibrationStatus}
              setShowModuleWizard={setShowModuleWizard}
              chainLiveCommands={chainLiveCommands}
              setPrepCommandErrorMessage={setPrepCommandErrorMessage}
              conflictedFixture={conflictedFixture}
              setShowLocationConflictModal={setShowLocationConflictModal}
            />
          </Flex>
        )}
      </Flex>
    </>
  )
}

interface ProtocolSetupModulesAndDeckProps {
  runId: string
  setSetupScreen: React.Dispatch<React.SetStateAction<SetupScreens>>
  setCutoutId: (cutoutId: CutoutId) => void
  setProvidedFixtureOptions: (providedFixtureOptions: CutoutFixtureId[]) => void
}

/**
 * an ODD screen on the Protocol Setup page
 */
export function ProtocolSetupModulesAndDeck({
  runId,
  setSetupScreen,
  setCutoutId,
  setProvidedFixtureOptions,
}: ProtocolSetupModulesAndDeckProps): JSX.Element {
  const { i18n, t } = useTranslation('protocol_setup')
  const { chainLiveCommands, isCommandMutationLoading } = useChainLiveCommands()
  const [
    showMultipleModulesModal,
    setShowMultipleModulesModal,
  ] = React.useState<boolean>(false)
  const [
    showSetupInstructionsModal,
    setShowSetupInstructionsModal,
  ] = React.useState<boolean>(false)
  const [showDeckMapModal, setShowDeckMapModal] = React.useState<boolean>(false)
  const [
    clearModuleMismatchBanner,
    setClearModuleMismatchBanner,
  ] = React.useState<boolean>(false)
  const [
    prepCommandErrorMessage,
    setPrepCommandErrorMessage,
  ] = React.useState<string>('')
  const { data: deckConfig } = useDeckConfigurationQuery({
    refetchInterval: DECK_CONFIG_REFETCH_INTERVAL,
  })
  const mostRecentAnalysis = useMostRecentCompletedAnalysis(runId)

  const deckDef = getDeckDefFromRobotType(FLEX_ROBOT_TYPE)

  const attachedModules =
    useAttachedModules({
      refetchInterval: ATTACHED_MODULE_POLL_MS,
    }) ?? []

  const localRobot = useSelector(getLocalRobot)
  const robotName = localRobot?.name != null ? localRobot.name : ''
  const calibrationStatus = useRunCalibrationStatus(robotName, runId)

  const protocolModulesInfo =
    mostRecentAnalysis != null
      ? getProtocolModulesInfo(mostRecentAnalysis, deckDef)
      : []

  const attachedProtocolModuleMatches = getAttachedProtocolModuleMatches(
    attachedModules,
    protocolModulesInfo
  )

  const hasModules = attachedProtocolModuleMatches.length > 0

  const {
    missingModuleIds,
    remainingAttachedModules,
  } = getUnmatchedModulesForProtocol(attachedModules, protocolModulesInfo)

  const isModuleMismatch =
    remainingAttachedModules.length > 0 && missingModuleIds.length > 0

  return (
    <>
      <Portal level="top">
        {showMultipleModulesModal ? (
          <MultipleModulesModal
            onCloseClick={() => setShowMultipleModulesModal(false)}
          />
        ) : null}
        {showSetupInstructionsModal ? (
          <SetupInstructionsModal
            setShowSetupInstructionsModal={setShowSetupInstructionsModal}
          />
        ) : null}
        {showDeckMapModal ? (
          <ModulesAndDeckMapViewModal
            setShowDeckMapModal={setShowDeckMapModal}
            attachedProtocolModuleMatches={attachedProtocolModuleMatches}
            runId={runId}
            protocolAnalysis={mostRecentAnalysis}
          />
        ) : null}
      </Portal>
      <ChildNavigation
        header={t('modules_and_deck')}
        onClickBack={() => setSetupScreen('prepare to run')}
        buttonText={i18n.format(t('setup_instructions'), 'titleCase')}
        buttonType="tertiaryLowLight"
        iconName="information"
        iconPlacement="startIcon"
        onClickButton={() => setShowSetupInstructionsModal(true)}
      />
      <Flex
        flexDirection={DIRECTION_COLUMN}
        gridGap={SPACING.spacing24}
        marginTop="7.75rem"
        marginBottom={SPACING.spacing80}
      >
        {isModuleMismatch && !clearModuleMismatchBanner ? (
          <InlineNotification
            type="alert"
            onCloseClick={e => {
              e.stopPropagation()
              setClearModuleMismatchBanner(true)
            }}
            heading={t('extra_module_attached')}
            message={t('module_mismatch_body')}
          />
        ) : null}
        <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing32}>
          {hasModules ? (
            <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing8}>
              <Flex
                color={COLORS.darkBlack70}
                fontSize={TYPOGRAPHY.fontSize22}
                fontWeight={TYPOGRAPHY.fontWeightSemiBold}
                gridGap={SPACING.spacing24}
                lineHeight={TYPOGRAPHY.lineHeight28}
                paddingX={SPACING.spacing24}
              >
                <StyledText flex="3.5 0 0">{t('module')}</StyledText>
                <StyledText flex="2 0 0">{t('location')}</StyledText>
                <StyledText flex="4 0 0"> {t('status')}</StyledText>
              </Flex>
              {attachedProtocolModuleMatches.map(module => {
                // check for duplicate module model in list of modules for protocol
                const isDuplicateModuleModel = protocolModulesInfo
                  // filter out current module
                  .filter(
                    otherModule => otherModule.moduleId !== module.moduleId
                  )
                  // check for existence of another module of same model
                  .some(
                    otherModule =>
                      otherModule.moduleDef.model === module.moduleDef.model
                  )

                const cutoutIdForSlotName = getCutoutIdForSlotName(
                  module.slotName,
                  deckDef
                )

                return (
                  <RowModule
                    key={module.moduleId}
                    module={module}
                    isDuplicateModuleModel={isDuplicateModuleModel}
                    setShowMultipleModulesModal={setShowMultipleModulesModal}
                    calibrationStatus={calibrationStatus}
                    chainLiveCommands={chainLiveCommands}
                    isLoading={isCommandMutationLoading}
                    prepCommandErrorMessage={prepCommandErrorMessage}
                    setPrepCommandErrorMessage={setPrepCommandErrorMessage}
                    conflictedFixture={deckConfig?.find(
                      fixture =>
                        fixture.cutoutId === cutoutIdForSlotName &&
                        fixture.cutoutFixtureId != null &&
                        !SINGLE_SLOT_FIXTURES.includes(fixture.cutoutFixtureId)
                    )}
                  />
                )
              })}
            </Flex>
          ) : null}
          <FixtureTable
            robotType={FLEX_ROBOT_TYPE}
            mostRecentAnalysis={mostRecentAnalysis}
            setSetupScreen={setSetupScreen}
            setCutoutId={setCutoutId}
            setProvidedFixtureOptions={setProvidedFixtureOptions}
          />
        </Flex>
      </Flex>
      <FloatingActionButton onClick={() => setShowDeckMapModal(true)} />
    </>
  )
}
