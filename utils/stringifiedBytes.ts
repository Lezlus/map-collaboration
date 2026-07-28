  /**
   * Retruns a human readable size of bytes
   * Ex. 1024 bytes == 1KB and so on
   */
export function stringifiedBytes(bytes: number): string {
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const idx = Math.floor(Math.log(bytes) / Math.log(k));
  const roundedValue = (bytes / Math.pow(k, idx));
  const truncatedValue = roundedValue.toString().match(/^-?\d+(?:\.\d{0,1})?/);
  if (truncatedValue) {
    return `${truncatedValue} ${sizes[idx]}`;
  }
  return `${roundedValue.toPrecision(2)} ${sizes[idx]}`;
}