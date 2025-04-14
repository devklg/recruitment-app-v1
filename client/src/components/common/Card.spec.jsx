import React from 'react';
import { render, screen } from '../../test-utils';
import Card from './Card';

describe('Card Component', () => {
    test('renders children content', () => {
        render(
            <Card>
                <div>Test Content</div>
            </Card>
        );
        expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    test('applies default styles', () => {
        render(<Card>Content</Card>);
        const card = screen.getByTestId('card');
        expect(card).toHaveClass('bg-white', 'rounded-lg', 'shadow-md');
    });

    test('applies custom className when provided', () => {
        render(
            <Card className="custom-class">
                <div>Content</div>
            </Card>
        );
        const card = screen.getByTestId('card');
        expect(card).toHaveClass('custom-class');
    });

    test('renders with header when provided', () => {
        render(
            <Card header={<h2>Card Header</h2>}>
                <div>Content</div>
            </Card>
        );
        expect(screen.getByText('Card Header')).toBeInTheDocument();
        expect(screen.getByText('Content')).toBeInTheDocument();
    });

    test('renders with footer when provided', () => {
        render(
            <Card footer={<div>Card Footer</div>}>
                <div>Content</div>
            </Card>
        );
        expect(screen.getByText('Card Footer')).toBeInTheDocument();
        expect(screen.getByText('Content')).toBeInTheDocument();
    });

    test('applies padding styles correctly', () => {
        render(
            <Card padding="p-8">
                <div>Content</div>
            </Card>
        );
        const card = screen.getByTestId('card');
        expect(card).toHaveClass('p-8');
    });

    test('renders with hover effect when hoverable is true', () => {
        render(
            <Card hoverable>
                <div>Content</div>
            </Card>
        );
        const card = screen.getByTestId('card');
        expect(card).toHaveClass('hover:shadow-lg', 'transition-shadow');
    });

    test('renders with border when bordered is true', () => {
        render(
            <Card bordered>
                <div>Content</div>
            </Card>
        );
        const card = screen.getByTestId('card');
        expect(card).toHaveClass('border', 'border-gray-200');
    });
}); 