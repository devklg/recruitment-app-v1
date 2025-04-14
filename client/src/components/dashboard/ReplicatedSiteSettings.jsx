import React, { useState, useEffect } from 'react';
import { useSiteSettings } from '../../hooks/useSiteSettings';
import { useNotification } from '../../hooks/useNotification';
import { twMerge } from 'tailwind-merge';

const ReplicatedSiteSettings = () => {
    const { settings, loading, error, updateSettings } = useSiteSettings();
    const { showNotification } = useNotification();
    const [formData, setFormData] = useState({
        siteName: '',
        domain: '',
        contactEmail: '',
        theme: 'light',
        logo: '',
        socialLinks: {
            facebook: '',
            twitter: '',
            instagram: ''
        },
        customization: {
            primaryColor: '#007bff',
            secondaryColor: '#6c757d',
            fontFamily: 'Arial'
        }
    });
    const [validationErrors, setValidationErrors] = useState({});
    const [previewLogo, setPreviewLogo] = useState(null);

    useEffect(() => {
        if (settings) {
            setFormData(settings);
        }
    }, [settings]);

    if (loading) {
        return (
            <div data-testid="settings-skeleton" className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
                <div className="space-y-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-12 bg-gray-200 rounded"></div>
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-red-600 p-4 rounded-lg bg-red-50">
                {error}
            </div>
        );
    }

    const validateForm = () => {
        const errors = {};
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!formData.siteName?.trim()) {
            errors.siteName = 'Site name is required';
        }

        if (!formData.domain?.trim()) {
            errors.domain = 'Domain is required';
        }

        if (!formData.contactEmail?.trim()) {
            errors.contactEmail = 'Please enter a valid email address';
        } else if (!emailRegex.test(formData.contactEmail.trim())) {
            errors.contactEmail = 'Please enter a valid email address';
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const isValid = validateForm();

        if (!isValid) {
            return;
        }

        try {
            await updateSettings(formData);
            showNotification('Settings updated successfully', 'success');
            setValidationErrors({});
        } catch (err) {
            showNotification('Failed to update settings', 'error');
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Only clear validation error if the field has a value
        if (value.trim()) {
            setValidationErrors(prev => ({
                ...prev,
                [name]: undefined
            }));
        }
    };

    const handleLogoUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewLogo(reader.result);
                setFormData(prev => ({
                    ...prev,
                    logo: reader.result
                }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSocialLinkChange = (platform, value) => {
        setFormData(prev => ({
            ...prev,
            socialLinks: {
                ...prev.socialLinks,
                [platform]: value
            }
        }));
    };

    const handleCustomizationChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            customization: {
                ...prev.customization,
                [field]: value
            }
        }));
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            <section>
                <h2 className="text-2xl font-bold mb-4">Basic Information</h2>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="siteName" className="block text-sm font-medium text-gray-700">
                            Site Name
                        </label>
                        <input
                            type="text"
                            id="siteName"
                            name="siteName"
                            value={formData.siteName || ''}
                            onChange={handleChange}
                            className={twMerge(
                                "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500",
                                validationErrors.siteName && "border-red-500"
                            )}
                        />
                        {validationErrors.siteName && (
                            <p className="mt-1 text-sm text-red-600">{validationErrors.siteName}</p>
                        )}
                    </div>

                    <div>
                        <label htmlFor="domain" className="block text-sm font-medium text-gray-700">
                            Domain
                        </label>
                        <input
                            type="text"
                            id="domain"
                            name="domain"
                            value={formData.domain || ''}
                            onChange={handleChange}
                            className={twMerge(
                                "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500",
                                validationErrors.domain && "border-red-500"
                            )}
                        />
                        {validationErrors.domain && (
                            <p className="mt-1 text-sm text-red-600">{validationErrors.domain}</p>
                        )}
                    </div>

                    <div>
                        <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700">
                            Contact Email
                        </label>
                        <input
                            type="email"
                            id="contactEmail"
                            name="contactEmail"
                            value={formData.contactEmail || ''}
                            onChange={handleChange}
                            className={twMerge(
                                "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500",
                                validationErrors.contactEmail && "border-red-500"
                            )}
                            aria-invalid={!!validationErrors.contactEmail}
                        />
                        {validationErrors.contactEmail && (
                            <p role="alert" className="mt-1 text-sm text-red-600">
                                {validationErrors.contactEmail}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Logo</label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleLogoUpload}
                            data-testid="logo-upload"
                            className="mt-1"
                        />
                        {(previewLogo || formData.logo) && (
                            <img
                                src={previewLogo || formData.logo}
                                alt="Site logo preview"
                                className="mt-2 h-20 object-contain"
                            />
                        )}
                    </div>
                </div>
            </section>

            <section>
                <h2 className="text-2xl font-bold mb-4">Theme Settings</h2>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="theme" className="block text-sm font-medium text-gray-700">
                            Theme
                        </label>
                        <select
                            id="theme"
                            name="theme"
                            value={formData.theme || 'light'}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                        >
                            <option value="light">Light</option>
                            <option value="dark">Dark</option>
                        </select>
                    </div>
                    <div
                        data-testid="theme-preview"
                        className={`${formData.theme}-theme`}
                    ></div>
                </div>
            </section>

            <section>
                <h2 className="text-2xl font-bold mb-4">Social Media Links</h2>
                <div className="space-y-4">
                    {['facebook', 'twitter', 'instagram'].map(platform => (
                        <div key={platform}>
                            <label htmlFor={platform} className="block text-sm font-medium text-gray-700 capitalize">
                                {platform}
                            </label>
                            <input
                                type="url"
                                id={platform}
                                value={formData.socialLinks?.[platform] || ''}
                                onChange={(e) => handleSocialLinkChange(platform, e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                            />
                        </div>
                    ))}
                </div>
            </section>

            <section>
                <h2 className="text-2xl font-bold mb-4">Advanced Customization</h2>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="primaryColor" className="block text-sm font-medium text-gray-700">
                            Primary Color
                        </label>
                        <input
                            type="color"
                            id="primaryColor"
                            value={formData.customization?.primaryColor || '#007bff'}
                            onChange={(e) => handleCustomizationChange('primaryColor', e.target.value)}
                            className="mt-1"
                        />
                        <div
                            data-testid="color-preview"
                            className="mt-2 w-10 h-10 rounded"
                            style={{ backgroundColor: formData.customization?.primaryColor }}
                        ></div>
                    </div>
                </div>
            </section>

            <div className="mt-6">
                <button
                    type="submit"
                    className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                >
                    Save Changes
                </button>
            </div>
        </form>
    );
};

export default ReplicatedSiteSettings; 