import React from 'react';
import { render, screen, fireEvent } from '../../test-utils';
import { vi } from 'vitest';
import Button from './Button';

describe('Button Component', () => {
    test('renders button with children', () => {
        render(<Button>Click me</Button>);
        expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
    });

    test('handles click events', () => {
        const handleClick = vi.fn();
        render(<Button onClick={handleClick}>Click me</Button>);

        fireEvent.click(screen.getByRole('button'));
        expect(handleClick).toHaveBeenCalledTimes(1);
    });

    test('applies primary variant styles by default', () => {
        render(<Button>Primary Button</Button>);
        const button = screen.getByRole('button');
        expect(button).toHaveClass('bg-primary-600');
    });

    test('applies secondary variant styles', () => {
        render(<Button variant="secondary">Secondary Button</Button>);
        const button = screen.getByRole('button');
        expect(button).toHaveClass('bg-gray-600');
    });

    test('applies danger variant styles', () => {
        render(<Button variant="danger">Danger Button</Button>);
        const button = screen.getByRole('button');
        expect(button).toHaveClass('bg-red-600');
    });

    test('disables button when loading', () => {
        render(<Button loading>Loading Button</Button>);
        const button = screen.getByRole('button');
        expect(button).toBeDisabled();
        expect(button).toHaveClass('opacity-75');
        expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    test('disables button and prevents click when disabled', () => {
        const handleClick = vi.fn();
        render(<Button disabled onClick={handleClick}>Disabled Button</Button>);

        const button = screen.getByRole('button');
        expect(button).toBeDisabled();
        fireEvent.click(button);
        expect(handleClick).not.toHaveBeenCalled();
    });

    test('applies full width style when fullWidth prop is true', () => {
        render(<Button fullWidth>Full Width Button</Button>);
        expect(screen.getByRole('button')).toHaveClass('w-full');
    });

    test('applies custom className when provided', () => {
        render(<Button className="custom-class">Custom Button</Button>);
        expect(screen.getByRole('button')).toHaveClass('custom-class');
    });

    test('renders with icon when provided', () => {
        const TestIcon = () => <svg data-testid="test-icon" />;
        render(<Button icon={<TestIcon />}>Button with Icon</Button>);

        expect(screen.getByTestId('test-icon')).toBeInTheDocument();
        expect(screen.getByText('Button with Icon')).toBeInTheDocument();
    });
});

// --- Note: The rest of the tests from component-tests.js ---
// --- should be moved to their respective spec files,      ---
// --- e.g., CountdownTimer.spec.jsx, LoginForm.spec.jsx etc. --- 