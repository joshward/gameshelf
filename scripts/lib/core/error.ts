export const stringifyError = (error: any): string => {
  return `${error.message || error}`;
}
