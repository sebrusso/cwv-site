// Optional: add any global test setup here
import '@testing-library/jest-dom/extend-expect';
import { TextEncoder, TextDecoder } from 'util';

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Add any additional setup needed for the testing environment

