import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ReplicatedSiteSettings } from './ReplicatedSiteSettings';
import { useSiteSettings } from '../../hooks/useSiteSettings';
import { useNotification } from '../../hooks/useNotification';

jest.mock('../../hooks/useSiteSettings');
jest.mock('../../hooks/useNotification');

describe('ReplicatedSiteSettings', () => {
    const mockShowNotification = jest.fn();
    const mockUpdateSettings = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        useNotification.mockReturnValue({ showNotification: mockShowNotification });
    });

    describe('Form Validation', () => {
        beforeEach(() => {
            useSiteSettings.mockReturnValue({
                settings: null,
                isLoading: false,
                error: null,
                updateSettings: mockUpdateSettings
            });
        });

        it('shows validation message for empty email', async () => {
            render(<ReplicatedSiteSettings />);

            const submitButton = screen.getByRole('button', { name: /save/i });
            fireEvent.click(submitButton);

            await waitFor(() => {
                expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
            });
            expect(mockUpdateSettings).not.toHaveBeenCalled();
        });

        it('shows validation message for invalid email format', async () => {
            render(<ReplicatedSiteSettings />);

            const emailInput = screen.getByLabelText(/contact email/i);
            fireEvent.change(emailInput, { target: { name: 'contactEmail', value: 'invalid-email' } });

            const submitButton = screen.getByRole('button', { name: /save/i });
            fireEvent.click(submitButton);

            await waitFor(() => {
                expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
            });
            expect(mockUpdateSettings).not.toHaveBeenCalled();
        });

        it('clears validation message when valid input is provided', async () => {
            render(<ReplicatedSiteSettings />);

            const emailInput = screen.getByLabelText(/contact email/i);

            // First trigger validation error
            fireEvent.change(emailInput, { target: { name: 'contactEmail', value: 'invalid-email' } });
            const submitButton = screen.getByRole('button', { name: /save/i });
            fireEvent.click(submitButton);

            await waitFor(() => {
                expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
            });

            // Then provide valid input
            fireEvent.change(emailInput, { target: { name: 'contactEmail', value: 'valid@email.com' } });

            await waitFor(() => {
                expect(screen.queryByText('Please enter a valid email address')).not.toBeInTheDocument();
            });
        });
    });

    describe('With Existing Settings', () => {
        const mockSettings = {
            siteName: 'Test Site',
            domain: 'test.com',
            contactEmail: 'test@example.com',
            theme: 'light'
        };

        beforeEach(() => {
            useSiteSettings.mockReturnValue({
                settings: mockSettings,
                isLoading: false,
                error: null,
                updateSettings: mockUpdateSettings
            });
        });

        it('renders with existing settings', () => {
            render(<ReplicatedSiteSettings />);

            expect(screen.getByDisplayValue('Test Site')).toBeInTheDocument();
            expect(screen.getByDisplayValue('test.com')).toBeInTheDocument();
            expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
        });

        it('successfully updates settings', async () => {
            render(<ReplicatedSiteSettings />);

            const emailInput = screen.getByLabelText(/contact email/i);
            fireEvent.change(emailInput, { target: { name: 'contactEmail', value: 'new@email.com' } });

            const submitButton = screen.getByRole('button', { name: /save/i });
            fireEvent.click(submitButton);

            await waitFor(() => {
                expect(mockUpdateSettings).toHaveBeenCalledWith(expect.objectContaining({
                    contactEmail: 'new@email.com'
                }));
                expect(mockShowNotification).toHaveBeenCalledWith('Settings updated successfully', 'success');
            });
        });

        it('shows error notification on update failure', async () => {
            mockUpdateSettings.mockRejectedValueOnce(new Error('Update failed'));
            render(<ReplicatedSiteSettings />);

            const submitButton = screen.getByRole('button', { name: /save/i });
            fireEvent.click(submitButton);

            await waitFor(() => {
                expect(mockShowNotification).toHaveBeenCalledWith('Failed to update settings', 'error');
            });
        });
    });

    describe('Loading and Error States', () => {
        it('shows loading state', () => {
            useSiteSettings.mockReturnValue({
                settings: null,
                isLoading: true,
                error: null,
                updateSettings: mockUpdateSettings
            });

            render(<ReplicatedSiteSettings />);
            expect(screen.getByTestId('settings-skeleton')).toBeInTheDocument();
        });

        it('shows error state', () => {
            useSiteSettings.mockReturnValue({
                settings: null,
                isLoading: false,
                error: 'Failed to load settings',
                updateSettings: mockUpdateSettings
            });

            render(<ReplicatedSiteSettings />);
            expect(screen.getByText(/failed to load settings/i)).toBeInTheDocument();
        });
    });

    describe('Logo Upload', () => {
        it('displays logo preview after upload', async () => {
            render(<ReplicatedSiteSettings />);

            const file = new File(['logo'], 'logo.png', { type: 'image/png' });
            const fileInput = screen.getByTestId('logo-upload');
            fireEvent.change(fileInput, { target: { files: [file] } });

            await waitFor(() => {
                expect(screen.getByAltText('Site logo preview')).toBeInTheDocument();
            });
        });
    });

    describe('Theme and Customization', () => {
        it('applies theme preview', () => {
            render(<ReplicatedSiteSettings />);

            const themeSelect = screen.getByLabelText(/theme/i);
            fireEvent.change(themeSelect, { target: { value: 'dark' } });

            const preview = screen.getByTestId('theme-preview');
            expect(preview).toHaveClass('dark-theme');
        });

        it('handles color picker changes', () => {
            render(<ReplicatedSiteSettings />);

            const colorPicker = screen.getByLabelText(/primary color/i);
            fireEvent.change(colorPicker, { target: { value: '#ff0000' } });

            const preview = screen.getByTestId('color-preview');
            expect(preview).toHaveStyle({ backgroundColor: '#ff0000' });
        });
    });

    describe('Social Media Links', () => {
        it('updates social media links', () => {
            render(<ReplicatedSiteSettings />);

            const facebookInput = screen.getByLabelText(/facebook/i);
            fireEvent.change(facebookInput, { target: { value: 'https://facebook.com/newlink' } });

            expect(facebookInput.value).toBe('https://facebook.com/newlink');
        });
    });
}); 