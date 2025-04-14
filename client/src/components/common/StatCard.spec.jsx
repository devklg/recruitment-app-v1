import React from 'react';
import { render, screen } from '../../test-utils';
import StatCard from './StatCard';

describe('StatCard Component', () => {
    test('renders with title and value', () => {
        render(<StatCard title="Total Users" value={100} />);
        expect(screen.getByText('Total Users')).toBeInTheDocument();
        expect(screen.getByText('100')).toBeInTheDocument();
    });

    test('renders with description when provided', () => {
        render(
            <StatCard
                title="Revenue"
                value="$1,000"
                description="Monthly revenue"
            />
        );
        expect(screen.getByText('Revenue')).toBeInTheDocument();
        expect(screen.getByText('$1,000')).toBeInTheDocument();
        expect(screen.getByText('Monthly revenue')).toBeInTheDocument();
    });

    test('renders with icon when provided', () => {
        const TestIcon = () => <svg data-testid="test-icon" />;
        render(
            <StatCard
                title="Metrics"
                value={50}
                icon={<TestIcon />}
            />
        );
        expect(screen.getByTestId('test-icon')).toBeInTheDocument();
    });

    test('applies color variant styles correctly', () => {
        render(
            <StatCard
                title="Growth"
                value="20%"
                variant="success"
            />
        );
        const card = screen.getByText('Growth').closest('div');
        expect(card).toHaveClass('bg-green-50');
    });

    test('renders trend indicator when provided', () => {
        render(
            <StatCard
                title="Performance"
                value={75}
                trend={15}
                trendLabel="vs last month"
            />
        );
        expect(screen.getByText('+15%')).toBeInTheDocument();
        expect(screen.getByText('vs last month')).toBeInTheDocument();
    });

    test('applies custom className when provided', () => {
        render(
            <StatCard
                title="Custom Card"
                value={100}
                className="custom-class"
            />
        );
        const card = screen.getByText('Custom Card').closest('div');
        expect(card).toHaveClass('custom-class');
    });

    test('formats large numbers correctly', () => {
        render(
            <StatCard
                title="Big Number"
                value={1000000}
                formatValue={true}
            />
        );
        expect(screen.getByText('1,000,000')).toBeInTheDocument();
    });

    test('renders with footer content when provided', () => {
        render(
            <StatCard
                title="With Footer"
                value={50}
                footer={<div>Additional Info</div>}
            />
        );
        expect(screen.getByText('Additional Info')).toBeInTheDocument();
    });

    test('renders loading state correctly', () => {
        render(
            <StatCard
                title="Loading Card"
                value={null}
                isLoading={true}
            />
        );
        expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
    });

    test('renders negative trend with red color', () => {
        render(
            <StatCard
                title="Negative Trend"
                value={80}
                trend={-10}
                trendLabel="decrease"
            />
        );
        const trendElement = screen.getByText('-10%');
        expect(trendElement).toHaveClass('text-red-600');
    });

    test('renders with subtitle when provided', () => {
        render(
            <StatCard
                title="Main Title"
                subtitle="Subtitle Text"
                value={100}
            />
        );
        expect(screen.getByText('Main Title')).toBeInTheDocument();
        expect(screen.getByText('Subtitle Text')).toBeInTheDocument();
    });
}); 