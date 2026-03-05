import React from 'react';
import { render, RenderOptions } from '@testing-library/react';

const AllProviders = ({ children }: { children: React.ReactNode }) => {
    return <>{children}</>;
};

const customRender = (ui: React.ReactElement, options?: RenderOptions) =>
    render(ui, { wrapper: AllProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };
