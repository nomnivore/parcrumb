import { Parser, createParser, withError, withResult } from "./parser";

export function isAlphabetic(str: string): boolean {
  if (str.length != 1) return false;

  const charCode = str.charCodeAt(0);

  if (
    !(charCode >= 65 && charCode <= 90) &&
    !(charCode >= 97 && charCode <= 122)
  ) {
    return false;
  }

  return true;
}

export function isDigit(str: string): boolean {
  if (str.length != 1) return false;

  const charCode = str.charCodeAt(0);

  if (!(charCode >= 48 && charCode <= 57)) {
    return false;
  }

  return true;
}

export function isAlphaNumeric(str: string): boolean {
  return isAlphabetic(str) || isDigit(str);
}

export function isSpace(str: string): boolean {
  return str == " " || str == "\t";
}

export function isNewline(str: string): boolean {
  return str == "\n";
}

export const tag = (label: string) =>
  createParser<string>((state) => {
    const { target, index, isError, errors } = state;

    if (isError) return withResult(state); // bubble errors up

    if (!label) {
      return withError(state, `label matcher cannot be empty`);
    }

    const len = label.length;
    const slice = target.slice(index, index + len);

    if (slice != label) {
      return withError(
        state,
        `Tried to match label '${label}' but got '${slice}'`,
      );
    }

    return {
      result: slice,
      target,
      index: index + len,
      isError,
      errors,
    };
  });

/**
 * matches any alphabetic character `a-z` and `A-Z`
 */
export const alpha = createParser<string>((state) => {
  const { target, index, isError } = state;

  if (isError) return withResult(state); // bubble errors up

  const char = target.charAt(index);
  if (char == "") return withError(state, "Unexpected end of input");

  if (!isAlphabetic(char)) {
    return withError(state, `Tried o match a character but got '${char}'`);
  }

  return withResult(state, target.charAt(index), { index: index + 1 });
});

/**
 * matches any numeric character `0-9`
 */
export const digit = createParser<string>((state) => {
  const { target, index, isError } = state;

  if (isError) return withResult(state); // bubble errors up

  const char = target.charAt(index);
  if (char == "") return withError(state, "Unexpected end of input");

  if (!isDigit(char)) {
    return withError(state, `Tried to match a digit but got '${char}'`);
  }

  return withResult(state, target.charAt(index), { index: index + 1 });
});

export const tuple = <A extends unknown[]>(
  ...parsers: { [K in keyof A]: Parser<A[K]> }
) =>
  createParser<A>((state) => {
    const { isError } = state;

    if (isError) return withResult(state); // bubble errors up

    let prevState = state;
    let results: A = [] as any;
    for (const [i, parser] of parsers.entries()) {
      const nextState = parser.transform({ ...prevState });

      if (nextState.isError) {
        return withError(
          nextState,
          `Error while parsing sequence (parser #${i + 1})`,
        );
      }

      results.push(nextState.result as A);
      prevState = nextState;
    }

    return withResult(prevState, results);
  });

export const pair = <A, B>(a: Parser<A>, b: Parser<B>) => tuple(a, b);

export const rest = createParser<string>((state) => {
  const { target, index, isError, errors } = state;

  if (isError) return withResult(state); // bubble errors up

  const slice = target.slice(index);

  return withResult(state, slice, { index: index + slice.length });
});
