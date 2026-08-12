import z from "zod";

export function zodValidator<T>(schema: z.ZodType<T>, data: unknown): T | null {
  const parsedData = schema.safeParse(data);
  if (!parsedData.success) {
    return null;
  }
  return parsedData.data;
}