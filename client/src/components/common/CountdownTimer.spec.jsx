// client/src/components/common/CountdownTimer.spec.jsx

import React from 'react';
import { vi } from 'vitest'; // Use Vitest\'s mocking utilities
import { render, screen, act } from '../../test-utils'; // Use custom render
import CountdownTimer from './CountdownTimer';

// Mock timers for controlling time
vi.useFakeTimers();

describe('CountdownTimer Component', () => {
    test('renders correctly with future date', () => {
        const futureDate = new Date();
        futureDate.setSeconds(futureDate.getSeconds() + 3661); // 1 hour, 1 minute, 1 second
        render(<CountdownTimer targetDate={futureDate} />);

        // Should show days, hours, minutes, seconds
        // Check for text content containing the time units
        expect(screen.getByText(/days/i)).toBeInTheDocument();
        expect(screen.getByText(/hours/i)).toBeInTheDocument();
        expect(screen.getByText(/minutes/i)).toBeInTheDocument();
        expect(screen.getByText(/seconds/i)).toBeInTheDocument();

        // More specific checks might involve checking the actual numbers if needed,
        // but might make tests brittle.
    });

    test('displays zero when target date is reached', () => {
        const nowDate = new Date();
        render(<CountdownTimer targetDate={nowDate} />);

        // Advance time slightly past the target date
        act(() => {
            vi.advanceTimersByTime(1000);
        });

        // Expect all counters to show 00 or similar
        const counters = screen.getAllByText(/\d+/);
        counters.forEach(counter => {
            expect(counter.textContent).toMatch(/^0?0$/);
        });
    });

    test('handles completion callback when timer finishes', () => {
        const onComplete = vi.fn();
        const futureDate = new Date();
        futureDate.setSeconds(futureDate.getSeconds() + 2);

        render(<CountdownTimer targetDate={futureDate} onComplete={onComplete} />);

        expect(onComplete).not.toHaveBeenCalled();

        // Advance time past the target date
        act(() => {
            vi.advanceTimersByTime(3000); // Advance 3 seconds
        });

        // Callback should have been called once
        expect(onComplete).toHaveBeenCalledTimes(1);
    });

    test('handles completion callback immediately if date is in the past', () => {
        const onComplete = vi.fn();
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - 1); // Yesterday

        render(<CountdownTimer targetDate={pastDate} onComplete={onComplete} />);

        // Callback should be called almost immediately (or on first render/effect)
        expect(onComplete).toHaveBeenCalledTimes(1);
    });
});

// Restore real timers after tests in this file
afterAll(() => {
    vi.useRealTimers();
}); 