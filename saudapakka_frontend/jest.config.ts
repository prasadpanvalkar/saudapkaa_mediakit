import type { Config } from 'jest';
import nextJest from 'next/jest.js';

const createJestConfig = nextJest({
    dir: './',
});

const config: Config = {
    displayName: 'SaudPakka Frontend',
    testEnvironment: 'jsdom',

    setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],

    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '\\.(jpg|jpeg|png|gif|svg|webp)$': '<rootDir>/__mocks__/fileMock.ts',
    },

    collectCoverageFrom: [
        'src/app/dashboard/multi-list/**/*.{ts,tsx}',
        'src/components/builder/**/*.{ts,tsx}',
        '!src/**/*.d.ts',
        '!src/**/*.stories.{ts,tsx}',
        '!src/**/types.ts',
        '!src/**/__tests__/**',
        '!src/**/tests/**',
    ],
    coverageThreshold: {
        global: {
            branches: 45,
            functions: 40,
            lines: 50,
            statements: 50,
        },
    },
    coverageReporters: ['html', 'text-summary', 'lcov', 'json-summary'],
    coverageDirectory: '<rootDir>/coverage',

    testMatch: [
        '<rootDir>/src/**/__tests__/**/*.test.{ts,tsx}',
        '<rootDir>/src/**/*.test.{ts,tsx}',
    ],

    testTimeout: 15000,
    clearMocks: true,
    restoreMocks: true,
};

export default createJestConfig(config);
