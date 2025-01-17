import * as React from 'react'
import i18n from 'i18next'
import { renderWithProviders } from '@opentrons/components'
import { FLEX_ROBOT_TYPE, OT2_ROBOT_TYPE } from '@opentrons/shared-data'
import { getDisableModuleRestrictions } from '../../../../feature-flags/selectors'
import { CrashInfoBox } from '../../../modules'
import { ModuleFields } from '../../FilePipettesModal/ModuleFields'
import { ModulesAndOtherTile } from '../ModulesAndOtherTile'
import { EquipmentOption } from '../EquipmentOption'
import type { FormPipettesByMount } from '../../../../step-forms'
import type { FormState, WizardTileProps } from '../types'
import { fireEvent, screen } from '@testing-library/react'

jest.mock('../../../modules')
jest.mock('../../FilePipettesModal/ModuleFields')
jest.mock('../EquipmentOption')
jest.mock('../../../../feature-flags/selectors')
jest.mock('../../FilePipettesModal')

const mockEquipmentOption = EquipmentOption as jest.MockedFunction<
  typeof EquipmentOption
>
const mockCrashInfoBox = CrashInfoBox as jest.MockedFunction<
  typeof CrashInfoBox
>
const mockGetDisableModuleRestrictions = getDisableModuleRestrictions as jest.MockedFunction<
  typeof getDisableModuleRestrictions
>
const mockModuleFields = ModuleFields as jest.MockedFunction<
  typeof ModuleFields
>
const render = (props: React.ComponentProps<typeof ModulesAndOtherTile>) => {
  return renderWithProviders(<ModulesAndOtherTile {...props} />, {
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
      left: { pipetteName: 'mockPipetteName', tiprackDefURI: 'mocktip' },
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

describe('ModulesAndOtherTile', () => {
  let props: React.ComponentProps<typeof ModulesAndOtherTile>

  beforeEach(() => {
    props = {
      ...props,
      ...mockWizardTileProps,
    } as WizardTileProps
    mockCrashInfoBox.mockReturnValue(<div> mock CrashInfoBox</div>)
    mockEquipmentOption.mockReturnValue(<div>mock EquipmentOption</div>)
    mockGetDisableModuleRestrictions.mockReturnValue(false)
    mockModuleFields.mockReturnValue(<div>mock ModuleFields</div>)
  })

  it('renders correct module, gripper and trash length for flex with disabled button', () => {
    render(props)
    screen.getByText('Choose additional items')
    expect(screen.getAllByText('mock EquipmentOption')).toHaveLength(7)
    screen.getByText('Go back')
    fireEvent.click(screen.getByRole('button', { name: 'GoBack_button' }))
    expect(props.goBack).toHaveBeenCalled()
    expect(screen.getByText('Review file details')).toBeDisabled()
  })
  it('renders correct module, gripper and trash length for flex', () => {
    props = {
      ...props,
      values: {
        ...mockWizardTileProps.values,
        additionalEquipment: ['trashBin'],
      },
    } as WizardTileProps
    render(props)
    screen.getByText('Choose additional items')
    expect(screen.getAllByText('mock EquipmentOption')).toHaveLength(7)
    screen.getByText('Go back')
    fireEvent.click(screen.getByRole('button', { name: 'GoBack_button' }))
    expect(props.goBack).toHaveBeenCalled()
    fireEvent.click(screen.getByText('Review file details'))
    expect(props.proceed).toHaveBeenCalled()
  })
  it('renders correct module length for ot-2', () => {
    const mockWizardTileProps: Partial<WizardTileProps> = {
      errors: { modulesByType: {} },
      touched: { modulesByType: {} },
      values: {
        fields: {
          robotType: OT2_ROBOT_TYPE,
        },
        pipettesByMount: {
          left: { pipetteName: 'p1000_single', tiprackDefURI: 'mocktip' },
          right: { pipetteName: null, tiprackDefURI: null },
        } as FormPipettesByMount,
        modulesByType: {
          heaterShakerModuleType: { onDeck: false, model: null, slot: '1' },
          magneticModuleType: { onDeck: false, model: null, slot: '2' },
          temperatureModuleType: { onDeck: false, model: null, slot: '3' },
          thermocyclerModuleType: { onDeck: false, model: null, slot: '4' },
        },
      } as FormState,
    }
    props = {
      ...props,
      ...mockWizardTileProps,
    } as WizardTileProps
    render(props)
    screen.getByText('Choose additional items')
    screen.getByText('mock ModuleFields')
    screen.getByText('mock CrashInfoBox')
    screen.getByText('Go back')
    screen.getByText('Review file details')
  })
})
