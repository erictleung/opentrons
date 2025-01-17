import * as React from 'react'
import { when } from 'jest-when'
import { QueryClient, QueryClientProvider } from 'react-query'
import { renderHook, waitFor } from '@testing-library/react'

import { getEstopStatus } from '@opentrons/api-client'
import { useHost } from '../../api'
import { useEstopQuery } from '..'

import type { HostConfig, Response, EstopStatus } from '@opentrons/api-client'
import type { UseEstopQueryOptions } from '../useEstopQuery'

jest.mock('@opentrons/api-client')
jest.mock('../../api/useHost')

const mockGetEstopStatus = getEstopStatus as jest.MockedFunction<
  typeof getEstopStatus
>
const mockUseHost = useHost as jest.MockedFunction<typeof useHost>

const HOST_CONFIG: HostConfig = { hostname: 'localhost' }
const ESTOP_STATE_RESPONSE: EstopStatus = {
  data: {
    status: 'disengaged',
    leftEstopPhysicalStatus: 'disengaged',
    rightEstopPhysicalStatus: 'disengaged',
  },
}

describe('useEstopQuery hook', () => {
  let wrapper: React.FunctionComponent<
    { children: React.ReactNode } & UseEstopQueryOptions
  >

  beforeEach(() => {
    const queryClient = new QueryClient()
    const clientProvider: React.FunctionComponent<
      { children: React.ReactNode } & UseEstopQueryOptions
    > = ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )

    wrapper = clientProvider
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should return no data if no host', () => {
    when(mockUseHost).calledWith().mockReturnValue(null)

    const { result } = renderHook(() => useEstopQuery(), { wrapper })

    expect(result.current?.data).toBeUndefined()
  })

  it('should return no data if estop request fails', () => {
    when(mockUseHost).calledWith().mockReturnValue(HOST_CONFIG)
    when(mockGetEstopStatus).calledWith(HOST_CONFIG).mockRejectedValue('oh no')

    const { result } = renderHook(() => useEstopQuery(), { wrapper })

    expect(result.current?.data).toBeUndefined()
  })

  it('should return estop state response data', async () => {
    when(mockUseHost).calledWith().mockReturnValue(HOST_CONFIG)
    when(mockGetEstopStatus)
      .calledWith(HOST_CONFIG)
      .mockResolvedValue({
        data: ESTOP_STATE_RESPONSE,
      } as Response<EstopStatus>)

    const { result } = renderHook(() => useEstopQuery(), { wrapper })

    await waitFor(() => {
      expect(result.current?.data).toEqual(ESTOP_STATE_RESPONSE)
    })
  })
})
