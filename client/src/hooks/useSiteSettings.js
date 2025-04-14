import { useState, useEffect } from 'react';

export const useSiteSettings = () => {
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            // Simulated API call
            const response = await new Promise((resolve) => {
                setTimeout(() => {
                    resolve({
                        siteName: 'My Replicated Site',
                        domain: 'mysite.example.com',
                        theme: 'light',
                        logo: 'https://example.com/logo.png',
                        contactEmail: 'contact@example.com',
                        socialLinks: {
                            facebook: 'https://facebook.com/mysite',
                            twitter: 'https://twitter.com/mysite',
                            instagram: 'https://instagram.com/mysite'
                        },
                        customization: {
                            primaryColor: '#007bff',
                            secondaryColor: '#6c757d',
                            fontFamily: 'Arial'
                        }
                    });
                }, 500);
            });

            setSettings(response);
            setError(null);
        } catch {
            setError('Failed to load settings');
            setSettings(null);
        } finally {
            setLoading(false);
        }
    };

    const updateSettings = async (newSettings) => {
        try {
            setLoading(true);
            // Simulated API call
            await new Promise((resolve) => setTimeout(resolve, 500));
            setSettings(newSettings);
            return true;
        } catch {
            throw new Error('Failed to update settings');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    return {
        settings,
        loading,
        error,
        updateSettings
    };
};
