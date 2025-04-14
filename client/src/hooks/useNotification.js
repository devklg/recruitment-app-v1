import { useCallback } from 'react';

export const useNotification = () => {
    const showNotification = useCallback((message, type = 'info') => {
        // In a real app, this would integrate with a notification system
        // For now, we'll just console.log
        console.log(`[${type.toUpperCase()}] ${message}`);
    }, []);

    return { showNotification };
}; 