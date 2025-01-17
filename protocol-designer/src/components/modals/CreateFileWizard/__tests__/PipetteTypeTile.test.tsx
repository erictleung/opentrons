import * as React from 'react'
import i18n from 'i18next'
import { fireEvent, screen } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'
import { FLEX_ROBOT_TYPE, OT2_ROBOT_TYPE } from '@opentrons/shared-data'
import { PipetteTypeTile } from '../PipetteTypeTile'
import { EquipmentOption } from '../EquipmentOption'

import type { FormPipettesByMount } from '../../../../step-forms'
import type { FormState, WizardTileProps } from '../types'

jest.mock('../EquipmentOption')

const mockEquipmentOption = EquipmentOption as jest.MockedFunction<
  typeof EquipmentOption
>

const render = (props: React.ComponentProps<typeof PipetteTypeTile>) => {
  return renderWithProviders(<PipetteTypeTile {...props} />, {
    i18nInstance: i18n,
  })[0]
}

const mockWizardTileProps: Partial<WizardTileProps> = {
  handleChange: jest.fn(),
  handleBlur: jest.fn(),
  goBack: jest.fn(),
  proceed: jest.fn(),
  setFieldValue: jest.fn(),
  values: {
    fields: {
      name: 'mockName',
      description: 'mockDescription',
      organizationOrAuthor: 'mockOrganizationOrAuthor',
      robotType: FLEX_ROBOT_TYPE,
    },
    pipettesByMount: {
      left: { pipetteName: null, tiprackDefURI: null },
      right: { pipetteName: null, tiprackDefURI: null },
    } as FormPipettesByMount,
    modulesByType: {
      heaterShakerModuleType: { onDeck: false, model: null, slot: '1' },
      magneticBlockType: { onDeck: false, model: null, slot: '2' },
      temperatureModuleType: { onDeck: false, model: null, slot: '3' },
      thermocyclerModuleType: { onDeck: false, model: null, slot: '4' },
    },
    additionalEquipment: ['gripper'],
  } as FormState,
}

describe('PipetteTypeTile', () => {
  let props: React.ComponentProps<typeof PipetteTypeTile>

  beforeEach(() => {
    props = {
      ...props,
      ...mockWizardTileProps,
      mount: 'left',
      allowNoPipette: false,
      tileHeader: 'header',
      display96Channel: true,
    }
    mockEquipmentOption.mockReturnValue(<div>mock EquipmentOption</div>)
  })
  it('renders the correct pipettes for flex with no empty pip allowed and btn ctas work', () => {
    render(props)
    screen.getByText('header')
    expect(screen.getAllByText('mock EquipmentOption')).toHaveLength(5)
    screen.getByText('Go back')
    fireEvent.click(screen.getByRole('button', { name: 'GoBack_button' }))
    expect(props.goBack).toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(props.proceed).toHaveBeenCalled()
  })
  it('renders the correct pipettes for flex with empty pip allowed', () => {
    props = {
      ...props,
      allowNoPipette: true,
      display96Channel: false,
    }
    render(props)
    expect(screen.getAllByText('mock EquipmentOption')).toHaveLength(5)
  })
  it('renders correct pipettes for ot-2 with no empty pip allowed', () => {
    const mockWizardTileProps: Partial<WizardTileProps> = {
      values: {
        fields: {
          name: 'mockName',
          description: 'mockDescription',
          organizationOrAuthor: 'mockOrganizationOrAuthor',
          robotType: OT2_ROBOT_TYPE,
        },
        pipettesByMount: {
          left: { pipetteName: null, tiprackDefURI: null },
          right: { pipetteName: null, tiprackDefURI: null },
        } as FormPipettesByMount,
        modulesByType: {
          heaterShakerModuleType: { onDeck: false, model: null, slot: '1' },
          magneticBlockType: { onDeck: false, model: null, slot: '2' },
          temperatureModuleType: { onDeck: false, model: null, slot: '3' },
          thermocyclerModuleType: { onDeck: false, model: null, slot: '4' },
        },
        additionalEquipment: ['gripper'],
      } as FormState,
    }
    props = {
      ...props,
      ...mockWizardTileProps,
      mount: 'left',
      allowNoPipette: false,
      tileHeader: 'header',
    }
    render(props)
    expect(screen.getAllByText('mock EquipmentOption')).toHaveLength(12)
  })
})
