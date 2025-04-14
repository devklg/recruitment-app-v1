import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../test-utils';
import { vi } from 'vitest';
import ActivityFeed from './ActivityFeed';
import { useActivity } from '../../hooks/useActivity';

vi.mock('../../hooks/useActivity', () => ({
    useActivity: vi.fn()
}));

describe('ActivityFeed Component', () => {
    const mockActivities = [
        {
            id: '1',
            type: 'enrollment',
            user: { firstName: 'John', lastName: 'Doe' },
            timestamp: '2024-03-20T10:00:00Z',
            details: { sponsor: 'Jane Smith' }
        },
        {
            id: '2',
            type: 'sponsorChange',
            user: { firstName: 'Alice', lastName: 'Brown' },
            timestamp: '2024-03-19T15:30:00Z',
            details: { oldSponsor: 'Bob Wilson', newSponsor: 'Carol White' }
        },
        {
            id: '3',
            type: 'statusUpdate',
            user: { firstName: 'Mike', lastName: 'Johnson' },
            timestamp: '2024-03-18T09:15:00Z',
            details: { newStatus: 'active' }
        }
    ];

    beforeEach(() => {
        useActivity.mockImplementation(() => ({
            activities: mockActivities,
            loading: false,
            error: null,
            fetchMoreActivities: vi.fn(),
            hasMore: true
        }));
    });

    test('renders activity feed with correct activities', () => {
        render(<ActivityFeed />);

        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Alice Brown')).toBeInTheDocument();
        expect(screen.getByText('Mike Johnson')).toBeInTheDocument();
    });

    test('displays correct activity types with appropriate icons', () => {
        render(<ActivityFeed />);

        expect(screen.getByTestId('enrollment-icon-1')).toBeInTheDocument();
        expect(screen.getByTestId('sponsor-change-icon-2')).toBeInTheDocument();
        expect(screen.getByTestId('status-update-icon-3')).toBeInTheDocument();
    });

    test('formats timestamps correctly', () => {
        render(<ActivityFeed />);

        expect(screen.getByText(/Mar 20, 2024/)).toBeInTheDocument();
        expect(screen.getByText(/Mar 19, 2024/)).toBeInTheDocument();
        expect(screen.getByText(/Mar 18, 2024/)).toBeInTheDocument();
    });

    test('shows loading state', () => {
        useActivity.mockImplementation(() => ({
            activities: [],
            loading: true,
            error: null,
            fetchMoreActivities: vi.fn(),
            hasMore: false
        }));

        render(<ActivityFeed />);
        expect(screen.getByTestId('activity-feed-skeleton')).toBeInTheDocument();
    });

    test('shows error state', () => {
        useActivity.mockImplementation(() => ({
            activities: [],
            loading: false,
            error: 'Failed to load activities',
            fetchMoreActivities: vi.fn(),
            hasMore: false
        }));

        render(<ActivityFeed />);
        expect(screen.getByText(/failed to load activities/i)).toBeInTheDocument();
    });

    test('handles empty activity list', () => {
        useActivity.mockImplementation(() => ({
            activities: [],
            loading: false,
            error: null,
            fetchMoreActivities: vi.fn(),
            hasMore: false
        }));

        render(<ActivityFeed />);
        expect(screen.getByText(/no recent activity/i)).toBeInTheDocument();
    });

    test('loads more activities on scroll', async () => {
        const fetchMoreActivities = vi.fn();
        useActivity.mockImplementation(() => ({
            activities: mockActivities,
            loading: false,
            error: null,
            fetchMoreActivities,
            hasMore: true
        }));

        render(<ActivityFeed />);

        const feedContainer = screen.getByTestId('activity-feed-container');
        fireEvent.scroll(feedContainer, { target: { scrollTop: 1000, scrollHeight: 1000 } });

        await waitFor(() => {
            expect(fetchMoreActivities).toHaveBeenCalled();
        });
    });

    test('displays activity details correctly', () => {
        render(<ActivityFeed />);

        // Enrollment details
        expect(screen.getByText(/enrolled with sponsor Jane Smith/i)).toBeInTheDocument();

        // Sponsor change details
        expect(screen.getByText(/changed sponsor from Bob Wilson to Carol White/i)).toBeInTheDocument();

        // Status update details
        expect(screen.getByText(/status changed to active/i)).toBeInTheDocument();
    });

    test('applies correct styling based on activity type', () => {
        render(<ActivityFeed />);

        const enrollmentActivity = screen.getByTestId('activity-item-1');
        const sponsorChangeActivity = screen.getByTestId('activity-item-2');
        const statusUpdateActivity = screen.getByTestId('activity-item-3');

        expect(enrollmentActivity).toHaveClass('bg-green-50');
        expect(sponsorChangeActivity).toHaveClass('bg-blue-50');
        expect(statusUpdateActivity).toHaveClass('bg-yellow-50');
    });
}); 