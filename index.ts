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

export const pair = <A, B>(a: Parser<A>, b: Parser<B>) =>
  createParser<[A, B]>((state) => {
    const { target, index, isError, errors } = state;

    if (isError) return withResult(state); // bubble errors up

    // first run parser A
    const aState = a.transform({ target, index, isError, errors });

    if (aState.isError) return withResult(aState);

    // then run parser B

    const bState = b.transform({
      target,
      index: aState.index,
      isError,
      errors: aState.errors,
    });

    if (bState.isError) return withResult(bState);

    // since neither parser errored, we can assert that results are defined (expected types)
    // HACK: keep an eye on this -- manual type assertion may cause problems in the future

    return withResult(bState, [aState.result as A, bState.result as B]);
  });

export const rest = createParser<string>((state) => {
  const { target, index, isError, errors } = state;

  if (isError) return withResult(state); // bubble errors up

  const slice = target.slice(index);

  return withResult(state, slice, { index: index + slice.length });
});
