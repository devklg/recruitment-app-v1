import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../test-utils';
import { vi } from 'vitest';
import PreEnrolleeCountdown from './PreEnrolleeCountdown';
import { usePreEnrollees } from '../../hooks/usePreEnrollees'; // Adjust path as needed

// Mock the pre-enrollees hook
vi.mock('../../hooks/usePreEnrollees', () => ({
    usePreEnrollees: vi.fn()
}));

describe('PreEnrolleeCountdown Component', () => {
    const mockPreEnrollees = [
        {
            id: '1',
            firstName: 'Jane',
            lastName: 'Smith',
            email: 'jane@example.com',
            enrollmentDeadline: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
            status: 'pending'
        },
        {
            id: '2',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
            enrollmentDeadline: new Date(Date.now() + 172800000).toISOString(), // Day after tomorrow
            status: 'pending'
        }
    ];

    beforeEach(() => {
        usePreEnrollees.mockImplementation(() => ({
            preEnrollees: mockPreEnrollees,
            loading: false,
            error: null,
            sendReminder: vi.fn().mockResolvedValue({ success: true })
        }));
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    test('renders pre-enrollee list with countdowns', () => {
        render(<PreEnrolleeCountdown />);

        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getAllByTestId('countdown-timer')).toHaveLength(2);
    });

    test('shows loading state', () => {
        usePreEnrollees.mockImplementation(() => ({
            preEnrollees: [],
            loading: true,
            error: null
        }));

        render(<PreEnrolleeCountdown />);
        expect(screen.getByTestId('pre-enrollee-skeleton')).toBeInTheDocument();
    });

    test('shows error state', () => {
        usePreEnrollees.mockImplementation(() => ({
            preEnrollees: [],
            loading: false,
            error: 'Failed to load pre-enrollees'
        }));

        render(<PreEnrolleeCountdown />);
        expect(screen.getByText(/failed to load pre-enrollees/i)).toBeInTheDocument();
    });

    test('handles sending reminder', async () => {
        const mockSendReminder = vi.fn().mockResolvedValue({ success: true });
        usePreEnrollees.mockImplementation(() => ({
            preEnrollees: mockPreEnrollees,
            loading: false,
            error: null,
            sendReminder: mockSendReminder
        }));

        render(<PreEnrolleeCountdown />);

        const reminderButton = screen.getAllByRole('button', { name: /send reminder/i })[0];
        fireEvent.click(reminderButton);

        await waitFor(() => {
            expect(mockSendReminder).toHaveBeenCalledWith(mockPreEnrollees[0].id);
        });

        expect(screen.getByText(/reminder sent/i)).toBeInTheDocument();
    });

    test('shows expired status when deadline passes', () => {
        const expiredPreEnrollee = {
            ...mockPreEnrollees[0],
            enrollmentDeadline: new Date(Date.now() - 86400000).toISOString() // Yesterday
        };

        usePreEnrollees.mockImplementation(() => ({
            preEnrollees: [expiredPreEnrollee],
            loading: false,
            error: null
        }));

        render(<PreEnrolleeCountdown />);
        expect(screen.getByText(/expired/i)).toBeInTheDocument();
    });

    test('sorts pre-enrollees by deadline', () => {
        render(<PreEnrolleeCountdown />);

        const preEnrolleeNames = screen.getAllByTestId('pre-enrollee-name');
        expect(preEnrolleeNames[0]).toHaveTextContent('Jane Smith'); // Earlier deadline
        expect(preEnrolleeNames[1]).toHaveTextContent('John Doe'); // Later deadline
    });

    test('updates countdown in real-time', () => {
        render(<PreEnrolleeCountdown />);

        const initialTime = screen.getAllByTestId('countdown-timer')[0].textContent;

        vi.advanceTimersByTime(1000);

        const updatedTime = screen.getAllByTestId('countdown-timer')[0].textContent;
        expect(updatedTime).not.toBe(initialTime);
    });

    test('handles reminder failure', async () => {
        const mockSendReminder = vi.fn().mockRejectedValue(new Error('Failed to send reminder'));
        usePreEnrollees.mockImplementation(() => ({
            preEnrollees: mockPreEnrollees,
            loading: false,
            error: null,
            sendReminder: mockSendReminder
        }));

        render(<PreEnrolleeCountdown />);

        const reminderButton = screen.getAllByRole('button', { name: /send reminder/i })[0];
        fireEvent.click(reminderButton);

        await waitFor(() => {
            expect(screen.getByText(/failed to send reminder/i)).toBeInTheDocument();
        });
    });

    test('displays no pre-enrollees message when list is empty', () => {
        usePreEnrollees.mockImplementation(() => ({
            preEnrollees: [],
            loading: false,
            error: null
        }));

        render(<PreEnrolleeCountdown />);
        expect(screen.getByText(/no pending pre-enrollees/i)).toBeInTheDocument();
    });

    test('filters out completed pre-enrollees', () => {
        const completedPreEnrollee = {
            ...mockPreEnrollees[0],
            status: 'completed'
        };

        usePreEnrollees.mockImplementation(() => ({
            preEnrollees: [...mockPreEnrollees, completedPreEnrollee],
            loading: false,
            error: null
        }));

        render(<PreEnrolleeCountdown />);
        const preEnrolleeElements = screen.getAllByTestId('pre-enrollee-item');
        expect(preEnrolleeElements).toHaveLength(2); // Only pending ones
    });

    test('displays correct time format', () => {
        render(<PreEnrolleeCountdown />);

        const countdowns = screen.getAllByTestId('countdown-timer');
        countdowns.forEach(countdown => {
            expect(countdown.textContent).toMatch(/\d{2}:\d{2}:\d{2}/); // HH:MM:SS format
        });
    });
}); 