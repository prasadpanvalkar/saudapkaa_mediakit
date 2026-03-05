import '@testing-library/jest-dom';

// Mock next/navigation globally
jest.mock('next/navigation', () => ({
    useRouter: () => ({
        push: jest.fn(),
        replace: jest.fn(),
        prefetch: jest.fn(),
        back: jest.fn(),
        pathname: '/dashboard/multi-list',
    }),
    usePathname: () => '/dashboard/multi-list',
    useSearchParams: () => new URLSearchParams(),
}));

// Mock next/dynamic globally
jest.mock('next/dynamic', () => (fn: () => Promise<any>, opts: any) => {
    const MockDynamic = (props: any) => {
        if (opts?.loading) return null;
        return null;
    };
    MockDynamic.displayName = 'DynamicComponent';
    return MockDynamic;
});

// Suppress console.error for known React warnings in tests
const originalConsoleError = console.error;
beforeAll(() => {
    console.error = (...args: any[]) => {
        if (
            typeof args[0] === 'string' &&
            (args[0].includes('Warning: ReactDOM.render') ||
                args[0].includes('act(...)') ||
                args[0].includes('Warning: An update'))
        ) return;
        originalConsoleError.call(console, ...args);
    };
});

afterAll(() => {
    console.error = originalConsoleError;
});

// Mock URL.createObjectURL and revokeObjectURL
global.URL.createObjectURL = jest.fn(() => 'blob:mock-url-123');
global.URL.revokeObjectURL = jest.fn();

// Mock crypto.randomUUID
let idCounter = 0;
Object.defineProperty(global, 'crypto', {
    value: {
        randomUUID: jest.fn(() => `mocked-uuid-${++idCounter}`),
    },
});

// Mock window.scrollTo
global.scrollTo = jest.fn();
