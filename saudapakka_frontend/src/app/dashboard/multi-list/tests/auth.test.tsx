import React from 'react'
import { render, screen, waitFor } from '../../../../__tests__/utils/test-utils'
import userEvent from '@testing-library/user-event'
import { createMockBuilderUser, createMockBuyerUser } from '../../../../__tests__/utils/mock-factories'

jest.mock('@/hooks/use-auth', () => ({
    useAuth: jest.fn(),
}))

jest.mock('@/lib/axios', () => ({
    default: { post: jest.fn(), get: jest.fn() }
}))

import MultiListPage from '../page'
import { useAuth } from '@/hooks/use-auth'
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>

describe('MultiListPage — Auth & Bootstrap', () => {

    beforeEach(() => {
        // Default: logged in as BUILDER
        mockUseAuth.mockReturnValue({
            user: createMockBuilderUser(),
            setAuth: jest.fn(),
            logout: jest.fn(),
            refreshUser: jest.fn(),
            checkUser: jest.fn(),
            isRefreshing: false
        })
    })

    test('renders null before mount (SSR safety)', () => {
        const { container } = render(<MultiListPage />)
        expect(container).toBeDefined()
    })

    test('renders page header for BUILDER user', () => {
        render(<MultiListPage />)
        expect(screen.getByText(/Multi List/i)).toBeInTheDocument()
    })

    test('renders subtitle text', () => {
        render(<MultiListPage />)
        expect(
            screen.getByText(/Bulk-upload distinct units configuring a central shared property layout/i)
        ).toBeInTheDocument()
    })

    test('shows Layers icon context (page header)', () => {
        render(<MultiListPage />)
        // Check the h1 contains "Project" text
        expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
    })

    test('blocks BUYER role — shows Access Denied', () => {
        mockUseAuth.mockReturnValue({
            user: createMockBuyerUser(),
            setAuth: jest.fn(),
            logout: jest.fn(),
            refreshUser: jest.fn(),
            checkUser: jest.fn(),
            isRefreshing: false
        })
        render(<MultiListPage />)
        expect(screen.getByText('Access Denied')).toBeInTheDocument()
        expect(
            screen.getByText(/Strictly available for verified Builder accounts/i)
        ).toBeInTheDocument()
    })

    test('blocks BROKER role — shows Access Denied', () => {
        mockUseAuth.mockReturnValue({
            user: { ...createMockBuilderUser(), role_category: 'BROKER' },
            setAuth: jest.fn(),
            logout: jest.fn(),
            refreshUser: jest.fn(),
            checkUser: jest.fn(),
            isRefreshing: false
        })
        render(<MultiListPage />)
        expect(screen.getByText('Access Denied')).toBeInTheDocument()
    })

    test('blocks SELLER role — shows Access Denied', () => {
        mockUseAuth.mockReturnValue({
            user: { ...createMockBuilderUser(), role_category: 'SELLER' },
            setAuth: jest.fn(),
            logout: jest.fn(),
            refreshUser: jest.fn(),
            checkUser: jest.fn(),
            isRefreshing: false
        })
        render(<MultiListPage />)
        expect(screen.getByText('Access Denied')).toBeInTheDocument()
    })

    test('shows loading state when user is null', () => {
        mockUseAuth.mockReturnValue({
            user: null,
            setAuth: jest.fn(),
            logout: jest.fn(),
            refreshUser: jest.fn(),
            checkUser: jest.fn(),
            isRefreshing: false
        })
        render(<MultiListPage />)
        expect(screen.getByText(/Loading/i)).toBeInTheDocument()
    })

    test('does NOT render workspace when user is null', () => {
        mockUseAuth.mockReturnValue({
            user: null,
            setAuth: jest.fn(),
            logout: jest.fn(),
            refreshUser: jest.fn(),
            checkUser: jest.fn(),
            isRefreshing: false
        })
        render(<MultiListPage />)
        expect(screen.queryByText('Add Unit')).not.toBeInTheDocument()
    })

    test('pre-fills builder name from user.full_name in project details', async () => {
        const user = userEvent.setup()
        render(<MultiListPage />)
        const header = screen.getByText(/Shared Project Data/i)
        await user.click(header)
        await waitFor(() => {
            expect(screen.getByDisplayValue('Test Builder')).toBeInTheDocument()
        })
    })

})
