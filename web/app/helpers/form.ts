export const readForm = async <T extends [string, ...string[]]>(
  request: Request,
  fields: T
): Promise<
  | ({ error: false } & Record<T[number], string>)
  | ({ error: true } & Record<T[number], undefined>)
> => {
  const formData = await request.formData();
  const result: Record<T[number], string> = {} as Record<T[number], string>;
  for (const key of fields) {
    const value = formData.get(key)?.toString();
    if (!value) {
      return { error: true };
    }
    result[key as T[number]] = value;
  }

  return { error: false, ...result };
};
