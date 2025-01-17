import * as React from 'react'
import { fireEvent, screen } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'
import { STAGING_AREA_SLOT_WITH_WASTE_CHUTE_RIGHT_ADAPTER_NO_COVER_FIXTURE } from '@opentrons/shared-data'
import { i18n } from '../../../../../i18n'
import { SetupFixtureList } from '../SetupFixtureList'
import { NotConfiguredModal } from '../NotConfiguredModal'
import { LocationConflictModal } from '../LocationConflictModal'
import { DeckFixtureSetupInstructionsModal } from '../../../../DeviceDetailsDeckConfiguration/DeckFixtureSetupInstructionsModal'

import type { CutoutConfigAndCompatibility } from '../../../../../resources/deck_configuration/hooks'

jest.mock('../../../../../resources/deck_configuration/hooks')
jest.mock('../LocationConflictModal')
jest.mock('../NotConfiguredModal')
jest.mock(
  '../../../../DeviceDetailsDeckConfiguration/DeckFixtureSetupInstructionsModal'
)

const mockLocationConflictModal = LocationConflictModal as jest.MockedFunction<
  typeof LocationConflictModal
>
const mockNotConfiguredModal = NotConfiguredModal as jest.MockedFunction<
  typeof NotConfiguredModal
>
const mockDeckFixtureSetupInstructionsModal = DeckFixtureSetupInstructionsModal as jest.MockedFunction<
  typeof DeckFixtureSetupInstructionsModal
>

const mockDeckConfigCompatibility: CutoutConfigAndCompatibility[] = [
  {
    cutoutId: 'cutoutD3',
    cutoutFixtureId: STAGING_AREA_SLOT_WITH_WASTE_CHUTE_RIGHT_ADAPTER_NO_COVER_FIXTURE,
    requiredAddressableAreas: ['D4'],
    compatibleCutoutFixtureIds: [
      STAGING_AREA_SLOT_WITH_WASTE_CHUTE_RIGHT_ADAPTER_NO_COVER_FIXTURE,
    ],
    missingLabwareDisplayName: null,
  },
]

const render = (props: React.ComponentProps<typeof SetupFixtureList>) => {
  return renderWithProviders(<SetupFixtureList {...props} />, {
    i18nInstance: i18n,
  })
}

describe('SetupFixtureList', () => {
  let props: React.ComponentProps<typeof SetupFixtureList>
  beforeEach(() => {
    props = {
      deckConfigCompatibility: mockDeckConfigCompatibility,
    }
    mockLocationConflictModal.mockReturnValue(
      <div>mock location conflict modal</div>
    )
    mockNotConfiguredModal.mockReturnValue(<div>mock not configured modal</div>)
    mockDeckFixtureSetupInstructionsModal.mockReturnValue(
      <div>mock DeckFixtureSetupInstructionsModal</div>
    )
  })

  it('should render the headers and a fixture with configured status', () => {
    render(props)
    screen.getByText('Fixture')
    screen.getByText('Location')
    screen.getByText('Status')
    screen.getByText('Waste chute with staging area slot')
    screen.getByRole('button', { name: 'View setup instructions' })
    screen.getByText('D3')
    screen.getByText('Configured')
  })

  it('should render the mock setup instructions modal, when clicking view setup instructions', () => {
    render(props)
    fireEvent.click(
      screen.getByRole('button', { name: 'View setup instructions' })
    )
    screen.getByText('mock DeckFixtureSetupInstructionsModal')
  })

  // TODO(bh, 2023-11-14): implement test cases when example JSON protocol fixtures exist
  // it('should render the headers and a fixture with conflicted status', () => {
  //   render(props)
  //   screen.getByText('Location conflict')
  //   screen.getByRole('button', { name: 'Update deck' }).click()
  //   screen.getByText('mock location conflict modal')
  // })
  // it('should render the headers and a fixture with not configured status and button', () => {
  //   render(props)
  //   screen.getByText('Not configured')
  //   screen.getByRole('button', { name: 'Update deck' }).click()
  //   screen.getByText('mock not configured modal')
  // })
})
