import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../test-utils';
import { vi } from 'vitest';
import TeamGrowthVisualization from './TeamGrowthVisualization';
import { useTeamMetrics } from '../../hooks/useTeamMetrics'; // Adjust path as needed

// Mock the team metrics hook
vi.mock('../../hooks/useTeamMetrics', () => ({
    useTeamMetrics: vi.fn()
}));

describe('TeamGrowthVisualization Component', () => {
    const mockTeamData = {
        totalMembers: 50,
        activeMembers: 45,
        growthRate: 15,
        monthlyGrowth: [
            { month: 'Jan', members: 30 },
            { month: 'Feb', members: 35 },
            { month: 'Mar', members: 42 },
            { month: 'Apr', members: 50 }
        ],
        teamStructure: {
            levels: 3,
            distribution: [
                { level: 1, count: 5 },
                { level: 2, count: 15 },
                { level: 3, count: 30 }
            ]
        },
        activityMetrics: {
            highlyActive: 30,
            moderatelyActive: 10,
            lowActive: 5,
            inactive: 5
        }
    };

    beforeEach(() => {
        useTeamMetrics.mockImplementation(() => ({
            data: mockTeamData,
            loading: false,
            error: null,
            refetch: vi.fn()
        }));
    });

    test('renders team growth chart', () => {
        render(<TeamGrowthVisualization />);

        mockTeamData.monthlyGrowth.forEach(({ month, members }) => {
            const monthLabel = screen.getByTestId(`month-label-${month.toLowerCase()}`);
            const memberCount = screen.getByTestId(`member-count-${month.toLowerCase()}`);

            expect(monthLabel).toHaveTextContent(month);
            expect(memberCount).toHaveTextContent(members.toString());
        });
    });

    test('shows loading state', () => {
        useTeamMetrics.mockImplementation(() => ({
            data: null,
            loading: true,
            error: null
        }));

        render(<TeamGrowthVisualization />);
        expect(screen.getByTestId('visualization-skeleton')).toBeInTheDocument();
    });

    test('shows error state', () => {
        useTeamMetrics.mockImplementation(() => ({
            data: null,
            loading: false,
            error: 'Failed to load team metrics'
        }));

        render(<TeamGrowthVisualization />);
        expect(screen.getByText(/failed to load team metrics/i)).toBeInTheDocument();
    });

    test('displays team structure visualization', () => {
        render(<TeamGrowthVisualization />);

        mockTeamData.teamStructure.distribution.forEach(({ level, count }) => {
            const levelElement = screen.getByTestId(`team-level-${level}`);
            expect(levelElement).toBeInTheDocument();
            expect(screen.getByTestId(`team-level-${level}-count`)).toHaveTextContent(count.toString());
        });
    });

    test('shows activity distribution', () => {
        render(<TeamGrowthVisualization />);

        expect(screen.getByText(/highly active/i)).toBeInTheDocument();
        expect(screen.getByText(/moderately active/i)).toBeInTheDocument();
        expect(screen.getByText(/low active/i)).toBeInTheDocument();
        expect(screen.getByText(/inactive/i)).toBeInTheDocument();
    });

    test('handles time period filter change', async () => {
        const mockRefetch = vi.fn();
        useTeamMetrics.mockImplementation(() => ({
            data: mockTeamData,
            loading: false,
            error: null,
            refetch: mockRefetch
        }));

        render(<TeamGrowthVisualization />);

        const periodSelect = screen.getByRole('combobox', { name: /time period/i });
        fireEvent.change(periodSelect, { target: { value: '6months' } });

        await waitFor(() => {
            expect(mockRefetch).toHaveBeenCalledWith({ period: '6months' });
        });
    });

    test('displays growth rate indicator', () => {
        render(<TeamGrowthVisualization />);

        expect(screen.getByText(/15%/)).toBeInTheDocument();
        expect(screen.getByTestId('growth-indicator')).toHaveClass('text-green-600');
    });

    test('shows active vs total members ratio', () => {
        render(<TeamGrowthVisualization />);

        expect(screen.getByText(/45\/50/)).toBeInTheDocument();
        expect(screen.getByText(/active members/i)).toBeInTheDocument();
    });

    test('handles visualization type toggle', () => {
        render(<TeamGrowthVisualization />);

        const lineChartButton = screen.getByRole('button', { name: /line chart/i });
        const barChartButton = screen.getByRole('button', { name: /bar chart/i });

        fireEvent.click(barChartButton);
        expect(screen.getByTestId('bar-chart')).toBeInTheDocument();

        fireEvent.click(lineChartButton);
        expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });

    test('displays tooltips on hover', async () => {
        render(<TeamGrowthVisualization />);

        const dataPoint = screen.getByTestId('chart-point-jan');
        fireEvent.mouseEnter(dataPoint);

        await waitFor(() => {
            const tooltip = screen.getByTestId('tooltip-jan');
            expect(tooltip).toBeInTheDocument();
            expect(tooltip).toHaveTextContent('January 2024: 30 members');
        });

        fireEvent.mouseLeave(dataPoint);
        await waitFor(() => {
            expect(screen.queryByTestId('tooltip-jan')).not.toBeInTheDocument();
        });
    });

    test('handles data export', () => {
        const mockCreateObjectURL = vi.fn();
        const mockRevokeObjectURL = vi.fn();

        // Mock URL methods
        global.URL.createObjectURL = mockCreateObjectURL;
        global.URL.revokeObjectURL = mockRevokeObjectURL;

        // Test with onExport prop
        const mockOnExport = vi.fn();
        const { unmount } = render(<TeamGrowthVisualization onExport={mockOnExport} />);

        const exportButton = screen.getByTestId('export-data-button');
        fireEvent.click(exportButton);
        expect(mockOnExport).toHaveBeenCalledWith(expect.any(Blob));

        // Clean up first render
        unmount();

        // Reset mocks
        mockCreateObjectURL.mockClear();
        mockRevokeObjectURL.mockClear();

        // Test without onExport prop
        render(<TeamGrowthVisualization />);
        const defaultExportButton = screen.getByTestId('export-data-button');
        fireEvent.click(defaultExportButton);

        expect(mockCreateObjectURL).toHaveBeenCalled();
        expect(mockRevokeObjectURL).toHaveBeenCalled();
    });

    test('displays no data message when data is empty', () => {
        useTeamMetrics.mockImplementation(() => ({
            data: { ...mockTeamData, monthlyGrowth: [] },
            loading: false,
            error: null
        }));

        render(<TeamGrowthVisualization />);
        expect(screen.getByText(/no growth data available/i)).toBeInTheDocument();
    });

    test('updates automatically on interval', () => {
        vi.useFakeTimers();
        const mockRefetch = vi.fn();
        useTeamMetrics.mockImplementation(() => ({
            data: mockTeamData,
            loading: false,
            error: null,
            refetch: mockRefetch
        }));

        render(<TeamGrowthVisualization autoUpdate />);

        vi.advanceTimersByTime(300000); // 5 minutes
        expect(mockRefetch).toHaveBeenCalled();

        vi.useRealTimers();
    });
}); 