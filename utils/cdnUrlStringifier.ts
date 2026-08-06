/**
 * Simply appends the CDN Link in your ENV vars
 */
export function cdnStringifier(...args: string[]) {
  const cdnPrefix = process.env.CDN;
  return `https://${cdnPrefix}/` + args.join("/");
}