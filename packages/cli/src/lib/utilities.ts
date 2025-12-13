export function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return 'code' in (error as NodeJS.ErrnoException);
}
