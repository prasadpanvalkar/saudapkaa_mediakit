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

describe('MultiListPage — Auto-Generated Listing Info', () => {
    const user = userEvent.setup()

    const addFlatUnit = async () => {
        try {
            await user.click(screen.getByText('Add Flat'))
        } catch (e) {
            await user.click(screen.getByText('Add Unit'))
            await user.click(screen.getByText('Flat'))
        }
    }

    test('Auto-Generated Listing Info card is shown when unit is active', async () => {
        render(<MultiListPage />)
        await addFlatUnit()
        expect(screen.getByText(/Auto-Generated Listing Info/i)).toBeInTheDocument()
    })

    test('generated title includes "Flat for Sale" by default', async () => {
        render(<MultiListPage />)
        await addFlatUnit()
        expect(screen.getAllByText(/Flat for Sale/i).length).toBeGreaterThan(0)
    })

    test('generated title includes BHK config', async () => {
        render(<MultiListPage />)
        await addFlatUnit()
        expect(screen.getAllByText(/2 BHK/i).length).toBeGreaterThan(0)
    })

    test('"Use Title" button sets unit.title and marks Info Set', async () => {
        render(<MultiListPage />)
        await addFlatUnit()

        await user.click(screen.getByText(/Use Title/i))

        await waitFor(() => {
            expect(screen.getByText(/Info Set/i)).toBeInTheDocument()
        })
    })

    test('"Use Desc" button sets unit.description', async () => {
        render(<MultiListPage />)
        await addFlatUnit()

        await user.click(screen.getByText(/Use Desc/i))

        await waitFor(() => {
            expect(screen.getByText(/Info Set/i)).toBeInTheDocument()
        })
    })

    test('generated title switches to RENT when listing type changes', async () => {
        render(<MultiListPage />)
        await addFlatUnit()

        const selects = screen.getAllByRole('combobox')
        const listingSelect = selects[0]
        await user.selectOptions(listingSelect, 'RENT')

        await waitFor(() => {
            expect(screen.getAllByText(/for Rent/i).length).toBeGreaterThan(0)
        })
    })

})
