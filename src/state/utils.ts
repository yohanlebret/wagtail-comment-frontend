export function update<T>(base: T, updatePartial: Partial<T>): T {
  return Object.assign({}, base, updatePartial);
}

export type Partial<T> = {
  [P in keyof T]?: T[P];
};
