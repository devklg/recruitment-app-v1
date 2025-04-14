import React from 'react';
import { twMerge } from 'tailwind-merge';

const Card = ({
    children,
    className,
    header,
    footer,
    padding = 'p-4',
    hoverable = false,
    bordered = false,
}) => {
    const cardClasses = twMerge(
        'bg-white rounded-lg shadow-md',
        padding,
        hoverable && ['hover:shadow-lg', 'transition-shadow'].join(' '),
        bordered && ['border', 'border-gray-200'].join(' '),
        className
    );

    return (
        <div className={cardClasses} data-testid="card">
            {header && (
                <div className="px-4 py-3 border-b border-gray-200">
                    {header}
                </div>
            )}
            <div className={!header && !footer ? padding : 'px-4 py-3'}>
                {children}
            </div>
            {footer && (
                <div className="px-4 py-3 border-t border-gray-200">
                    {footer}
                </div>
            )}
        </div>
    );
};

export default Card;
