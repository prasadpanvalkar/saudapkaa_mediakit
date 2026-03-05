import React from 'react'
import { render, screen, fireEvent } from '../../../../__tests__/utils/test-utils'
import userEvent from '@testing-library/user-event'

jest.mock('@/hooks/use-auth', () => {
  const mockUser = { role_category: 'BUILDER', full_name: 'Ravi Kumar' };
  return {
    useAuth: () => ({ 
      user: mockUser,
        setAuth: jest.fn(),
        logout: jest.fn(),
        refreshUser: jest.fn(),
        checkUser: jest.fn(),
      isRefreshing: false
    })
  }
})
jest.mock('@/lib/axios', () => ({ default: { post: jest.fn(), get: jest.fn() } }))

import MultiListPage from '../page'

describe('MultiListPage — Project Details', () => {
    const user = userEvent.setup()

    test('Project Details section exists and is collapsed by default', () => {
        render(<MultiListPage />)
        expect(screen.getByText(/Shared Project Data/i)).toBeInTheDocument()
        expect(screen.queryByText(/Project Name \*/i)).not.toBeInTheDocument()
    })

    test('clicking header expands the form', async () => {
        render(<MultiListPage />)
        await user.click(screen.getByText(/Shared Project Data/i))
        expect(screen.getByText(/Project Name \*/i)).toBeVisible()
        expect(screen.getByText(/Locality \*/i)).toBeVisible()
        expect(screen.getByText(/City \*/i)).toBeVisible()
        expect(screen.getByText(/State \*/i)).toBeVisible()
        expect(screen.getByText(/Pincode \*/i)).toBeVisible()
    })

    test('clicking header again collapses the form', async () => {
        render(<MultiListPage />)
        await user.click(screen.getByText(/Shared Project Data/i)) // expand
        await user.click(screen.getByText(/Shared Project Data/i)) // collapse
        expect(screen.queryByText(/Project Name \*/i)).not.toBeInTheDocument()
    })

    test('builder name is pre-filled from user.full_name', async () => {
        render(<MultiListPage />)
        await user.click(screen.getByText(/Shared Project Data/i))
        expect(screen.getByDisplayValue('Ravi Kumar')).toBeInTheDocument()
    })

    test('project name input accepts text', async () => {
        render(<MultiListPage />)
        await user.click(screen.getByText(/Shared Project Data/i))
        const inputs = screen.getAllByRole('textbox')
        const pnameInput = inputs[0] // Assume first is Project Name based on form structure
        await user.type(pnameInput, 'Green Valley Phase 2')
        expect(pnameInput).toHaveValue('Green Valley Phase 2')
    })

    test('summary line updates to show project name when collapsed', async () => {
        render(<MultiListPage />)
        await user.click(screen.getByText(/Shared Project Data/i))
        const inputs = screen.getAllByRole('textbox')
        const pnameInput = inputs[0]
        await user.clear(pnameInput)
        await user.type(pnameInput, 'Sauda Heights')
        await user.click(screen.getByText(/Shared Project Data/i))
        expect(screen.getByText(/Sauda Heights/i)).toBeInTheDocument()
    })

    test('all 3 address line inputs are rendered', async () => {
        render(<MultiListPage />)
        await user.click(screen.getByText(/Shared Project Data/i))
        expect(screen.getByPlaceholderText(/Building name, Society, Flat\/Plot No/i)).toBeInTheDocument()
        expect(screen.getByPlaceholderText(/Street, Road/i)).toBeInTheDocument()
        expect(screen.getByPlaceholderText(/Near landmark/i)).toBeInTheDocument()
    })

    test('SmartLocationPicker is rendered inside project details', async () => {
        render(<MultiListPage />)
        await user.click(screen.getByText(/Shared Project Data/i))
        expect(screen.getByText(/Pin Location on Map/i)).toBeInTheDocument()
        expect(screen.getByText(/Lat:/i)).toBeInTheDocument()
    })

    test('RERA number field is present and optional', async () => {
        render(<MultiListPage />)
        await user.click(screen.getByText(/Shared Project Data/i))
        const labels = screen.getAllByText(/RERA Number/i)
        expect(labels).toHaveLength(1)
    })

})
