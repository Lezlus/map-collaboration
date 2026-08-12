/**
 * Simply appends the CDN Link in your ENV vars
 */
export function cdnStringifier(...args: string[]) {
  const cdnPrefix = process.env.NEXT_PUBLIC_CDN!;
  return `https://${cdnPrefix}/` + args.join("/");
}