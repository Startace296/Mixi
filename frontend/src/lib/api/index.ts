/**
 * Every HTTP call to the backend. Import from here (`lib/api`), not from the files in this
 * folder: tests mock this module path with `vi.mock('.../lib/api')`.
 */
export { API_BASE_URL } from './client';
export * from './auth';
export * from './users';
export * from './friends';
export * from './chat';
export * from './posts';
export * from './calls';
