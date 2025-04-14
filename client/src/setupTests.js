// client/src/setupTests.js

// Import jest-dom matchers like toBeInTheDocument()
import '@testing-library/jest-dom/extend-expect';

// You can add other global setup here if needed
// For example, mocking global fetch or other APIs

// Example of mocking fetch globally for all tests
// import { vi } from 'vitest';
// global.fetch = vi.fn(() =>
//   Promise.resolve({
//     ok: true,
//     json: () => Promise.resolve({ data: 'mocked data' }),
//   })
// );

// Clean up after each test (optional but good practice)
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => {
  cleanup();
}); 