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

describe('MultiListPage — Validation', () => {
    const user = userEvent.setup()

    const addUnit = async () => {
        await user.click(screen.getByText('Add Flat'))
    }

    const clickSubmit = async () => {
        const submitBtn = screen.getByRole('button', { name: /Publish Catalog/i })
        await user.click(submitBtn)
    }

    test('shows error when project name is missing', async () => {
        render(<MultiListPage />)
        await addUnit()
        await clickSubmit()
        await waitFor(() => {
            expect(screen.getByText(/Project Name is required/i)).toBeInTheDocument()
        })
    })

    test('shows error when city is missing', async () => {
        render(<MultiListPage />)
        await addUnit()
        await clickSubmit()
        await waitFor(() => {
            expect(screen.getByText(/City is required/i)).toBeInTheDocument()
        })
    })

    test('shows error when unit has no price', async () => {
        render(<MultiListPage />)
        await addUnit()
        await clickSubmit()
        await waitFor(() => {
            expect(screen.getByText(/Valid price.*required/i)).toBeInTheDocument()
        })
    })

    test('shows possession date error for UNDER_CONSTRUCTION unit', async () => {
        render(<MultiListPage />)
        await addUnit()

        await user.click(screen.getByText(/Under Const./i))
        await clickSubmit()

        await waitFor(() => {
            expect(screen.getByText(/Possession date required/i)).toBeInTheDocument()
        })
    })

    test('floor number required error shown for FLAT type', async () => {
        render(<MultiListPage />)
        await addUnit()

        const priceInput = screen.getByPlaceholderText(/0.00/i)
        await user.type(priceInput, '5000000')
        const areaInputs = screen.getAllByPlaceholderText('0')
        await user.type(areaInputs[0], '1200')

        await clickSubmit()

        await waitFor(() => {
            expect(screen.getByText(/Floor number required/i)).toBeInTheDocument()
        })
    })

    test('scrollTo called on validation failure', async () => {
        render(<MultiListPage />)
        await addUnit()
        await clickSubmit()

        await waitFor(() => {
            expect(global.scrollTo).toHaveBeenCalledWith(
                expect.objectContaining({ top: 0, behavior: 'smooth' })
            )
        })
    })
})
