import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Flex,
  Icon,
  RobotCoordsForeignObject,
  ALIGN_CENTER,
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  JUSTIFY_CENTER,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'
import {
  ModuleModel,
  getModuleDisplayName,
  getModuleDef2,
  MAGNETIC_BLOCK_V1,
  THERMOCYCLER_MODULE_TYPE,
} from '@opentrons/shared-data'

import { StyledText } from '../../atoms/text'
import { useRunHasStarted } from './hooks'
import type { PhysicalPort } from '../../redux/modules/api-types'

export interface ModuleInfoProps {
  moduleModel: ModuleModel
  isAttached: boolean
  physicalPort: PhysicalPort | null
  runId?: string
}

export const ModuleInfo = (props: ModuleInfoProps): JSX.Element => {
  const { moduleModel, physicalPort, isAttached, runId = null } = props
  const moduleDef = getModuleDef2(moduleModel)
  const {
    xDimension,
    yDimension,
    labwareInterfaceYDimension,
    labwareInterfaceXDimension,
  } = moduleDef.dimensions
  const { t } = useTranslation('protocol_setup')

  const runHasStarted = useRunHasStarted(runId)
  let connectionStatus = t('no_usb_port_yet')
  if (moduleModel === MAGNETIC_BLOCK_V1) {
    connectionStatus = t('no_usb_required')
  }
  if (physicalPort === null && isAttached) {
    connectionStatus = t('usb_connected_no_port_info')
  } else if (physicalPort != null && isAttached) {
    connectionStatus = t('usb_port_connected', { port: physicalPort.port })
  }

  return (
    <RobotCoordsForeignObject
      x={0}
      y={0}
      height={labwareInterfaceYDimension ?? yDimension}
      width={labwareInterfaceXDimension ?? xDimension}
      flexProps={{
        padding: SPACING.spacing16,
        backgroundColor:
          moduleDef.moduleType === THERMOCYCLER_MODULE_TYPE
            ? COLORS.white
            : COLORS.transparent,
      }}
    >
      <Flex
        flexDirection={DIRECTION_COLUMN}
        gridGap={SPACING.spacing2}
        justifyContent={JUSTIFY_CENTER}
      >
        {!runHasStarted && moduleModel !== MAGNETIC_BLOCK_V1 ? (
          <Flex flexDirection={DIRECTION_ROW} alignItems={ALIGN_CENTER}>
            <Icon
              name={isAttached ? 'ot-check' : 'alert-circle'}
              color={isAttached ? COLORS.successEnabled : COLORS.warningEnabled}
              key="icon"
              size="10px"
              marginRight={SPACING.spacing4}
            />

            <StyledText
              color={COLORS.darkGreyEnabled}
              fontSize={TYPOGRAPHY.fontSizeCaption}
            >
              {!isAttached ? t('module_not_connected') : t('module_connected')}
            </StyledText>
          </Flex>
        ) : null}
        <StyledText
          fontWeight={TYPOGRAPHY.fontWeightSemiBold}
          color={COLORS.darkGreyEnabled}
          fontSize={TYPOGRAPHY.fontSizeLabel}
        >
          {getModuleDisplayName(moduleModel)}
        </StyledText>
        <StyledText
          color={COLORS.darkGreyEnabled}
          fontSize={TYPOGRAPHY.fontSizeH6}
          fontStyle={
            runHasStarted
              ? TYPOGRAPHY.fontStyleNormal
              : TYPOGRAPHY.fontStyleItalic
          }
        >
          {runHasStarted
            ? t('connection_info_not_available')
            : connectionStatus}
        </StyledText>
      </Flex>
    </RobotCoordsForeignObject>
  )
}
