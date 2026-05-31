import '@testing-library/jest-dom';

// Suppress console noise in tests
const originalError = console.error;
console.error = (...args: unknown[]) => {
    // Ignore React act() warnings in tests
    if (typeof args[0] === 'string' && args[0].includes('act(')) return;
    originalError(...args);
};
