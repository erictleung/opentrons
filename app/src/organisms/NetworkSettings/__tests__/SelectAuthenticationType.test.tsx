import * as React from 'react'
import { fireEvent, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../i18n'
import * as Networking from '../../../redux/networking'
import { SetWifiCred } from '../SetWifiCred'
import { AlternativeSecurityTypeModal } from '../AlternativeSecurityTypeModal'
import { useIsUnboxingFlowOngoing } from '../../RobotSettingsDashboard/NetworkSettings/hooks'
import { SelectAuthenticationType } from '../SelectAuthenticationType'

const mockPush = jest.fn()
const mockSetSelectedAuthType = jest.fn()

jest.mock('../SetWifiCred')
jest.mock('../../../redux/networking')
jest.mock('../../../redux/discovery/selectors')
jest.mock('../AlternativeSecurityTypeModal')
jest.mock('../../RobotSettingsDashboard/NetworkSettings/hooks')
jest.mock('react-router-dom', () => {
  const reactRouterDom = jest.requireActual('react-router-dom')
  return {
    ...reactRouterDom,
    useHistory: () => ({ push: mockPush } as any),
  }
})

const initialMockWifi = {
  ipAddress: '127.0.0.100',
  subnetMask: '255.255.255.230',
  macAddress: 'WI:FI:00:00:00:00',
  type: Networking.INTERFACE_WIFI,
}

const mockGetNetworkInterfaces = Networking.getNetworkInterfaces as jest.MockedFunction<
  typeof Networking.getNetworkInterfaces
>
const mockSetWifiCred = SetWifiCred as jest.MockedFunction<typeof SetWifiCred>
const mockAlternativeSecurityTypeModal = AlternativeSecurityTypeModal as jest.MockedFunction<
  typeof AlternativeSecurityTypeModal
>
const mockUseIsUnboxingFlowOngoing = useIsUnboxingFlowOngoing as jest.MockedFunction<
  typeof useIsUnboxingFlowOngoing
>

const render = (
  props: React.ComponentProps<typeof SelectAuthenticationType>
) => {
  return renderWithProviders(
    <MemoryRouter>
      <SelectAuthenticationType {...props} />
    </MemoryRouter>,
    {
      i18nInstance: i18n,
    }
  )
}

describe('SelectAuthenticationType', () => {
  let props: React.ComponentProps<typeof SelectAuthenticationType>
  beforeEach(() => {
    props = {
      selectedAuthType: 'wpa-psk',
      setSelectedAuthType: mockSetSelectedAuthType,
    }
    mockGetNetworkInterfaces.mockReturnValue({
      wifi: initialMockWifi,
      ethernet: null,
    })
    mockSetWifiCred.mockReturnValue(<div>Mock SetWifiCred</div>)
    mockAlternativeSecurityTypeModal.mockReturnValue(
      <div>mock AlternativeSecurityTypeModal</div>
    )
    mockUseIsUnboxingFlowOngoing.mockReturnValue(true)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should render text and buttons', () => {
    render(props)
    screen.getByText('WPA2 Personal')
    screen.getByText('Most labs use this method')
    screen.getByText('None')
    screen.getByText('Not recommended')
    screen.getByText('Your MAC Address is WI:FI:00:00:00:00')
    screen.getByText('Need another security type?')
  })

  it('should render AlternativeSecurityTypeModal when tapping need another security type? button', () => {
    render(props)
    fireEvent.click(screen.getByText('Need another security type?'))
    screen.getByText('mock AlternativeSecurityTypeModal')
  })
})
