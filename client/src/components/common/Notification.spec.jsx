import React from 'react';
import { render, screen, fireEvent } from '../../test-utils';
import { vi } from 'vitest';
import Notification from './Notification';

describe('Notification Component', () => {
    test('renders notification with message', () => {
        render(<Notification message="Test notification" />);
        expect(screen.getByText('Test notification')).toBeInTheDocument();
    });

    test('applies correct styles for success type', () => {
        render(<Notification type="success" message="Success message" />);
        const notification = screen.getByRole('alert');
        expect(notification).toHaveClass('bg-green-50', 'text-green-800');
    });

    test('applies correct styles for error type', () => {
        render(<Notification type="error" message="Error message" />);
        const notification = screen.getByRole('alert');
        expect(notification).toHaveClass('bg-red-50', 'text-red-800');
    });

    test('applies correct styles for warning type', () => {
        render(<Notification type="warning" message="Warning message" />);
        const notification = screen.getByRole('alert');
        expect(notification).toHaveClass('bg-yellow-50', 'text-yellow-800');
    });

    test('applies correct styles for info type', () => {
        render(<Notification type="info" message="Info message" />);
        const notification = screen.getByRole('alert');
        expect(notification).toHaveClass('bg-blue-50', 'text-blue-800');
    });

    test('calls onClose when close button is clicked', () => {
        const handleClose = vi.fn();
        render(
            <Notification
                message="Closeable notification"
                onClose={handleClose}
                showCloseButton
            />
        );

        const closeButton = screen.getByRole('button', { name: /close/i });
        fireEvent.click(closeButton);
        expect(handleClose).toHaveBeenCalledTimes(1);
    });

    test('does not show close button when showCloseButton is false', () => {
        render(
            <Notification
                message="Non-closeable notification"
                showCloseButton={false}
            />
        );

        const closeButton = screen.queryByRole('button', { name: /close/i });
        expect(closeButton).not.toBeInTheDocument();
    });

    test('renders with custom icon when provided', () => {
        const TestIcon = () => <svg data-testid="test-icon" />;
        render(
            <Notification
                message="Notification with icon"
                icon={<TestIcon />}
            />
        );

        expect(screen.getByTestId('test-icon')).toBeInTheDocument();
    });

    test('auto-dismisses after specified duration', () => {
        vi.useFakeTimers();
        const handleClose = vi.fn();

        render(
            <Notification
                message="Auto-dismiss notification"
                onClose={handleClose}
                autoDismiss={true}
                duration={3000}
            />
        );

        expect(handleClose).not.toHaveBeenCalled();

        vi.advanceTimersByTime(3000);
        expect(handleClose).toHaveBeenCalledTimes(1);

        vi.useRealTimers();
    });

    test('applies custom className when provided', () => {
        render(
            <Notification
                message="Custom styled notification"
                className="custom-class"
            />
        );

        const notification = screen.getByRole('alert');
        expect(notification).toHaveClass('custom-class');
    });

    test('renders with title when provided', () => {
        render(
            <Notification
                message="Notification content"
                title="Notification Title"
            />
        );

        expect(screen.getByText('Notification Title')).toBeInTheDocument();
        expect(screen.getByText('Notification content')).toBeInTheDocument();
    });
}); 