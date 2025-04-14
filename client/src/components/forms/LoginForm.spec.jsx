// client/src/components/forms/LoginForm.spec.jsx

import React from 'react';
import { vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../../test-utils';
import LoginForm from './LoginForm'; // Adjust path if needed

// Mock the useAuth hook 
vi.mock('../../hooks/useAuth', () => ({
    useAuth: () => ({
        loginUser: vi.fn().mockResolvedValue({ success: true }), // Mock login success
        loading: false,
        error: null,
    }),
}));

describe('LoginForm Component', () => {
    test('renders login form elements', () => {
        render(<LoginForm />);
        expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
    });

    test('shows validation errors for empty fields on submit', async () => {
        render(<LoginForm />);
        fireEvent.click(screen.getByRole('button', { name: /login/i }));

        // Using findByText to wait for async validation errors
        expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
        expect(await screen.findByText(/password is required/i)).toBeInTheDocument();
    });

    test('shows validation error for invalid email format', async () => {
        render(<LoginForm />);
        const emailInput = screen.getByLabelText(/email address/i);

        fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
        fireEvent.blur(emailInput); // Trigger validation on blur

        expect(await screen.findByText(/please enter a valid email/i)).toBeInTheDocument();
    });

    test('submits form with valid data and calls loginUser', async () => {
        const { loginUser } = vi.mocked(require('../../hooks/useAuth')).useAuth(); // Get the mock function
        render(<LoginForm />);

        fireEvent.change(screen.getByLabelText(/email address/i), {
            target: { value: 'test@example.com' },
        });
        fireEvent.change(screen.getByLabelText(/password/i), {
            target: { value: 'password123' },
        });

        fireEvent.click(screen.getByRole('button', { name: /login/i }));

        await waitFor(() => {
            expect(loginUser).toHaveBeenCalledWith('test@example.com', 'password123');
        });
    });

    // Add tests for error handling from useAuth if needed
    // test('displays error message on login failure', async () => { ... });
}); 