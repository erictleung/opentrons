import * as React from 'react'
import {
  ALIGN_FLEX_END,
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  SPACING,
} from '@opentrons/components'
import fixture_12_trough from '@opentrons/shared-data/labware/fixtures/2/fixture_12_trough.json'
import fixture_tiprack_10_ul from '@opentrons/shared-data/labware/fixtures/2/fixture_tiprack_10_ul.json'
import { LabwareDefinition2, getLabwareDefURI } from '@opentrons/shared-data'

import { touchScreenViewport } from '../../DesignTokens/constants'
import { SmallButton } from '../../atoms/buttons'
import { TerseOffsetTable } from './ResultsSummary'

import type { Story, Meta } from '@storybook/react'

export default {
  title: 'ODD/Organisms/TerseOffsetTable',
  component: TerseOffsetTable,
  parameters: touchScreenViewport,
} as Meta

// Note: 59rem(944px) is the size of ODD
const Template: Story<React.ComponentProps<typeof TerseOffsetTable>> = ({
  ...args
}) => (
  <Flex padding={SPACING.spacing16} width="59rem">
    <Flex
      flex="1"
      flexDirection={DIRECTION_COLUMN}
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      padding={SPACING.spacing32}
      minHeight="29.5rem"
    >
      <Flex
        flexDirection={DIRECTION_COLUMN}
        maxHeight="20rem"
        overflowY="scroll"
      >
        <h1>new labware offset data</h1>
        <TerseOffsetTable {...args} />
      </Flex>
      <SmallButton
        alignSelf={ALIGN_FLEX_END}
        onClick={() => console.log('FAKE BUTTON')}
        buttonText="Apply offsets"
      />
    </Flex>
  </Flex>
)

export const Basic = Template.bind({})
Basic.args = {
  offsets: [
    {
      definitionUri: getLabwareDefURI(fixture_12_trough as LabwareDefinition2),
      location: { slotName: 'A1' },
      vector: { x: 1, y: 2, z: 3 },
    },
    {
      definitionUri: getLabwareDefURI(fixture_12_trough as LabwareDefinition2),
      location: { slotName: 'A2' },
      vector: { x: 1, y: 2, z: 3 },
    },
    {
      definitionUri: getLabwareDefURI(fixture_12_trough as LabwareDefinition2),
      location: { slotName: 'A3' },
      vector: { x: 1, y: 2, z: 3 },
    },
    {
      definitionUri: getLabwareDefURI(fixture_12_trough as LabwareDefinition2),
      location: { slotName: 'B1' },
      vector: { x: 1, y: 2, z: 3 },
    },
    {
      definitionUri: getLabwareDefURI(fixture_12_trough as LabwareDefinition2),
      location: { slotName: 'B2' },
      vector: { x: 1, y: 2, z: 3 },
    },
    {
      definitionUri: getLabwareDefURI(fixture_12_trough as LabwareDefinition2),
      location: { slotName: 'B3' },
      vector: { x: 1, y: 2, z: 3 },
    },
    {
      definitionUri: getLabwareDefURI(fixture_12_trough as LabwareDefinition2),
      location: { slotName: 'C1' },
      vector: { x: 1, y: 2, z: 3 },
    },
    {
      definitionUri: getLabwareDefURI(fixture_12_trough as LabwareDefinition2),
      location: { slotName: 'C2' },
      vector: { x: 1, y: 2, z: 3 },
    },
    {
      definitionUri: getLabwareDefURI(fixture_12_trough as LabwareDefinition2),
      location: { slotName: 'C3' },
      vector: { x: 1, y: 2, z: 3 },
    },
  ],
  labwareDefinitions: [fixture_12_trough, fixture_tiprack_10_ul],
}
