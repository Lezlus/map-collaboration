/** Retruns a date in the format of ddd mmm yyyy */
export const dateFormatter = (date: string): string => {
  return new Date(date).toDateString();
}