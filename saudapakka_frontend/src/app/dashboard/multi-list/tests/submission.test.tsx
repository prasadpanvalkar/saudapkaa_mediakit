import React from 'react'
import { render, screen, waitFor, fireEvent } from '../../../../__tests__/utils/test-utils'
import userEvent from '@testing-library/user-event'

const mockApiPost = jest.fn()
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
jest.mock('@/lib/axios', () => {
    return {
        __esModule: true,
        default: { post: (...args: any[]) => mockApiPost(...args), get: jest.fn() }
    }
})

import MultiListPage from '../page'

const findInputByLabelText = (text: string | RegExp) => {
    const labels = Array.from(document.querySelectorAll('label'));
    const label = labels.find(l => {
        if (typeof text === 'string') return l.textContent?.toLowerCase().includes(text.toLowerCase());
        return text.test(l.textContent || '');
    });
    if (label) {
        if (label.nextElementSibling?.tagName === 'INPUT') return label.nextElementSibling as HTMLInputElement;
        const inputInside = label.nextElementSibling?.querySelector('input');
        if (inputInside) return inputInside as HTMLInputElement;
        const parentDiv = label.closest('div');
        if (parentDiv) {
            const input = parentDiv.querySelector('input');
            if (input) return input as HTMLInputElement;
        }
    }
    throw new Error('Input not found for label: ' + text);
};

const fillValidSession = async (
    user: ReturnType<typeof userEvent.setup>,
    screenObj: typeof screen
) => {
    // Step 1: Expand project details section
    const projectToggle = screenObj.getByText(/Shared Project Data/i)
    await user.click(projectToggle)

    // Step 2: Fill required project fields using custom selector
    const projectNameInput = findInputByLabelText(/project name/i)
    await user.clear(projectNameInput)
    await user.type(projectNameInput, 'Test Project Sauda Heights')

    const localityInput = findInputByLabelText(/locality/i)
    await user.clear(localityInput)
    await user.type(localityInput, 'Main Road')

    const cityInput = findInputByLabelText(/city/i)
    await user.clear(cityInput)
    await user.type(cityInput, 'Jalna')

    const stateInput = findInputByLabelText(/state/i)
    await user.clear(stateInput)
    await user.type(stateInput, 'Maharashtra')

    const pincodeInput = findInputByLabelText(/pincode/i)
    await user.clear(pincodeInput)
    await user.type(pincodeInput, '431203')

    // Step 3: Collapse project details 
    await user.click(projectToggle)

    // Step 4: Add a Flat unit using the dropdown
    // The first unit must be added via the empty state 'Add Flat' button
    await user.click(screenObj.getByText('Add Flat'))

    // Step 5: Fill unit price
    const priceInput = screenObj.getByPlaceholderText(/0.00/i)
    await user.clear(priceInput)
    await user.type(priceInput, '5000000')

    // Step 6: Fill carpet area
    const areaInput = findInputByLabelText(/carpet area/i)
    await user.clear(areaInput)
    await user.type(areaInput, '1200')

    // Step 7: Fill specific_floor 
    const floorInput = findInputByLabelText(/unit floor/i)
    await user.clear(floorInput)
    await user.type(floorInput, '4')

    // Step 8: Fill total_floors 
    const totalFloorsInput = findInputByLabelText(/total floors/i)
    await user.clear(totalFloorsInput)
    await user.type(totalFloorsInput, '10')

    // Step 9: Verify form is valid
    const validationErrorTexts = screenObj.queryAllByText(/Fix errors before submission:/i)
    if (validationErrorTexts.length > 0) {
        const errorList = validationErrorTexts[0].parentElement?.querySelector('ul');
        throw new Error(`fillValidSession: Form still has validation errors: ${errorList?.textContent}`)
    }
}

describe('MultiListPage — Submission', () => {
    const user = userEvent.setup()

    beforeEach(() => {
        mockApiPost.mockReset()
        mockApiPost.mockResolvedValue({ data: { id: 'created-prop-123' } })
    })

    test('submit button shows correct unit count', async () => {
        render(<MultiListPage />)
        await user.click(screen.getByText('Add Flat')) // Unit 1
        await user.click(screen.getByText('Add Unit'))
        const allPlotBtns = screen.getAllByText('Plot')
        const plotBtn = allPlotBtns.find(el => el.tagName !== 'OPTION')
        await user.click(plotBtn!) // Unit 2

        expect(screen.getByRole('button', { name: /Publish Catalog/i })).toBeInTheDocument()
    })

    test('submit calls api.post with FormData', async () => {
        render(<MultiListPage />)
        await fillValidSession(user, screen)

        await user.click(screen.getByRole('button', { name: /Publish Catalog/i }))

        await waitFor(() => {
            expect(mockApiPost).toHaveBeenCalledWith(
                '/api/properties/',
                expect.any(FormData),
                expect.objectContaining({
                    headers: { 'Content-Type': 'multipart/form-data' }
                })
            )
        }, { timeout: 8000 })
    })

    test('FormData includes property_type field', async () => {
        render(<MultiListPage />)
        await fillValidSession(user, screen)

        await user.click(screen.getByRole('button', { name: /Publish Catalog/i }))

        await waitFor(() => {
            expect(mockApiPost).toHaveBeenCalled()
            const formData = mockApiPost.mock.calls[0][1] as FormData
            expect(formData.get('property_type')).toBe('FLAT')
        }, { timeout: 8000 })
    })

    test('FormData includes total_price', async () => {
        render(<MultiListPage />)
        await fillValidSession(user, screen)

        await user.click(screen.getByRole('button', { name: /Publish Catalog/i }))

        await waitFor(() => {
            expect(mockApiPost).toHaveBeenCalled()
            const formData = mockApiPost.mock.calls[0][1] as FormData
            expect(formData.get('total_price')).toBe('5000000')
        }, { timeout: 8000 })
    })

    test('unit card shows "Submitted ✓" after success', async () => {
        render(<MultiListPage />)
        await fillValidSession(user, screen)

        await user.click(screen.getByRole('button', { name: /Publish Catalog/i }))

        await waitFor(() => {
            expect(screen.getByText(/Submitted ✓/i)).toBeInTheDocument()
        }, { timeout: 8000 })
    })

    test('shows success toast after all units submitted', async () => {
        render(<MultiListPage />)
        await fillValidSession(user, screen)

        await user.click(screen.getByRole('button', { name: /Publish Catalog/i }))

        await waitFor(() => {
            expect(screen.getByText(/1 listings submitted/i)).toBeInTheDocument()
        }, { timeout: 8000 })
    })

    test('shows 403 specific error toast when permission denied', async () => {
        mockApiPost.mockRejectedValueOnce({
            response: { status: 403, data: { detail: 'Permission denied' } }
        })

        render(<MultiListPage />)
        await fillValidSession(user, screen)

        await user.click(screen.getByRole('button', { name: /Publish Catalog/i }))

        await waitFor(() => {
            expect(
                screen.getByText(/account lacks permission/i)
            ).toBeInTheDocument()
        }, { timeout: 8000 })
    })

    test('marks unit as error on API failure', async () => {
        mockApiPost.mockRejectedValueOnce({
            response: { status: 400, data: { detail: 'Bad request' } }
        })

        render(<MultiListPage />)
        await fillValidSession(user, screen)

        await user.click(screen.getByRole('button', { name: /Publish Catalog/i }))

        await waitFor(() => {
            expect(screen.getByText(/Error:/i)).toBeInTheDocument()
        }, { timeout: 8000 })
    })

    test('image upload called for tagged media items', async () => {
        render(<MultiListPage />)
        await fillValidSession(user, screen)

        // Upload floor plan for the active unit
        const fileInput = document.querySelector('input[type="file"][accept*="image"]')
        if (fileInput) {
            const file = new File(['img'], 'photo.jpg', { type: 'image/jpeg' })
            await user.upload(fileInput as HTMLElement, file)
        }

        await user.click(screen.getByRole('button', { name: /Publish Catalog/i }))

        await waitFor(() => {
            const calls = mockApiPost.mock.calls
            const propCall = calls.find(c => c[0].includes('/api/properties/'))
            expect(propCall).toBeDefined()
            const formData = propCall[1] as FormData
            expect(formData.has('floor_plans')).toBe(true)
        }, { timeout: 8000 })
    })

    test('submit button is disabled during submission', async () => {
        mockApiPost.mockImplementationOnce(() =>
            new Promise(resolve => setTimeout(() => resolve({ data: { id: 'prop-123' } }), 500))
        )

        render(<MultiListPage />)
        await fillValidSession(user, screen)

        const submitBtn = screen.getByRole('button', { name: /Publish Catalog/i })
        await user.click(submitBtn)

        expect(submitBtn).toBeDisabled()

        await waitFor(() => {
            expect(screen.getByText(/Submitted ✓/i)).toBeInTheDocument()
        }, { timeout: 8000 })
    })

})

describe('MultiListPage — Multi-Property Bulk Listing', () => {
    const user = userEvent.setup()

    beforeEach(() => {
        mockApiPost.mockReset()
        mockApiPost
            .mockResolvedValueOnce({ data: { id: 'prop-flat-001' } })
            .mockResolvedValueOnce({ data: { id: 'prop-plot-001' } })
            .mockResolvedValueOnce({ data: { id: 'prop-villa-001' } })
            .mockResolvedValueOnce({ data: { id: 'prop-commercial-001' } })
            .mockResolvedValueOnce({ data: { id: 'prop-land-001' } })
    })

    const fillProjectDetails = async () => {
        await user.click(screen.getByText(/Shared Project Data/i))
        await user.clear(findInputByLabelText(/project name/i))
        await user.type(findInputByLabelText(/project name/i), 'Multi Type Project')
        await user.clear(findInputByLabelText(/locality/i))
        await user.type(findInputByLabelText(/locality/i), 'Ring Road')
        await user.clear(findInputByLabelText(/city/i))
        await user.type(findInputByLabelText(/city/i), 'Jalna')
        await user.clear(findInputByLabelText(/state/i))
        await user.type(findInputByLabelText(/state/i), 'Maharashtra')
        await user.clear(findInputByLabelText(/pincode/i))
        await user.type(findInputByLabelText(/pincode/i), '431203')
        await user.click(screen.getByText(/Shared Project Data/i))
    }

    const addUnitByType = async (typeLabel: string) => {
        const addUnitBtn = screen.queryByText('Add Unit')
        if (addUnitBtn) {
            await user.click(addUnitBtn)
            const allMatches = screen.getAllByText(new RegExp(`^${typeLabel}$`, 'i'))
            const btn = allMatches.find(el => el.tagName !== 'OPTION')
            await user.click(btn!)
        } else {
            // First unit, no Add Unit menu yet
            await user.click(screen.getByText('Add Flat'))
            // If they asked for something else, we now have 'Add Unit' available
            if (typeLabel !== 'Flat') {
                await user.click(screen.getByText('Add Unit'))
                const allMatches = screen.getAllByText(new RegExp(`^${typeLabel}$`, 'i'))
                const btn = allMatches.find(el => el.tagName !== 'OPTION')
                await user.click(btn!)
            }
        }
    }

    const fillMinimumUnitData = async (opts: {
        price: string
        area: string
        floor?: string
        totalFloors?: string
    }) => {
        const { price, area, floor, totalFloors } = opts

        const priceInput = screen.getByPlaceholderText(/0.00/i)
        await user.clear(priceInput)
        await user.type(priceInput, price)

        const areaLabels = Array.from(document.querySelectorAll('label')).filter(l => l.textContent?.toLowerCase().includes('area'));
        // Usually carpet area or plot area
        let areaInputFound = false;
        for (const label of areaLabels) {
            if (label.textContent?.includes('Carpet Area') || label.textContent?.includes('Total Plot Area')) {
                const input = label.nextElementSibling?.tagName === 'INPUT'
                    ? label.nextElementSibling as HTMLInputElement
                    : label.closest('div')?.querySelector('input') as HTMLInputElement;
                if (input) {
                    await user.clear(input);
                    await user.type(input, area);
                    areaInputFound = true;
                    break;
                }
            }
        }
        if (!areaInputFound) {
            throw new Error('Could not find area input for unit');
        }

        if (floor) {
            const floorInput = findInputByLabelText(/unit floor|specific floor/i)
            if (floorInput) {
                await user.clear(floorInput)
                await user.type(floorInput, floor)
            }
        }

        if (totalFloors) {
            const totalInput = findInputByLabelText(/total floors/i)
            if (totalInput) {
                await user.clear(totalInput)
                await user.type(totalInput, totalFloors)
            }
        }
    }

    test('submit button label updates as units are added', async () => {
        render(<MultiListPage />)

        await addUnitByType('Flat')
        expect(screen.getAllByText('1')[0]).toBeInTheDocument()
        expect(screen.getByText(/ready to publish/i)).toBeInTheDocument()

        await addUnitByType('Plot')
        expect(screen.getAllByText('2')[0]).toBeInTheDocument()
        expect(screen.getByText(/ready to publish/i)).toBeInTheDocument()

        await addUnitByType('Land')
        expect(screen.getAllByText('3')[0]).toBeInTheDocument()
        expect(screen.getByText(/ready to publish/i)).toBeInTheDocument()
    })

    test('submits Flat + Plot units — api called twice with FormData', async () => {
        render(<MultiListPage />)
        await fillProjectDetails()

        await addUnitByType('Flat')
        await fillMinimumUnitData({ price: '5000000', area: '1200', floor: '4', totalFloors: '10' })

        await addUnitByType('Plot')
        await fillMinimumUnitData({ price: '3000000', area: '2400' })

        await user.click(screen.getByRole('button', { name: /Publish Catalog/i }))

        await waitFor(() => {
            expect(mockApiPost).toHaveBeenCalledTimes(2)
        }, { timeout: 8000 })

        const firstCall = mockApiPost.mock.calls[0]
        expect(firstCall[0]).toBe('/api/properties/')
        expect(firstCall[1]).toBeInstanceOf(FormData)
        expect((firstCall[1] as FormData).get('property_type')).toBe('FLAT')

        const secondCall = mockApiPost.mock.calls[1]
        expect((secondCall[1] as FormData).get('property_type')).toBe('PLOT')
    })

    test('submits Flat + Villa + Commercial — api called 3 times', async () => {
        render(<MultiListPage />)
        await fillProjectDetails()

        await addUnitByType('Flat')
        await fillMinimumUnitData({ price: '4500000', area: '1100', floor: '2', totalFloors: '7' })

        await addUnitByType('Villa/Bungalow')
        await fillMinimumUnitData({ price: '8000000', area: '2500', floor: '1', totalFloors: '2' }) // Villa specific floor not standard but handled 

        await addUnitByType('Commercial')
        await fillMinimumUnitData({ price: '6000000', area: '800', floor: '1', totalFloors: '5' })

        await user.click(screen.getByRole('button', { name: /Publish Catalog/i }))

        await waitFor(() => {
            expect(mockApiPost).toHaveBeenCalledTimes(3)
        }, { timeout: 10000 })

        const callTypes = mockApiPost.mock.calls.map(c => (c[1] as FormData).get('property_type'))
        expect(callTypes).toContain('FLAT')
        expect(callTypes).toContain('VILLA_BUNGALOW')
        expect(callTypes).toContain('COMMERCIAL_UNIT')
    })

    test('submits all 5 property types in one session', async () => {
        render(<MultiListPage />)
        await fillProjectDetails()

        await addUnitByType('Flat')
        await fillMinimumUnitData({ price: '5000000', area: '1200', floor: '3', totalFloors: '8' })

        await addUnitByType('Plot')
        await fillMinimumUnitData({ price: '2500000', area: '1800' })

        await addUnitByType('Land')
        await fillMinimumUnitData({ price: '1500000', area: '5000' })

        await addUnitByType('Villa/Bungalow')
        await fillMinimumUnitData({ price: '9000000', area: '3000', floor: '1', totalFloors: '2' })

        await addUnitByType('Commercial')
        await fillMinimumUnitData({ price: '7000000', area: '1500', floor: '2', totalFloors: '6' })

        await user.click(screen.getByRole('button', { name: /Publish Catalog/i }))

        await waitFor(() => {
            expect(mockApiPost).toHaveBeenCalledTimes(5)
        }, { timeout: 15000 })

        mockApiPost.mock.calls.forEach((call) => {
            expect(call[1]).toBeInstanceOf(FormData)
            expect(call[2]).toMatchObject({ headers: { 'Content-Type': 'multipart/form-data' } })
        })
    })

    test('each unit FormData has correct unique price and area', async () => {
        render(<MultiListPage />)
        await fillProjectDetails()

        await addUnitByType('Flat')
        await fillMinimumUnitData({ price: '5555555', area: '1111', floor: '5', totalFloors: '10' })

        await addUnitByType('Plot')
        await fillMinimumUnitData({ price: '3333333', area: '2222' })

        await user.click(screen.getByRole('button', { name: /Publish Catalog/i }))

        await waitFor(() => {
            expect(mockApiPost).toHaveBeenCalledTimes(2)
        }, { timeout: 8000 })

        const flatFormData = mockApiPost.mock.calls[0][1] as FormData
        const plotFormData = mockApiPost.mock.calls[1][1] as FormData

        expect(flatFormData.get('total_price')).toBe('5555555')
        expect(plotFormData.get('total_price')).toBe('3333333')

        expect(flatFormData.get('carpet_area')).toBe('1111')
        expect(plotFormData.get('plot_area') || plotFormData.get('carpet_area')).toBe('2222')
    })

    test('shared project details (city, locality) are in every unit payload', async () => {
        render(<MultiListPage />)
        await fillProjectDetails()

        await addUnitByType('Flat')
        await fillMinimumUnitData({ price: '5000000', area: '1200', floor: '3', totalFloors: '8' })

        await addUnitByType('Plot')
        await fillMinimumUnitData({ price: '2000000', area: '1500' })

        await user.click(screen.getByRole('button', { name: /Publish Catalog/i }))

        await waitFor(() => {
            expect(mockApiPost).toHaveBeenCalledTimes(2)
        }, { timeout: 8000 })

        mockApiPost.mock.calls.forEach(call => {
            const fd = call[1] as FormData
            expect(fd.get('city')).toBe('Jalna')
            expect(fd.get('locality')).toBe('Ring Road')
            expect(fd.get('state')).toBe('Maharashtra')
            expect(fd.get('pincode')).toBe('431203')
        })
    })

    test('all unit cards show submitted status after bulk success', async () => {
        render(<MultiListPage />)
        await fillProjectDetails()

        await addUnitByType('Flat')
        await fillMinimumUnitData({ price: '5000000', area: '1200', floor: '3', totalFloors: '8' })

        await addUnitByType('Plot')
        await fillMinimumUnitData({ price: '2000000', area: '1500' })

        await user.click(screen.getByRole('button', { name: /Publish Catalog/i }))

        await waitFor(() => {
            const submittedBadges = screen.getAllByText(/Submitted ✓/i)
            expect(submittedBadges.length).toBeGreaterThanOrEqual(2)
        }, { timeout: 8000 })
    })

    test('success toast shows correct submitted count', async () => {
        render(<MultiListPage />)
        await fillProjectDetails()

        await addUnitByType('Flat')
        await fillMinimumUnitData({ price: '5000000', area: '1200', floor: '3', totalFloors: '8' })

        await addUnitByType('Plot')
        await fillMinimumUnitData({ price: '2000000', area: '1500' })

        await user.click(screen.getByRole('button', { name: /Publish Catalog/i }))

        await waitFor(() => {
            expect(screen.getByText(/2 listings submitted/i)).toBeInTheDocument()
        }, { timeout: 8000 })
    })

    test('partial failure — first unit succeeds, second unit fails', async () => {
        mockApiPost.mockReset()
        mockApiPost
            .mockResolvedValueOnce({ data: { id: 'prop-001' } })
            .mockRejectedValueOnce({ response: { status: 400, data: { detail: 'Invalid data' } } })

        render(<MultiListPage />)
        await fillProjectDetails()

        await addUnitByType('Flat')
        await fillMinimumUnitData({ price: '5000000', area: '1200', floor: '3', totalFloors: '8' })

        await addUnitByType('Plot')
        await fillMinimumUnitData({ price: '2000000', area: '1500' })

        await user.click(screen.getByRole('button', { name: /Publish Catalog/i }))

        await waitFor(() => {
            expect(screen.getByText(/Submitted ✓/i)).toBeInTheDocument()
            expect(screen.getByText(/Error: Invalid data/i)).toBeInTheDocument()
        }, { timeout: 8000 })

        expect(screen.queryByText(/2 listings submitted/i)).not.toBeInTheDocument()
    })

    test('project_name field is identical in all unit FormData payloads', async () => {
        render(<MultiListPage />)
        await fillProjectDetails()

        await addUnitByType('Flat')
        await fillMinimumUnitData({ price: '5000000', area: '1200', floor: '3', totalFloors: '8' })

        await addUnitByType('Commercial')
        await fillMinimumUnitData({ price: '6000000', area: '900', floor: '1', totalFloors: '5' })

        await user.click(screen.getByRole('button', { name: /Publish Catalog/i }))

        await waitFor(() => {
            expect(mockApiPost).toHaveBeenCalledTimes(2)
        }, { timeout: 8000 })

        mockApiPost.mock.calls.forEach(call => {
            const fd = call[1] as FormData
            expect(fd.get('project_name')).toBe('Multi Type Project')
        })
    })

    test('auto-generated title is different for each property type unit', async () => {
        render(<MultiListPage />)
        await fillProjectDetails()

        await addUnitByType('Flat')
        await fillMinimumUnitData({ price: '5000000', area: '1200', floor: '3', totalFloors: '8' })
        // Title is now always auto-generated — no 'Use Title' button

        await addUnitByType('Plot')
        await fillMinimumUnitData({ price: '2000000', area: '1500' })
        // Title is now always auto-generated — no 'Use Title' button

        await user.click(screen.getByRole('button', { name: /Publish Catalog/i }))

        await waitFor(() => {
            expect(mockApiPost).toHaveBeenCalledTimes(2)
        }, { timeout: 8000 })

        const flatTitle = (mockApiPost.mock.calls[0][1] as FormData).get('title') as string
        const plotTitle = (mockApiPost.mock.calls[1][1] as FormData).get('title') as string

        expect(flatTitle).not.toBe(plotTitle)
        expect(flatTitle).toMatch(/flat|bhk/i)
        expect(plotTitle).toMatch(/plot/i)
    })

    test('403 error on first unit aborts remaining units submission', async () => {
        mockApiPost.mockReset()
        mockApiPost.mockRejectedValueOnce({
            response: { status: 403, data: { detail: 'Account not verified' } }
        })

        render(<MultiListPage />)
        await fillProjectDetails()

        await addUnitByType('Flat')
        await fillMinimumUnitData({ price: '5000000', area: '1200', floor: '3', totalFloors: '8' })

        await addUnitByType('Plot')
        await fillMinimumUnitData({ price: '2000000', area: '1500' })

        await user.click(screen.getByRole('button', { name: /Publish Catalog/i }))

        await waitFor(() => {
            expect(screen.getByText(/account lacks permission/i)).toBeInTheDocument()
        }, { timeout: 5000 })

        expect(mockApiPost).toHaveBeenCalledTimes(1)
    })

})
