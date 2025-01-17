import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Switch, Route, Redirect } from 'react-router-dom'
import { css } from 'styled-components'
import { ErrorBoundary } from 'react-error-boundary'

import {
  Box,
  POSITION_RELATIVE,
  COLORS,
  OVERFLOW_AUTO,
  useIdle,
  useScrolling,
} from '@opentrons/components'
import { ApiHostProvider } from '@opentrons/react-api-client'
import NiceModal from '@ebay/nice-modal-react'

import { BackButton } from '../atoms/buttons'
import { SleepScreen } from '../atoms/SleepScreen'
import { ToasterOven } from '../organisms/ToasterOven'
import { MaintenanceRunTakeover } from '../organisms/TakeoverModal'
import { FirmwareUpdateTakeover } from '../organisms/FirmwareUpdateModal/FirmwareUpdateTakeover'
import { EstopTakeover } from '../organisms/EmergencyStop'
import { ConnectViaEthernet } from '../pages/ConnectViaEthernet'
import { ConnectViaUSB } from '../pages/ConnectViaUSB'
import { ConnectViaWifi } from '../pages/ConnectViaWifi'
import { EmergencyStop } from '../pages/EmergencyStop'
import { NameRobot } from '../pages/NameRobot'
import { NetworkSetupMenu } from '../pages/NetworkSetupMenu'
import { ProtocolSetup } from '../pages/ProtocolSetup'
import { RobotDashboard } from '../pages/RobotDashboard'
import { RobotSettingsDashboard } from '../pages/RobotSettingsDashboard'
import { ProtocolDashboard } from '../pages/ProtocolDashboard'
import { ProtocolDetails } from '../pages/ProtocolDetails'
import { RunningProtocol } from '../pages/RunningProtocol'
import { RunSummary } from '../pages/RunSummary'
import { UpdateRobot } from '../pages/UpdateRobot/UpdateRobot'
import { UpdateRobotDuringOnboarding } from '../pages/UpdateRobot/UpdateRobotDuringOnboarding'
import { InstrumentsDashboard } from '../pages/InstrumentsDashboard'
import { InstrumentDetail } from '../pages/InstrumentDetail'
import { Welcome } from '../pages/Welcome'
import { InitialLoadingScreen } from '../pages/InitialLoadingScreen'
import { DeckConfigurationEditor } from '../pages/DeckConfiguration'
import { PortalRoot as ModalPortalRoot } from './portal'
import { getOnDeviceDisplaySettings, updateConfigValue } from '../redux/config'
import { updateBrightness } from '../redux/shell'
import { SLEEP_NEVER_MS } from './constants'
import {
  useCurrentRunRoute,
  useProtocolReceiptToast,
  useSoftwareUpdatePoll,
} from './hooks'

import { OnDeviceDisplayAppFallback } from './OnDeviceDisplayAppFallback'

import { hackWindowNavigatorOnLine } from './hacks'

import type { Dispatch } from '../redux/types'
import type { RouteProps } from './types'

// forces electron to think we're online which means axios won't elide
// network calls to localhost. see ./hacks.ts for more.
hackWindowNavigatorOnLine()

export const onDeviceDisplayRoutes: RouteProps[] = [
  {
    Component: InitialLoadingScreen,
    exact: true,
    name: 'Initial Loading Screen',
    path: '/loading',
  },
  {
    Component: Welcome,
    exact: true,
    name: 'Welcome',
    path: '/welcome',
  },
  {
    Component: RobotDashboard,
    exact: true,
    name: 'Robot Dashboard',
    path: '/dashboard',
  },
  {
    Component: NetworkSetupMenu,
    exact: true,
    name: 'Network setup menu',
    path: '/network-setup',
  },
  {
    Component: ConnectViaWifi,
    exact: true,
    name: 'Select Network',
    path: '/network-setup/wifi',
  },
  {
    Component: ConnectViaEthernet,
    exact: true,
    name: 'Connect via Ethernet',
    path: '/network-setup/ethernet',
  },
  {
    Component: ConnectViaUSB,
    exact: true,
    name: 'Connect via USB',
    path: '/network-setup/usb',
  },
  {
    Component: ProtocolDashboard,
    exact: true,
    name: 'All Protocols',
    navLinkTo: '/protocols',
    path: '/protocols',
  },
  // insert protocol sub-routes
  {
    Component: ProtocolDetails,
    exact: true,
    name: 'Protocol Details',
    path: '/protocols/:protocolId',
  },
  // expect to change or add additional route params
  {
    Component: ProtocolSetup,
    exact: true,
    name: 'Protocol Setup',
    path: '/runs/:runId/setup',
  },
  {
    Component: RunningProtocol,
    exact: true,
    name: 'Protocol Run',
    path: '/runs/:runId/run',
  },
  {
    Component: RunSummary,
    exact: true,
    name: 'Protocol Run Summary',
    path: '/runs/:runId/summary',
  },
  {
    Component: InstrumentsDashboard,
    exact: true,
    name: 'Instruments',
    navLinkTo: '/instruments',
    path: '/instruments',
  },
  {
    Component: InstrumentDetail,
    exact: true,
    name: 'Instrument Detail',
    path: '/instruments/:mount',
  },
  // insert attach instruments sub-routes
  {
    Component: RobotSettingsDashboard,
    exact: true,
    name: 'Settings',
    navLinkTo: '/robot-settings',
    path: '/robot-settings',
  },
  // insert robot settings sub-routes
  {
    Component: () => (
      <>
        <BackButton />
        <Box>factory reset</Box>
      </>
    ),
    exact: true,
    name: 'Factory Reset',
    path: '/robot-settings/factory-reset',
  },
  {
    Component: NameRobot,
    exact: true,
    name: 'Rename Robot',
    path: '/robot-settings/rename-robot',
  },
  {
    Component: UpdateRobot,
    exact: true,
    name: 'Update Robot',
    path: '/robot-settings/update-robot',
  },
  {
    Component: UpdateRobotDuringOnboarding,
    exact: true,
    name: 'Update Robot During Onboarding',
    path: '/robot-settings/update-robot-during-onboarding',
  },
  {
    Component: EmergencyStop,
    exact: true,
    name: 'Emergency Stop',
    path: '/emergency-stop',
  },
  {
    Component: DeckConfigurationEditor,
    exact: true,
    name: 'Deck Configuration',
    path: '/deck-configuration',
  },
  {
    Component: () => (
      <>
        <BackButton />
        <Box>app settings</Box>
      </>
    ),
    exact: true,
    name: 'App Settings',
    path: '/app-settings',
  },
]

const onDeviceDisplayEvents: Array<keyof DocumentEventMap> = [
  'mousedown',
  'click',
  'scroll',
]

const TURN_OFF_BACKLIGHT = '7'

export const OnDeviceDisplayApp = (): JSX.Element => {
  useSoftwareUpdatePoll()
  const { brightness: userSetBrightness, sleepMs } = useSelector(
    getOnDeviceDisplaySettings
  )

  const sleepTime = sleepMs != null ? sleepMs : SLEEP_NEVER_MS
  const options = {
    events: onDeviceDisplayEvents,
    initialState: false,
  }
  const dispatch = useDispatch<Dispatch>()
  const isIdle = useIdle(sleepTime, options)
  const scrollRef = React.useRef(null)
  const isScrolling = useScrolling(scrollRef)

  const TOUCH_SCREEN_STYLE = css`
    position: ${POSITION_RELATIVE};
    width: 100%;
    height: 100%;
    background-color: ${COLORS.white};
    overflow-y: ${OVERFLOW_AUTO};

    &::-webkit-scrollbar {
      display: ${isScrolling ? undefined : 'none'};
      width: 0.75rem;
    }

    &::-webkit-scrollbar-track {
      margin-top: 170px;
      margin-bottom: 170px;
    }

    &::-webkit-scrollbar-thumb {
      background: ${COLORS.darkBlack40};
      border-radius: 11px;
    }
  `

  React.useEffect(() => {
    if (isIdle) {
      dispatch(updateBrightness(TURN_OFF_BACKLIGHT))
    } else {
      dispatch(
        updateConfigValue(
          'onDeviceDisplaySettings.brightness',
          userSetBrightness
        )
      )
    }
  }, [dispatch, isIdle, userSetBrightness])

  // TODO (sb:6/12/23) Create a notification manager to set up preference and order of takeover modals
  return (
    <ApiHostProvider hostname="127.0.0.1">
      <ErrorBoundary FallbackComponent={OnDeviceDisplayAppFallback}>
        <Box width="100%" css="user-select: none;">
          {isIdle ? (
            <SleepScreen />
          ) : (
            <>
              <EstopTakeover />
              <MaintenanceRunTakeover>
                <FirmwareUpdateTakeover />
                <NiceModal.Provider>
                  <ToasterOven>
                    <ProtocolReceiptToasts />
                    <Switch>
                      {onDeviceDisplayRoutes.map(
                        ({ Component, exact, path }: RouteProps) => {
                          return (
                            <Route key={path} exact={exact} path={path}>
                              <Box css={TOUCH_SCREEN_STYLE} ref={scrollRef}>
                                <ModalPortalRoot />
                                <Component />
                              </Box>
                            </Route>
                          )
                        }
                      )}
                      <Redirect exact from="/" to={'/loading'} />
                    </Switch>
                  </ToasterOven>
                </NiceModal.Provider>
              </MaintenanceRunTakeover>
            </>
          )}
        </Box>
      </ErrorBoundary>
      <TopLevelRedirects />
    </ApiHostProvider>
  )
}

function TopLevelRedirects(): JSX.Element | null {
  const currentRunRoute = useCurrentRunRoute()
  return currentRunRoute != null ? <Redirect to={currentRunRoute} /> : null
}

function ProtocolReceiptToasts(): null {
  useProtocolReceiptToast()
  return null
}
