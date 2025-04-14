import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../test-utils';
import { vi } from 'vitest';
import PrintableUserList from './PrintableUserList';
import { useUsers } from '../../hooks/useUsers';

// Mock the hooks
vi.mock('../../hooks/useUsers', () => ({
    useUsers: vi.fn()
}));

describe('PrintableUserList Component', () => {
    const mockUsers = [
        {
            id: '1',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
            status: 'active',
            enrollmentDate: '2023-01-01',
            sponsor: { name: 'Jane Smith' }
        },
        {
            id: '2',
            firstName: 'Alice',
            lastName: 'Brown',
            email: 'alice@example.com',
            status: 'inactive',
            enrollmentDate: '2023-02-01',
            sponsor: { name: 'Bob Johnson' }
        }
    ];

    beforeEach(() => {
        useUsers.mockImplementation(() => ({
            users: mockUsers,
            loading: false,
            error: null
        }));
    });

    test('renders user list table with correct headers', () => {
        render(<PrintableUserList />);

        expect(screen.getByText('Name')).toBeInTheDocument();
        expect(screen.getByText('Email')).toBeInTheDocument();
        expect(screen.getByText('Status')).toBeInTheDocument();
        expect(screen.getByText('Enrollment Date')).toBeInTheDocument();
        expect(screen.getByText('Sponsor')).toBeInTheDocument();
    });

    test('displays user data correctly', () => {
        render(<PrintableUserList />);

        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('john@example.com')).toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();

        expect(screen.getByText('Alice Brown')).toBeInTheDocument();
        expect(screen.getByText('alice@example.com')).toBeInTheDocument();
        expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
    });

    test('shows loading state', () => {
        useUsers.mockImplementation(() => ({
            users: [],
            loading: true,
            error: null
        }));

        render(<PrintableUserList />);
        expect(screen.getByTestId('user-list-skeleton')).toBeInTheDocument();
    });

    test('shows error state', () => {
        useUsers.mockImplementation(() => ({
            users: [],
            loading: false,
            error: 'Failed to load users'
        }));

        render(<PrintableUserList />);
        expect(screen.getByText(/failed to load users/i)).toBeInTheDocument();
    });

    test('handles empty user list', () => {
        useUsers.mockImplementation(() => ({
            users: [],
            loading: false,
            error: null
        }));

        render(<PrintableUserList />);
        expect(screen.getByText(/no users found/i)).toBeInTheDocument();
    });

    test('filters users by status', () => {
        render(<PrintableUserList />);

        const statusFilter = screen.getByLabelText(/status filter/i);
        fireEvent.change(statusFilter, { target: { value: 'active' } });

        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.queryByText('Alice Brown')).not.toBeInTheDocument();
    });

    test('sorts users by name', () => {
        render(<PrintableUserList />);

        const nameHeader = screen.getByText('Name');
        fireEvent.click(nameHeader);

        const userNames = screen.getAllByTestId('user-name');
        expect(userNames[0]).toHaveTextContent('Alice Brown');
        expect(userNames[1]).toHaveTextContent('John Doe');
    });

    test('formats dates correctly', () => {
        render(<PrintableUserList />);

        expect(screen.getByText('Jan 1, 2023')).toBeInTheDocument();
        expect(screen.getByText('Feb 1, 2023')).toBeInTheDocument();
    });

    test('handles print action', () => {
        const mockPrint = vi.fn();
        window.print = mockPrint;

        render(<PrintableUserList />);

        const printButton = screen.getByRole('button', { name: /print list/i });
        fireEvent.click(printButton);

        expect(mockPrint).toHaveBeenCalled();
    });

    test('applies print-specific styles', () => {
        render(<PrintableUserList />);

        const printContainer = screen.getByTestId('printable-container');
        const styles = window.getComputedStyle(printContainer);

        expect(styles.getPropertyValue('--print-header-background')).toBe('#f3f4f6');
        expect(styles.getPropertyValue('--print-row-border')).toBe('1px solid #e5e7eb');
    });

    test('handles export to CSV', async () => {
        render(<PrintableUserList />);

        const exportButton = screen.getByRole('button', { name: /export csv/i });
        fireEvent.click(exportButton);

        // Check if CSV content is correct
        const link = screen.getByTestId('csv-download-link');
        const csvContent = link.href;

        expect(csvContent).toContain('John,Doe,john@example.com,active');
        expect(csvContent).toContain('Alice,Brown,alice@example.com,inactive');
    });
}); 