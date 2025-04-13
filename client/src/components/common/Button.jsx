// client/src/components/common/Button.jsx
import React from 'react';

const Button = ({
    children,
    onClick,
    type = 'button',
    variant = 'primary', // e.g., primary, secondary, danger
    size = 'medium', // e.g., small, medium, large
    disabled = false,
    className = '',
    ...props // Pass other props like aria-label, etc.
}) => {
    // Base styles
    const baseStyles = 'font-bold py-2 px-4 rounded-md transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2';

    // Variant styles
    const variantStyles = {
        primary: 'bg-gradient-to-r from-royalBlue to-gold text-white hover:from-gold hover:to-royalBlue focus:ring-gold',
        secondary: 'bg-navy text-gold border border-gold hover:bg-darkNavy focus:ring-gold',
        danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
        // Add more variants as needed
    };

    // Size styles
    const sizeStyles = {
        small: 'text-sm py-1 px-2',
        medium: 'text-base py-2 px-4',
        large: 'text-lg py-3 px-6',
    };

    // Disabled styles
    const disabledStyles = disabled ? 'opacity-50 cursor-not-allowed' : '';

    const combinedClassName = `
    ${baseStyles}
    ${variantStyles[variant] || variantStyles.primary}
    ${sizeStyles[size] || sizeStyles.medium}
    ${disabledStyles}
    ${className}
  `;

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={combinedClassName.trim()}
            {...props}
        >
            {children}
        </button>
    );
};

export default Button;
