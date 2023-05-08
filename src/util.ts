/**
 * Used for functions that take an options objects. Fills in defaults for
 * options not provided.
 *
 * @internal
 */
export const applyDefaults = <T extends Record<string, any>>(
  defaults: T,
  provided?: Partial<T>
) => {
  if (provided === undefined) return defaults;

  const out = { ...defaults };

  Object.entries(provided).forEach(([key, value]: [keyof T, any]) => {
    if (value !== undefined) {
      out[key] = value;
    }
  });

  return out;
};
