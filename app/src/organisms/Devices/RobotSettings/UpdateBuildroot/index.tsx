import * as React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import NiceModal, { useModal } from '@ebay/nice-modal-react'

import {
  setRobotUpdateSeen,
  robotUpdateIgnored,
  getRobotUpdateSession,
} from '../../../../redux/robot-update'
import { ViewUpdateModal } from './ViewUpdateModal'
import { RobotUpdateProgressModal } from './RobotUpdateProgressModal'
import { UNREACHABLE } from '../../../../redux/discovery'

import type { Dispatch } from '../../../../redux/types'
import type { DiscoveredRobot } from '../../../../redux/discovery/types'

interface UpdateBuildrootProps {
  robot: DiscoveredRobot | null
}

export const handleUpdateBuildroot = (
  robot: UpdateBuildrootProps['robot']
): void => {
  NiceModal.show(UpdateBuildroot, { robot })
}

const UpdateBuildroot = NiceModal.create(
  (props: UpdateBuildrootProps): JSX.Element | null => {
    const { robot } = props
    const hasSeenSessionOnce = React.useRef<boolean>(false)
    const modal = useModal()
    const robotName = React.useRef<string>(robot?.name ?? '')
    const dispatch = useDispatch<Dispatch>()
    const session = useSelector(getRobotUpdateSession)
    if (!hasSeenSessionOnce.current && session)
      hasSeenSessionOnce.current = true

    React.useEffect(() => {
      if (robotName.current) {
        dispatch(setRobotUpdateSeen(robotName.current))
      }
    }, [robotName])

    const ignoreUpdate = React.useCallback(() => {
      if (robotName.current) {
        dispatch(robotUpdateIgnored(robotName.current))
      }
      modal.remove()
    }, [robotName, close])

    if (hasSeenSessionOnce.current)
      return (
        <RobotUpdateProgressModal
          robotName={robotName.current}
          session={session}
          closeUpdateBuildroot={modal.remove}
        />
      )
    else if (robot != null && robot.status !== UNREACHABLE)
      return (
        <ViewUpdateModal
          robotName={robotName.current}
          robot={robot}
          closeModal={ignoreUpdate}
        />
      )
    else return null
  }
)
