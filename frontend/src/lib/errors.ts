/**
 * Message to show for a caught error. `catch (error)` is `unknown` in strict TS.
 * The axios interceptor already rejects with `new Error(serverMessage)`, but
 * `response.data.message` is still checked for errors that bypass it.
 */
export function getErrorMessage(error: unknown, fallback = 'Something went wrong'): string {
  if (typeof error === 'object' && error !== null) {
    const withResponse = error as { response?: { data?: { message?: unknown } }; message?: unknown };
    const serverMessage = withResponse.response?.data?.message;
    if (typeof serverMessage === 'string' && serverMessage) return serverMessage;
    if (typeof withResponse.message === 'string' && withResponse.message) return withResponse.message;
  }
  if (typeof error === 'string' && error) return error;
  return fallback;
}
