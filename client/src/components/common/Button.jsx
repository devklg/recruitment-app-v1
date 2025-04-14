// client/src/components/common/Button.jsx
import React from 'react';
import { twMerge } from 'tailwind-merge';

const Button = ({
    children,
    onClick,
    type = 'button',
    variant = 'primary', // e.g., primary, secondary, danger
    size = 'medium', // e.g., small, medium, large
    disabled = false,
    className = '',
    icon = null,
    loading = false,
    fullWidth = false,
    ...props // Pass other props like aria-label, etc.
}) => {
    // Base styles
    const baseStyles = 'inline-flex items-center justify-center font-bold rounded-md transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2';

    // Variant styles
    const variantStyles = {
        primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500',
        secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
        danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
        // Add more variants as needed
    };

    // Size styles
    const sizeStyles = {
        small: 'text-sm py-1 px-2 gap-1',
        medium: 'text-base py-2 px-4 gap-2',
        large: 'text-lg py-3 px-6 gap-3',
    };

    // Disabled styles
    const disabledStyles = disabled || loading ? 'opacity-75 cursor-not-allowed' : '';

    const classes = twMerge(
        baseStyles,
        variantStyles[variant],
        sizeStyles[size],
        fullWidth && 'w-full',
        disabledStyles,
        className
    );

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled || loading}
            className={classes}
            {...props}
        >
            {icon && <span className="inline-flex">{icon}</span>}
            {loading ? (
                <span className="inline-flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Loading...
                </span>
            ) : children}
        </button>
    );
};

export default Button;
