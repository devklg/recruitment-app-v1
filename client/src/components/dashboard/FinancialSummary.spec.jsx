import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../test-utils';
import { vi } from 'vitest';
import FinancialSummary from './FinancialSummary';
import { useFinancialData } from '../../hooks/useFinancialData'; // Adjust path as needed

// Mock the financial data hook
vi.mock('../../hooks/useFinancialData', () => ({
    useFinancialData: vi.fn()
}));

describe('FinancialSummary Component', () => {
    const mockFinancialData = {
        currentBalance: 5000.00,
        pendingPayouts: 1200.00,
        totalEarnings: 15000.00,
        recentTransactions: [
            {
                id: '1',
                date: '2024-03-01',
                amount: 500.00,
                type: 'payout',
                status: 'completed'
            },
            {
                id: '2',
                date: '2024-02-28',
                amount: 300.00,
                type: 'commission',
                status: 'pending'
            }
        ],
        monthlyEarnings: [
            { month: 'Jan', amount: 1200 },
            { month: 'Feb', amount: 1500 },
            { month: 'Mar', amount: 1800 }
        ]
    };

    beforeEach(() => {
        useFinancialData.mockImplementation(() => ({
            data: mockFinancialData,
            loading: false,
            error: null,
            refetch: vi.fn()
        }));
    });

    test('renders financial summary data', () => {
        render(<FinancialSummary />);

        expect(screen.getByText('$5,000.00')).toBeInTheDocument(); // Current Balance
        expect(screen.getByText('$1,200.00')).toBeInTheDocument(); // Pending Payouts
        expect(screen.getByText('$15,000.00')).toBeInTheDocument(); // Total Earnings
    });

    test('shows loading state', () => {
        useFinancialData.mockImplementation(() => ({
            data: null,
            loading: true,
            error: null,
            refetch: vi.fn()
        }));

        render(<FinancialSummary />);
        expect(screen.getByTestId('financial-summary-skeleton')).toBeInTheDocument();
    });

    test('shows error state', () => {
        useFinancialData.mockImplementation(() => ({
            data: null,
            loading: false,
            error: 'Failed to load financial data',
            refetch: vi.fn()
        }));

        render(<FinancialSummary />);
        expect(screen.getByText(/failed to load financial data/i)).toBeInTheDocument();
    });

    test('renders recent transactions list', () => {
        render(<FinancialSummary />);

        expect(screen.getByText('$500.00')).toBeInTheDocument();
        expect(screen.getByText('$300.00')).toBeInTheDocument();
        expect(screen.getByText(/completed/i)).toBeInTheDocument();
        expect(screen.getByText(/pending/i)).toBeInTheDocument();
    });

    test('handles date range filter change', async () => {
        const mockRefetch = vi.fn();
        useFinancialData.mockImplementation(() => ({
            data: mockFinancialData,
            loading: false,
            error: null,
            refetch: mockRefetch
        }));

        render(<FinancialSummary />);

        const rangeSelect = screen.getByRole('combobox', { name: /date range/i });
        fireEvent.change(rangeSelect, { target: { value: 'last30days' } });

        await waitFor(() => {
            expect(mockRefetch).toHaveBeenCalledWith({ dateRange: 'last30days' });
        });
    });

    test('renders earnings chart', () => {
        render(<FinancialSummary />);

        mockFinancialData.monthlyEarnings.forEach(({ month, amount }) => {
            expect(screen.getByText(month)).toBeInTheDocument();
            expect(screen.getByText(`$${amount}`)).toBeInTheDocument();
        });
    });

    test('handles refresh data button click', async () => {
        const mockRefetch = vi.fn();
        useFinancialData.mockImplementation(() => ({
            data: mockFinancialData,
            loading: false,
            error: null,
            refetch: mockRefetch
        }));

        render(<FinancialSummary />);

        const refreshButton = screen.getByRole('button', { name: /refresh/i });
        fireEvent.click(refreshButton);

        expect(mockRefetch).toHaveBeenCalled();
    });

    test('formats currency values correctly', () => {
        render(<FinancialSummary />);

        const currencyValues = screen.getAllByText(/^\$[\d,]+\.\d{2}$/);
        expect(currencyValues.length).toBeGreaterThan(0);
        currencyValues.forEach(element => {
            expect(element.textContent).toMatch(/^\$[\d,]+\.\d{2}$/);
        });
    });

    test('displays transaction status with correct styling', () => {
        render(<FinancialSummary />);

        const completedStatus = screen.getByText(/completed/i);
        const pendingStatus = screen.getByText(/pending/i);

        expect(completedStatus).toHaveClass('text-green-600');
        expect(pendingStatus).toHaveClass('text-yellow-600');
    });

    test('shows no transactions message when list is empty', () => {
        useFinancialData.mockImplementation(() => ({
            data: { ...mockFinancialData, recentTransactions: [] },
            loading: false,
            error: null,
            refetch: vi.fn()
        }));

        render(<FinancialSummary />);
        expect(screen.getByText(/no recent transactions/i)).toBeInTheDocument();
    });

    test('handles export data functionality', () => {
        const mockExportData = vi.fn();
        render(<FinancialSummary onExport={mockExportData} />);

        const exportButton = screen.getByRole('button', { name: /export/i });
        fireEvent.click(exportButton);

        expect(mockExportData).toHaveBeenCalledWith(mockFinancialData);
    });
}); 