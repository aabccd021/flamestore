export type ArrayOr<T> = T | T[];
export type ImageMetadata = "height" | "width" | "size";

export function assertNever(x: never): never {
  throw new Error("Unexpected object: " + x);
}

export function assertString(x: string): void {
  if (typeof x !== "string") throw Error();
}
