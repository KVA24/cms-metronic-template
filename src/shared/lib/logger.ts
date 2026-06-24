/**
 * Logger utility that respects VITE_ENABLE_CONSOLE_LOG environment variable
 * Set VITE_ENABLE_CONSOLE_LOG=true in .env to enable console logs
 *
 * This logger preserves the original call site in dev tools by directly
 * calling console methods when enabled, or using no-op when disabled.
 */

const isConsoleEnabled = import.meta.env.VITE_ENABLE_CONSOLE_LOG === 'true';

// Create bound console methods to preserve stack trace
const noop = () => {};

export const logger = {
  log: isConsoleEnabled ? console.log.bind(console) : noop,
  error: isConsoleEnabled ? console.error.bind(console) : noop,
  warn: isConsoleEnabled ? console.warn.bind(console) : noop,
  info: isConsoleEnabled ? console.info.bind(console) : noop,
  debug: isConsoleEnabled ? console.debug.bind(console) : noop,
};

// Export as default for easier import
export default logger;
