import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../test-utils';
import { vi } from 'vitest';
import UserSponsorEdit from './UserSponsorEdit';
import { useUser } from '../../hooks/useUser';
import { useSponsor } from '../../hooks/useSponsor';

// Mock the hooks
vi.mock('../../hooks/useUser', () => ({
    useUser: vi.fn()
}));

vi.mock('../../hooks/useSponsor', () => ({
    useSponsor: vi.fn()
}));

describe('UserSponsorEdit Component', () => {
    const mockUser = {
        id: '123',
        firstName: 'John',
        lastName: 'Doe',
        sponsorId: 'sponsor-456'
    };

    const mockSponsors = [
        { id: 'sponsor-456', name: 'Jane Smith', active: true },
        { id: 'sponsor-789', name: 'Bob Johnson', active: true },
        { id: 'sponsor-101', name: 'Alice Brown', active: false }
    ];

    beforeEach(() => {
        useUser.mockImplementation(() => ({
            user: mockUser,
            loading: false,
            error: null,
            updateUserSponsor: vi.fn().mockResolvedValue({ success: true })
        }));

        useSponsor.mockImplementation(() => ({
            sponsors: mockSponsors,
            loading: false,
            error: null
        }));
    });

    test('renders current sponsor information', () => {
        render(<UserSponsorEdit userId="123" />);

        expect(screen.getByText(/current sponsor/i)).toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    test('shows loading state', () => {
        useUser.mockImplementation(() => ({
            user: null,
            loading: true,
            error: null
        }));

        render(<UserSponsorEdit userId="123" />);
        expect(screen.getByTestId('sponsor-edit-skeleton')).toBeInTheDocument();
    });

    test('shows error state', () => {
        useUser.mockImplementation(() => ({
            user: null,
            loading: false,
            error: 'Failed to load user'
        }));

        render(<UserSponsorEdit userId="123" />);
        expect(screen.getByText(/failed to load user/i)).toBeInTheDocument();
    });

    test('displays sponsor selection dropdown', () => {
        render(<UserSponsorEdit userId="123" />);

        const dropdown = screen.getByRole('combobox');
        expect(dropdown).toBeInTheDocument();

        // Should only show active sponsors
        expect(screen.queryByText('Alice Brown')).not.toBeInTheDocument();
    });

    test('handles sponsor change', async () => {
        const mockUpdateUserSponsor = vi.fn().mockResolvedValue({ success: true });
        useUser.mockImplementation(() => ({
            user: mockUser,
            loading: false,
            error: null,
            updateUserSponsor: mockUpdateUserSponsor
        }));

        render(<UserSponsorEdit userId="123" />);

        // Select new sponsor
        const dropdown = screen.getByRole('combobox');
        fireEvent.change(dropdown, { target: { value: 'sponsor-789' } });

        // Submit change
        fireEvent.click(screen.getByRole('button', { name: /update sponsor/i }));

        await waitFor(() => {
            expect(mockUpdateUserSponsor).toHaveBeenCalledWith('123', 'sponsor-789');
        });
    });

    test('shows confirmation dialog before changing sponsor', async () => {
        render(<UserSponsorEdit userId="123" />);

        // Select new sponsor
        const dropdown = screen.getByRole('combobox');
        fireEvent.change(dropdown, { target: { value: 'sponsor-789' } });

        // Click update
        fireEvent.click(screen.getByRole('button', { name: /update sponsor/i }));

        // Should show confirmation dialog
        expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
        expect(screen.getByText(/change sponsor from jane smith to bob johnson/i)).toBeInTheDocument();
    });

    test('handles sponsor update failure', async () => {
        const mockUpdateUserSponsor = vi.fn().mockRejectedValue(new Error('Update failed'));
        useUser.mockImplementation(() => ({
            user: mockUser,
            loading: false,
            error: null,
            updateUserSponsor: mockUpdateUserSponsor
        }));

        render(<UserSponsorEdit userId="123" />);

        // Select new sponsor
        const dropdown = screen.getByRole('combobox');
        fireEvent.change(dropdown, { target: { value: 'sponsor-789' } });

        // Submit change
        fireEvent.click(screen.getByRole('button', { name: /update sponsor/i }));

        // Confirm change
        fireEvent.click(screen.getByRole('button', { name: /confirm/i }));

        await waitFor(() => {
            expect(screen.getByText(/failed to update sponsor/i)).toBeInTheDocument();
        });
    });

    test('handles sponsor loading error', () => {
        useSponsor.mockImplementation(() => ({
            sponsors: [],
            loading: false,
            error: 'Failed to load sponsors'
        }));

        render(<UserSponsorEdit userId="123" />);
        expect(screen.getByText(/failed to load sponsors/i)).toBeInTheDocument();
    });

    test('disables update button when same sponsor selected', () => {
        render(<UserSponsorEdit userId="123" />);

        const dropdown = screen.getByRole('combobox');
        fireEvent.change(dropdown, { target: { value: 'sponsor-456' } });

        const updateButton = screen.getByRole('button', { name: /update sponsor/i });
        expect(updateButton).toBeDisabled();
    });

    test('shows success message after update', async () => {
        render(<UserSponsorEdit userId="123" />);

        // Select new sponsor
        const dropdown = screen.getByRole('combobox');
        fireEvent.change(dropdown, { target: { value: 'sponsor-789' } });

        // Submit and confirm change
        fireEvent.click(screen.getByRole('button', { name: /update sponsor/i }));
        fireEvent.click(screen.getByRole('button', { name: /confirm/i }));

        await waitFor(() => {
            expect(screen.getByText(/sponsor updated successfully/i)).toBeInTheDocument();
        });
    });
}); 