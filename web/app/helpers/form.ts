export const readForm = async <
  T extends [FIRST, ...REST],
  FIRST extends string,
  REST extends string[]
>(
  request: Request,
  fields: T
): Promise<[Record<T[number], string>, null] | [null, { message: string }]> => {
  const formData = await request.formData();
  const result: Record<T[number], string> = {} as Record<T[number], string>;
  for (const key of fields) {
    const value = formData.get(key)?.toString();
    if (!value) {
      return [null, { message: `Missing value ${key}` }];
    }
    result[key as T[number]] = value;
  }

  return [result, null];
};
