import React from 'react'
import { render, screen, waitFor } from '../../../../__tests__/utils/test-utils'
import userEvent from '@testing-library/user-event'

jest.mock('@/hooks/use-auth', () => {
    const mockUser = { role_category: 'BUILDER', full_name: 'Builder' };
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

describe('MultiListPage — Unit Management', () => {
    const user = userEvent.setup()

    test('shows empty state when no units exist', () => {
        render(<MultiListPage />)
        expect(screen.getByText(/Initiate Bulk Construction View/i)).toBeInTheDocument()
    })

    test('"Add Unit" button opens dropdown', async () => {
        render(<MultiListPage />)
        await user.click(screen.getByText('Add Flat')) // Default state button
        // After adding first flat, workspace panel is visible
        expect(screen.getByText('Unit 101')).toBeInTheDocument()
        await user.click(screen.getByText('Add Unit'))
        expect(screen.getByRole('button', { name: 'Flat' })).toBeVisible()
        expect(screen.getByRole('button', { name: 'Plot' })).toBeVisible()
        expect(screen.getByRole('button', { name: /Villa\/Bungalow/i })).toBeVisible()
        expect(screen.getByRole('button', { name: /Commercial/i })).toBeVisible()
        expect(screen.getByRole('button', { name: 'Land' })).toBeVisible()
    })

    test('dropdown shows all 5 property types', async () => {
        render(<MultiListPage />)
        await user.click(screen.getByText('Add Flat'))
        await user.click(screen.getByText('Add Unit'))

        const EXPECTED_TYPES = [/Flat/i, /Villa\/Bungalow/i, /Plot/i, /Land/i, /Commercial/i]
        EXPECTED_TYPES.forEach(type => {
            expect(screen.getByRole('button', { name: type })).toBeInTheDocument()
        })
    })

    test('adding Flat creates Unit 101 and shows it in left panel', async () => {
        render(<MultiListPage />)
        await user.click(screen.getByText('Add Flat')) // from empty state
        expect(screen.getByText('Unit 101')).toBeInTheDocument()
    })

    test('new unit auto-increments name: Unit 101, 102, 103', async () => {
        render(<MultiListPage />)

        await user.click(screen.getByText('Add Flat')) // Unit 101

        await user.click(screen.getByText('Add Unit'))
        await user.click(screen.getByRole('button', { name: 'Flat' })) // Unit 102

        await user.click(screen.getByText('Add Unit'))
        await user.click(screen.getByRole('button', { name: 'Plot' })) // Unit 103

        expect(screen.getByText('Unit 101')).toBeInTheDocument()
        expect(screen.getByText('Unit 102')).toBeInTheDocument()
        expect(screen.getByText('Unit 103')).toBeInTheDocument()
    })

    test('newly added unit becomes active — shows "Editing Data" indicator', async () => {
        render(<MultiListPage />)
        await user.click(screen.getByText('Add Flat'))
        expect(screen.getByText(/Editing Data/i)).toBeInTheDocument()
    })

    test('clicking a different unit card switches active unit', async () => {
        render(<MultiListPage />)

        await user.click(screen.getByText('Add Flat')) // 101
        await user.click(screen.getByText('Add Unit'))
        await user.click(screen.getByRole('button', { name: 'Plot' })) // 102

        // Click Unit 101 to switch back
        await user.click(screen.getByText('Unit 101'))

        const editingTexts = screen.getAllByText(/Editing Data/i)
        expect(editingTexts).toHaveLength(1)
    })

    test('type badge shows correct label on unit card', async () => {
        render(<MultiListPage />)
        await user.click(screen.getByText('Add Flat'))
        expect(screen.getByText(/FLAT/)).toBeInTheDocument()
    })

    test('new unit card shows missing info status (red dot)', async () => {
        render(<MultiListPage />)
        await user.click(screen.getByText('Add Flat'))
        const redDot = document.querySelector('.bg-red-500')
        expect(redDot).toBeInTheDocument()
    })

    test('unit card shows complete status when price and area are filled', async () => {
        render(<MultiListPage />)
        await user.click(screen.getByText('Add Flat'))

        const priceInput = screen.getByPlaceholderText(/0.00/i)
        await user.type(priceInput, '5000000')

        // Using the second input with '0' placeholder which is carpet area (first is price_per_sqft)
        const areaInputs = screen.getAllByPlaceholderText('0')
        await user.type(areaInputs[1], '1200') // type to carpet area

        await waitFor(() => {
            const greenDot = document.querySelector('.bg-green-500')
            expect(greenDot).toBeInTheDocument()
        })
    })

    test('unit name is inline-editable in right panel header', async () => {
        render(<MultiListPage />)
        await user.click(screen.getByText('Add Flat'))

        const nameInput = screen.getByDisplayValue('Unit 101')
        await user.clear(nameInput)
        await user.type(nameInput, 'Block A - Flat 4B')

        expect(screen.getByDisplayValue('Block A - Flat 4B')).toBeInTheDocument()
    })

    test('dropdown closes when clicking outside', async () => {
        render(<MultiListPage />)
        await user.click(screen.getByText('Add Flat'))
        await user.click(screen.getByText('Add Unit'))
        expect(screen.getByRole('button', { name: 'Flat' })).toBeVisible()

        await user.click(document.body)

        await waitFor(() => {
            expect(screen.queryByRole('button', { name: /Villa\/Bungalow/i })).not.toBeInTheDocument()
        })
    })

})
