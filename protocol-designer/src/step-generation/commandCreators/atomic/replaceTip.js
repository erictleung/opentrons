// @flow
import cloneDeep from 'lodash/cloneDeep'
import { getNextTiprack, getPipetteSpecFromId } from '../../robotStateSelectors'
import { tiprackWellNamesByCol } from '../../data'
import { insufficientTips } from '../../errorCreators'
import type { RobotState, CommandCreator } from '../../types'
import dropTip from './dropTip'

const replaceTip = (pipetteId: string): CommandCreator => (
  prevRobotState: RobotState
) => {
  /**
    Pick up next available tip. Works differently for an 8-channel which needs a full row of tips.
    Expects 96-well format tip naming system on the tiprack.
    If there's already a tip on the pipette, this will drop it before getting a new one
  */
  let robotState = cloneDeep(prevRobotState)

  const pipetteSpec = getPipetteSpecFromId(pipetteId, robotState)
  const nextTiprack = getNextTiprack(pipetteId, robotState)

  if (!nextTiprack) {
    // no valid next tip / tiprack, bail out
    return {
      errors: [insufficientTips()],
    }
  }

  // drop tip if you have one
  const dropTipResult = dropTip(pipetteId)(robotState)
  if (dropTipResult.errors) {
    return dropTipResult
  }
  robotState = dropTipResult.robotState

  const commands = [
    ...dropTipResult.commands,
    // pick up tip command
    {
      command: 'pick-up-tip',
      params: {
        pipette: pipetteId,
        labware: nextTiprack.tiprackId,
        well: nextTiprack.well,
      },
    },
  ]

  // pipette now has tip
  robotState.tipState.pipettes[pipetteId] = true

  // remove tips from tiprack
  if (pipetteSpec.channels === 1 && nextTiprack.well) {
    robotState.tipState.tipracks[nextTiprack.tiprackId][
      nextTiprack.well
    ] = false
  }
  if (pipetteSpec.channels === 8) {
    const allWells = tiprackWellNamesByCol.find(
      col => col[0] === nextTiprack.well
    )
    if (!allWells) {
      // TODO Ian 2018-04-30 return {errors}, don't throw
      throw new Error('Invalid well: ' + nextTiprack.well) // TODO: test
    }
    allWells.forEach(function(well) {
      robotState.tipState.tipracks[nextTiprack.tiprackId][well] = false
    })
  }

  return {
    commands,
    robotState,
  }
}

export default replaceTip
