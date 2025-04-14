import React from 'react';

const PreEnrollmentForm = () => {
    const handleSubmit = (event) => {
        event.preventDefault();
        // Add form submission logic here
    };

    return (
        <form onSubmit={handleSubmit}>
            <div>
                <label htmlFor="name">Name:</label>
                <input type="text" id="name" name="name" required />
            </div>
            <div>
                <label htmlFor="email">Email:</label>
                <input type="email" id="email" name="email" required />
            </div>
            <button type="submit">Submit</button>
        </form>
    );
};

export default PreEnrollmentForm; 