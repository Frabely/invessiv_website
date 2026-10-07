export type JsonBodySchema<T> = {
  safeParse: (body: unknown) => { success: true; data: T } | { success: false };
};
