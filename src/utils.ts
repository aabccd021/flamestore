export function assertNever(x: never): never {
  throw new Error("Unexpected object: " + x);
}

export function assertString(x: string): void {
  if (typeof x !== "string") throw Error();
}
