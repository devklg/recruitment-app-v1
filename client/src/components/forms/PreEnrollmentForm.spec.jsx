import React from 'react';
import { vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../../test-utils';
import PreEnrollmentForm from './PreEnrollmentForm'; // Adjust path as necessary
import apiService from '../../services/apiService';

// Mock the apiService
vi.mock('../../services/apiService', () => ({
    default: {
        preEnrollUser: vi.fn(),
    },
}));

// Mock useAuth if needed, e.g., if the component uses currentUser
vi.mock('../../hooks/useAuth', () => ({
    useAuth: () => ({
        currentUser: { uid: 'test-sponsor-id' }, // Mock a logged-in user if needed
        loading: false,
        error: null,
    }),
}));

describe('PreEnrollmentForm Component', () => {
    beforeEach(() => {
        // Reset mocks before each test
        vi.clearAllMocks();
    });

    test('renders the pre-enrollment form correctly', () => {
        render(<PreEnrollmentForm />);
        expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/phone number \(optional\)/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /enroll candidate/i })).toBeInTheDocument();
    });

    test('shows validation errors for required fields', async () => {
        render(<PreEnrollmentForm />);
        fireEvent.click(screen.getByRole('button', { name: /enroll candidate/i }));

        expect(await screen.findByText(/first name is required/i)).toBeInTheDocument();
        expect(await screen.findByText(/last name is required/i)).toBeInTheDocument();
        expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
    });

    test('shows validation error for invalid email format', async () => {
        render(<PreEnrollmentForm />);
        const emailInput = screen.getByLabelText(/email address/i);
        fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
        fireEvent.blur(emailInput);

        expect(await screen.findByText(/please enter a valid email/i)).toBeInTheDocument();
    });

    test('submits the form with valid data and calls apiService.preEnrollUser', async () => {
        const mockPreEnrollUser = apiService.preEnrollUser.mockResolvedValue({
            success: true,
            message: 'Enrollment successful',
            user: { id: '123', email: 'test@example.com' }
        });

        render(<PreEnrollmentForm />);

        fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'Test' } });
        fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'User' } });
        fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'test@example.com' } });
        fireEvent.change(screen.getByLabelText(/phone number \(optional\)/i), { target: { value: '1234567890' } });

        fireEvent.click(screen.getByRole('button', { name: /enroll candidate/i }));

        await waitFor(() => {
            expect(mockPreEnrollUser).toHaveBeenCalledTimes(1);
            expect(mockPreEnrollUser).toHaveBeenCalledWith({
                firstName: 'Test',
                lastName: 'User',
                email: 'test@example.com',
                phone: '1234567890',
                sponsorId: 'test-sponsor-id' // From mocked useAuth
            });
        });

        // Check for success message (adjust selector if needed based on implementation)
        expect(await screen.findByText(/enrollment successful/i)).toBeInTheDocument();
    });

    test('displays an error message if pre-enrollment fails', async () => {
        const mockPreEnrollUser = apiService.preEnrollUser.mockRejectedValue(new Error('Failed to enroll'));

        render(<PreEnrollmentForm />);

        // Fill form with valid data
        fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'Test' } });
        fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'User' } });
        fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'fail@example.com' } });

        fireEvent.click(screen.getByRole('button', { name: /enroll candidate/i }));

        await waitFor(() => {
            expect(mockPreEnrollUser).toHaveBeenCalledTimes(1);
        });

        // Check for error message (adjust selector/text based on implementation)
        expect(await screen.findByText(/failed to enroll/i)).toBeInTheDocument();
    });
}); 