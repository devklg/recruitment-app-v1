import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../test-utils';
import { vi } from 'vitest';
import UserProfile from './UserProfile';
import { useAuth } from '../../hooks/useAuth';

// Mock the Card component
vi.mock('../common/Card', () => ({
    default: ({ children, variant }) => (
        <div data-testid="mock-card" data-variant={variant}>
            {children}
        </div>
    )
}));

// Mock the useAuth hook
vi.mock('../../hooks/useAuth', () => ({
    useAuth: vi.fn()
}));

describe('UserProfile Component', () => {
    const mockUser = {
        id: '123',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        profileImage: 'https://example.com/profile.jpg',
        role: 'sponsor',
        joinDate: '2024-01-01',
        teamSize: 5
    };

    beforeEach(() => {
        useAuth.mockImplementation(() => ({
            currentUser: mockUser,
            updateUserProfile: vi.fn().mockResolvedValue({ success: true }),
            loading: false,
            error: null
        }));
    });

    test('renders user profile information', () => {
        render(<UserProfile />);

        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('john@example.com')).toBeInTheDocument();
        expect(screen.getByRole('img', { name: /profile/i })).toHaveAttribute('src', 'https://example.com/profile.jpg');
        expect(screen.getByText(/sponsor/i)).toBeInTheDocument();
    });

    test('shows loading state', () => {
        useAuth.mockImplementation(() => ({
            currentUser: null,
            loading: true,
            error: null
        }));

        render(<UserProfile />);
        expect(screen.getByTestId('profile-skeleton')).toBeInTheDocument();
    });

    test('shows error state', () => {
        useAuth.mockImplementation(() => ({
            currentUser: null,
            loading: false,
            error: 'Failed to load profile'
        }));

        render(<UserProfile />);
        expect(screen.getByText(/failed to load profile/i)).toBeInTheDocument();
    });

    test('handles edit mode toggle', () => {
        render(<UserProfile />);

        const editButton = screen.getByRole('button', { name: /edit profile/i });
        fireEvent.click(editButton);

        expect(screen.getByLabelText(/first name/i)).toHaveValue('John');
        expect(screen.getByLabelText(/last name/i)).toHaveValue('Doe');
        expect(screen.getByLabelText(/email/i)).toHaveValue('john@example.com');
    });

    test('handles profile update submission', async () => {
        const mockUpdateProfile = vi.fn().mockResolvedValue({ success: true });
        useAuth.mockImplementation(() => ({
            currentUser: mockUser,
            updateUserProfile: mockUpdateProfile,
            loading: false,
            error: null
        }));

        render(<UserProfile />);

        // Enter edit mode
        fireEvent.click(screen.getByRole('button', { name: /edit profile/i }));

        // Update fields
        fireEvent.change(screen.getByLabelText(/first name/i), {
            target: { value: 'Johnny' }
        });
        fireEvent.change(screen.getByLabelText(/last name/i), {
            target: { value: 'Smith' }
        });

        // Submit form
        fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

        await waitFor(() => {
            expect(mockUpdateProfile).toHaveBeenCalledWith({
                firstName: 'Johnny',
                lastName: 'Smith',
                email: 'john@example.com'
            });
        });
    });

    test('displays validation errors for invalid inputs', async () => {
        render(<UserProfile />);

        // Enter edit mode
        fireEvent.click(screen.getByRole('button', { name: /edit profile/i }));

        // Clear required fields
        fireEvent.change(screen.getByLabelText(/first name/i), {
            target: { value: '' }
        });
        fireEvent.change(screen.getByLabelText(/email/i), {
            target: { value: 'invalid-email' }
        });

        // Submit form
        fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

        expect(await screen.findByText(/first name is required/i)).toBeInTheDocument();
        expect(await screen.findByText(/please enter a valid email/i)).toBeInTheDocument();
    });

    test('handles profile image upload', async () => {
        const mockUpdateProfile = vi.fn().mockResolvedValue({
            success: true,
            profileImage: 'https://example.com/new-profile.jpg'
        });

        useAuth.mockImplementation(() => ({
            currentUser: mockUser,
            updateUserProfile: mockUpdateProfile,
            loading: false,
            error: null
        }));

        render(<UserProfile />);

        const file = new File(['profile'], 'profile.jpg', { type: 'image/jpeg' });
        const input = screen.getByLabelText(/change profile picture/i);

        Object.defineProperty(input, 'files', {
            value: [file]
        });

        fireEvent.change(input);

        await waitFor(() => {
            expect(mockUpdateProfile).toHaveBeenCalled();
            const formData = mockUpdateProfile.mock.calls[0][0];
            expect(formData.get('profileImage')).toBe(file);
        });
    });

    test('displays team size information', () => {
        render(<UserProfile />);
        expect(screen.getByText(/team size: 5/i)).toBeInTheDocument();
    });

    test('displays join date', () => {
        render(<UserProfile />);
        expect(screen.getByText(/joined:.*(january|jan).*1.*2024/i)).toBeInTheDocument();
    });

    test('handles cancel edit', () => {
        render(<UserProfile />);

        // Enter edit mode
        fireEvent.click(screen.getByRole('button', { name: /edit profile/i }));

        // Make some changes
        fireEvent.change(screen.getByLabelText(/first name/i), {
            target: { value: 'Changed' }
        });

        // Cancel edit
        fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

        // Should show original data
        expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
}); 