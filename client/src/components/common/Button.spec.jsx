import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Button from './Button'; // Assuming Button.jsx is in the same directory

// Mocking Jest functions if using Vitest with Jest syntax
// If using pure Vitest, use vi.fn() instead of jest.fn()
global.jest = {
    fn: (implementation) => {
        let callCount = 0;
        const mockFn = (...args) => {
            callCount++;
            return implementation ? implementation(...args) : undefined;
        };
        mockFn.mock = { calls: [] }; // Basic mock properties
        mockFn.toHaveBeenCalledTimes = (count) => expect(callCount).toBe(count);
        return mockFn;
    },
};

// Matchers like toBeInTheDocument are usually setup globally (e.g., in setupTests.js)
// For simplicity here, we'll assume they exist or use basic checks.
// You might need to install @testing-library/jest-dom

// 1. Button Component Tests
describe('Button Component', () => {
    test('renders correctly with children', () => {
        render(<Button>Test Button</Button>);
        const button = screen.getByRole('button', { name: /Test Button/i });
        expect(button).toBeTruthy(); // Basic check
        expect(button.textContent).toBe('Test Button');
    });

    test('applies default primary variant styles', () => {
        render(<Button>Test Button</Button>);
        const button = screen.getByRole('button', { name: /Test Button/i });
        // Check for classes associated with the primary variant
        expect(button.className).toContain('from-royalBlue');
        expect(button.className).toContain('to-gold');
    });

    test('applies specified variant styles (secondary)', () => {
        render(<Button variant="secondary">Test Button</Button>);
        const button = screen.getByRole('button', { name: /Test Button/i });
        // Check for classes associated with the secondary variant
        expect(button.className).toContain('bg-navy');
        expect(button.className).toContain('text-gold');
        expect(button.className).toContain('border-gold');
        expect(button.className).not.toContain('from-royalBlue');
    });

    test('applies size styles (small)', () => {
        render(<Button size="small">Test Button</Button>);
        const button = screen.getByRole('button', { name: /Test Button/i });
        expect(button.className).toContain('text-sm'); // Class from sizeStyles.small
    });

    test('handles click events', () => {
        const handleClick = jest.fn();
        render(<Button onClick={handleClick}>Click Me</Button>);
        const button = screen.getByRole('button', { name: /Click Me/i });
        fireEvent.click(button);
        expect(handleClick).toHaveBeenCalledTimes(1);
    });

    test('is disabled when disabled prop is true', () => {
        const handleClick = jest.fn();
        render(<Button disabled onClick={handleClick}>Disabled</Button>);
        const button = screen.getByRole('button', { name: /Disabled/i });
        expect(button).toBeDisabled();
        expect(button.className).toContain('opacity-50');
        expect(button.className).toContain('cursor-not-allowed');

        // Try clicking the disabled button
        fireEvent.click(button);
        expect(handleClick).toHaveBeenCalledTimes(0);
    });

    test('applies custom className', () => {
        render(<Button className="my-custom-class">Test</Button>);
        const button = screen.getByRole('button', { name: /Test/i });
        expect(button.className).toContain('my-custom-class');
    });

    test('passes other props like type', () => {
        render(<Button type="submit">Submit</Button>);
        const button = screen.getByRole('button', { name: /Submit/i });
        expect(button.getAttribute('type')).toBe('submit');
    });
});

// --- Note: The rest of the tests from component-tests.js ---
// --- should be moved to their respective spec files,      ---
// --- e.g., CountdownTimer.spec.jsx, LoginForm.spec.jsx etc. --- 