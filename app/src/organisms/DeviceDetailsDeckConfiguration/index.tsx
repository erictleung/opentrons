import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { css } from 'styled-components'

import {
  ALIGN_CENTER,
  ALIGN_FLEX_START,
  BORDERS,
  COLORS,
  DeckConfigurator,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  Link,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'
import {
  useCurrentMaintenanceRun,
  useDeckConfigurationQuery,
  useUpdateDeckConfigurationMutation,
} from '@opentrons/react-api-client'
import {
  getCutoutDisplayName,
  getFixtureDisplayName,
  SINGLE_RIGHT_CUTOUTS,
  SINGLE_SLOT_FIXTURES,
  SINGLE_LEFT_SLOT_FIXTURE,
  SINGLE_RIGHT_SLOT_FIXTURE,
} from '@opentrons/shared-data'

import { StyledText } from '../../atoms/text'
import { Banner } from '../../atoms/Banner'
import { DeckFixtureSetupInstructionsModal } from './DeckFixtureSetupInstructionsModal'
import { AddFixtureModal } from './AddFixtureModal'
import { useRunStatuses } from '../Devices/hooks'

import type { CutoutId } from '@opentrons/shared-data'

const DECK_CONFIG_REFETCH_INTERVAL = 5000
const RUN_REFETCH_INTERVAL = 5000

interface DeviceDetailsDeckConfigurationProps {
  robotName: string
}

export function DeviceDetailsDeckConfiguration({
  robotName,
}: DeviceDetailsDeckConfigurationProps): JSX.Element | null {
  const { t } = useTranslation('device_details')
  const [
    showSetupInstructionsModal,
    setShowSetupInstructionsModal,
  ] = React.useState<boolean>(false)
  const [showAddFixtureModal, setShowAddFixtureModal] = React.useState<boolean>(
    false
  )
  const [targetCutoutId, setTargetCutoutId] = React.useState<CutoutId | null>(
    null
  )

  const deckConfig =
    useDeckConfigurationQuery({ refetchInterval: DECK_CONFIG_REFETCH_INTERVAL })
      .data ?? []
  const { updateDeckConfiguration } = useUpdateDeckConfigurationMutation()
  const { isRunRunning } = useRunStatuses()
  const { data: maintenanceRunData } = useCurrentMaintenanceRun({
    refetchInterval: RUN_REFETCH_INTERVAL,
  })
  const isMaintenanceRunExisting = maintenanceRunData?.data?.id != null

  const handleClickAdd = (cutoutId: CutoutId): void => {
    setTargetCutoutId(cutoutId)
    setShowAddFixtureModal(true)
  }

  const handleClickRemove = (cutoutId: CutoutId): void => {
    const isRightCutout = SINGLE_RIGHT_CUTOUTS.includes(cutoutId)
    const singleSlotFixture = isRightCutout
      ? SINGLE_RIGHT_SLOT_FIXTURE
      : SINGLE_LEFT_SLOT_FIXTURE

    const newDeckConfig = deckConfig.map(fixture =>
      fixture.cutoutId === cutoutId
        ? { ...fixture, cutoutFixtureId: singleSlotFixture }
        : fixture
    )

    updateDeckConfiguration(newDeckConfig)
  }

  // do not show standard slot in fixture display list
  const fixtureDisplayList = deckConfig.filter(
    fixture =>
      fixture.cutoutFixtureId != null &&
      !SINGLE_SLOT_FIXTURES.includes(fixture.cutoutFixtureId)
  )

  return (
    <>
      {showAddFixtureModal && targetCutoutId != null ? (
        <AddFixtureModal
          cutoutId={targetCutoutId}
          setShowAddFixtureModal={setShowAddFixtureModal}
        />
      ) : null}
      {showSetupInstructionsModal ? (
        <DeckFixtureSetupInstructionsModal
          setShowSetupInstructionsModal={setShowSetupInstructionsModal}
        />
      ) : null}
      <Flex
        alignItems={ALIGN_FLEX_START}
        backgroundColor={COLORS.white}
        border={BORDERS.lineBorder}
        borderRadius={BORDERS.radiusSoftCorners}
        flexDirection={DIRECTION_COLUMN}
        gridGap={SPACING.spacing16}
        width="100%"
        marginBottom={SPACING.spacing16}
      >
        <Flex
          flexDirection={DIRECTION_ROW}
          alignItems={ALIGN_CENTER}
          justifyContent={JUSTIFY_SPACE_BETWEEN}
          padding={SPACING.spacing16}
          width="100%"
          borderBottom={BORDERS.lineBorder}
        >
          <StyledText
            as="h3"
            fontWeight={TYPOGRAPHY.fontWeightSemiBold}
            id="DeckConfiguration_title"
          >
            {`${robotName} ${t('deck_configuration')}`}
          </StyledText>
          <Link
            role="button"
            css={TYPOGRAPHY.linkPSemiBold}
            onClick={() => setShowSetupInstructionsModal(true)}
          >
            {t('setup_instructions')}
          </Link>
        </Flex>
        <Flex
          gridGap={SPACING.spacing16}
          paddingX={SPACING.spacing16}
          paddingBottom={SPACING.spacing32}
          paddingTop={
            isRunRunning || isMaintenanceRunExisting
              ? undefined
              : SPACING.spacing32
          }
          width="100%"
          flexDirection={DIRECTION_COLUMN}
        >
          {isRunRunning ? (
            <Banner type="warning">
              {t('deck_configuration_is_not_available_when_run_is_in_progress')}
            </Banner>
          ) : null}
          {isMaintenanceRunExisting ? (
            <Banner type="warning">
              {t('deck_configuration_is_not_available_when_robot_is_busy')}
            </Banner>
          ) : null}
          <Flex css={DECK_CONFIG_SECTION_STYLE}>
            <Flex
              // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
              marginLeft={`-${SPACING.spacing32}`}
              // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
              marginTop={`-${SPACING.spacing6}`}
              flexDirection={DIRECTION_COLUMN}
            >
              <DeckConfigurator
                readOnly={isRunRunning || isMaintenanceRunExisting}
                deckConfig={deckConfig}
                handleClickAdd={handleClickAdd}
                handleClickRemove={handleClickRemove}
              />
            </Flex>
            <Flex
              flexDirection={DIRECTION_COLUMN}
              gridGap={SPACING.spacing8}
              width="32rem"
            >
              <Flex
                gridGap={SPACING.spacing32}
                paddingLeft={SPACING.spacing8}
                css={TYPOGRAPHY.labelSemiBold}
              >
                <StyledText>{t('location')}</StyledText>
                <StyledText>{t('fixture')}</StyledText>
              </Flex>
              {fixtureDisplayList.length > 0 ? (
                fixtureDisplayList.map(fixture => (
                  <Flex
                    key={fixture.cutoutId}
                    backgroundColor={COLORS.fundamentalsBackground}
                    gridGap={SPACING.spacing60}
                    padding={SPACING.spacing8}
                    width="100%"
                    css={TYPOGRAPHY.labelRegular}
                  >
                    <StyledText>
                      {getCutoutDisplayName(fixture.cutoutId)}
                    </StyledText>
                    <StyledText>
                      {getFixtureDisplayName(fixture.cutoutFixtureId)}
                    </StyledText>
                  </Flex>
                ))
              ) : (
                <Flex
                  backgroundColor={COLORS.fundamentalsBackground}
                  gridGap={SPACING.spacing60}
                  padding={SPACING.spacing8}
                  width="100%"
                  css={TYPOGRAPHY.labelRegular}
                >
                  <StyledText>{t('no_deck_fixtures')}</StyledText>
                </Flex>
              )}
            </Flex>
          </Flex>
        </Flex>
      </Flex>
    </>
  )
}

const DECK_CONFIG_SECTION_STYLE = css`
  flex-direction: ${DIRECTION_ROW};
  grid-gap: ${SPACING.spacing40};
  @media screen and (max-width: 1024px) {
    flex-direction: ${DIRECTION_COLUMN};
    align-items: ${ALIGN_CENTER};
    grid-gap: ${SPACING.spacing32};
  }
`
