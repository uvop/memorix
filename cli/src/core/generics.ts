export type MapValue<T> = T extends Map<any, infer I> ? I : never;
