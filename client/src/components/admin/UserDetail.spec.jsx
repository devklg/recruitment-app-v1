import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../test-utils';
import { vi } from 'vitest';
import UserDetail from './UserDetail';
import { useUser } from '../../hooks/useUser'; // Adjust path as needed

// Mock the user hook
vi.mock('../../hooks/useUser', () => ({
    useUser: vi.fn()
}));

describe('UserDetail Component', () => {
    const mockUser = {
        id: '123',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        role: 'sponsor',
        status: 'active',
        sponsorId: 'sponsor-123',
        enrollmentDate: '2024-01-01',
        lastLoginDate: '2024-03-15',
        teamMembers: ['user1', 'user2'],
        commissionSettings: {
            level: 'gold',
            rate: 0.15
        }
    };

    beforeEach(() => {
        useUser.mockImplementation(() => ({
            user: mockUser,
            loading: false,
            error: null,
            updateUser: vi.fn().mockResolvedValue({ success: true }),
            deactivateUser: vi.fn().mockResolvedValue({ success: true })
        }));
    });

    test('renders user details', () => {
        render(<UserDetail userId="123" />);

        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('john@example.com')).toBeInTheDocument();
        expect(screen.getByText(/sponsor/i)).toBeInTheDocument();
        expect(screen.getByText(/active/i)).toBeInTheDocument();
    });

    test('shows loading state', () => {
        useUser.mockImplementation(() => ({
            user: null,
            loading: true,
            error: null
        }));

        render(<UserDetail userId="123" />);
        expect(screen.getByTestId('user-detail-skeleton')).toBeInTheDocument();
    });

    test('shows error state', () => {
        useUser.mockImplementation(() => ({
            user: null,
            loading: false,
            error: 'Failed to load user'
        }));

        render(<UserDetail userId="123" />);
        expect(screen.getByText(/failed to load user/i)).toBeInTheDocument();
    });

    test('handles user deactivation', async () => {
        const mockDeactivateUser = vi.fn().mockResolvedValue({ success: true });
        useUser.mockImplementation(() => ({
            user: mockUser,
            loading: false,
            error: null,
            deactivateUser: mockDeactivateUser
        }));

        render(<UserDetail userId="123" />);

        const deactivateButton = screen.getByRole('button', { name: /deactivate user/i });
        fireEvent.click(deactivateButton);

        // Should show confirmation dialog
        expect(screen.getByText(/are you sure/i)).toBeInTheDocument();

        // Confirm deactivation
        fireEvent.click(screen.getByRole('button', { name: /confirm/i }));

        await waitFor(() => {
            expect(mockDeactivateUser).toHaveBeenCalledWith('123');
        });
    });

    test('displays team members list', () => {
        render(<UserDetail userId="123" />);

        expect(screen.getByText(/team members/i)).toBeInTheDocument();
        expect(screen.getByText('2 members')).toBeInTheDocument();
    });

    test('shows commission settings', () => {
        render(<UserDetail userId="123" />);

        expect(screen.getByText(/gold/i)).toBeInTheDocument();
        expect(screen.getByText('15%')).toBeInTheDocument();
    });

    test('displays enrollment and last login dates', () => {
        render(<UserDetail userId="123" />);

        expect(screen.getByText(/enrolled: january 1, 2024/i)).toBeInTheDocument();
        expect(screen.getByText(/last login: march 15, 2024/i)).toBeInTheDocument();
    });

    test('handles user update', async () => {
        const mockUpdateUser = vi.fn().mockResolvedValue({ success: true });
        useUser.mockImplementation(() => ({
            user: mockUser,
            loading: false,
            error: null,
            updateUser: mockUpdateUser
        }));

        render(<UserDetail userId="123" />);

        const editButton = screen.getByRole('button', { name: /edit/i });
        fireEvent.click(editButton);

        // Update user role
        const roleSelect = screen.getByLabelText(/role/i);
        fireEvent.change(roleSelect, { target: { value: 'admin' } });

        // Save changes
        fireEvent.click(screen.getByRole('button', { name: /save/i }));

        await waitFor(() => {
            expect(mockUpdateUser).toHaveBeenCalledWith('123', expect.objectContaining({
                role: 'admin'
            }));
        });
    });

    test('validates required fields on update', async () => {
        render(<UserDetail userId="123" />);

        const editButton = screen.getByRole('button', { name: /edit/i });
        fireEvent.click(editButton);

        // Clear required field
        const emailInput = screen.getByLabelText(/email/i);
        fireEvent.change(emailInput, { target: { value: '' } });

        // Try to save
        fireEvent.click(screen.getByRole('button', { name: /save/i }));

        expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
    });

    test('shows sponsor information', () => {
        render(<UserDetail userId="123" />);

        expect(screen.getByText(/sponsor id/i)).toBeInTheDocument();
        expect(screen.getByText('sponsor-123')).toBeInTheDocument();
    });

    test('handles cancel edit', () => {
        render(<UserDetail userId="123" />);

        // Enter edit mode
        fireEvent.click(screen.getByRole('button', { name: /edit/i }));

        // Make some changes
        const emailInput = screen.getByLabelText(/email/i);
        fireEvent.change(emailInput, { target: { value: 'changed@example.com' } });

        // Cancel edit
        fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

        // Should show original email
        expect(screen.getByText('john@example.com')).toBeInTheDocument();
    });
}); 