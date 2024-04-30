import { Parser, createParser, withError, withResult } from "./parser";
import { isAlphabetic, isDigit } from "./predicates";

// basic parsers

/**
 * matches a specific string exactly
 */
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
 * matches a specific string ignoring case
 */
export const tagIgnoreCase = (label: string) =>
  createParser<string>((state) => {
    const { target, index, isError } = state;

    if (isError) return withResult(state);

    if (!label) {
      return withError(state, `label matcher cannot be empty`);
    }

    const len = label.length;
    const slice = target.slice(index, index + len);

    if (slice.toLowerCase() != label.toLowerCase()) {
      return withError(
        state,
        `Tried to match label '${label}' but got '${slice}' (case-insensitive)`,
      );
    }

    return withResult(state, slice, { index: index + len });
  });

export const char = <C extends string>(char: C) =>
  createParser<C>((state) => {
    const { target, index, isError } = state;

    if (isError) return withResult(state);

    if (char.length != 1) {
      return withError(state, `Expected a single character but got '${char}'`);
    }

    const charAt = target.charAt(index);
    if (charAt != char) {
      return withError(
        state,
        `Tried to match character '${char}' but got '${charAt}'`,
      );
    }

    return withResult(state, char, { index: index + 1 });
  });

/**
 * matches the longest sequence of any of the given characters (in any order, repeating)
 */
export const isA = (chars: string) =>
  createParser<string>((state) => {
    const { target, index, isError } = state;

    if (isError) return withResult(state);

    let matchLength = 0;

    while (index + matchLength < target.length) {
      const nextChar = target.charAt(index + matchLength);
      if (!chars.includes(nextChar)) {
        break;
      }

      matchLength++;
    }

    if (matchLength == 0) {
      return withError(
        state,
        `Tried to match any character in '${chars}' but got '${target.charAt(
          index,
        )}'`,
      );
    }

    return withResult(state, target.slice(index, index + matchLength), {
      index: index + matchLength,
    });
  });

/**
 * matches the longest sequence of none of the given characters
 */
export const isNot = (chars: string) =>
  createParser<string>((state) => {
    const { target, index, isError } = state;

    if (isError) return withResult(state);

    let matchLength = 0;

    while (index + matchLength < target.length) {
      const nextChar = target.charAt(index + matchLength);
      if (chars.includes(nextChar)) {
        break;
      }

      matchLength++;
    }

    if (matchLength == 0) {
      return withError(
        state,
        `Tried to match any character not in '${chars}' but got '${target.charAt(
          index,
        )}'`,
      );
    }

    return withResult(state, target.slice(index, index + matchLength), {
      index: index + matchLength,
    });
  });

/**
 * matches any single character in the given set
 */
export const oneOf = (chars: string) =>
  createParser<string>((state) => {
    const { target, index, isError } = state;

    if (isError) return withResult(state);

    const char = target.charAt(index);
    if (!chars.includes(char)) {
      return withError(
        state,
        `Tried to match one of '${chars}' but got '${char}'`,
      );
    }

    return withResult(state, char, { index: index + 1 });
  });

/**
 * matches any single character not in the given set
 */
export const noneOf = (chars: string) =>
  createParser<string>((state) => {
    const { target, index, isError } = state;

    if (isError) return withResult(state);

    const char = target.charAt(index);
    if (chars.includes(char)) {
      return withError(
        state,
        `Tried to match any character not in '${chars}' but got '${char}'`,
      );
    }

    return withResult(state, char, { index: index + 1 });
  });

/**
 * takes the next `n` characters from the input
 */
export const take = (n: number) =>
  createParser<string>((state) => {
    const { target, index, isError } = state;

    if (isError) return withResult(state);

    if (n < 1) {
      return withError(state, `Tried to take ${n} characters (must be > 0)`);
    }

    const slice = target.slice(index, index + n);
    if (slice.length < n) {
      return withError(state, `Unexpected end of input`);
    }

    return withResult(state, slice, { index: index + n });
  });

export const takeWhile = (predicate: (char: string) => boolean) =>
  createParser<string>((state) => {
    const { target, index, isError } = state;

    if (isError) return withResult(state);

    let matchLength = 0;

    while (index + matchLength < target.length) {
      const nextChar = target.charAt(index + matchLength);
      if (!predicate(nextChar)) {
        break;
      }

      matchLength++;
    }

    // an empty sequence is a valid result, and will return ""

    return withResult(state, target.slice(index, index + matchLength), {
      index: index + matchLength,
    });
  });

export const takeWhile1 = (predicate: (char: string) => boolean) =>
  takeWhile(predicate).andThen<string>((state) => {
    const { result } = state;

    if (result == undefined || result.length == 0) {
      return withError(state, `Expected at least one character`);
    }

    return state;
  });

export const takeUntil = (predicate: (char: string) => boolean) =>
  createParser<string>((state) => {
    const { target, index, isError } = state;

    if (isError) return withResult(state);

    let matchLength = 0;

    while (index + matchLength < target.length) {
      const nextChar = target.charAt(index + matchLength);
      if (predicate(nextChar)) {
        break;
      }

      matchLength++;
    }

    // an empty sequence is a valid result, and will return ""

    return withResult(state, target.slice(index, index + matchLength), {
      index: index + matchLength,
    });
  });

export const takeUntil1 = (predicate: (char: string) => boolean) =>
  takeUntil(predicate).andThen<string>((state) => {
    const { result } = state;

    if (result == undefined || result.length == 0) {
      return withError(state, `Expected at least one character`);
    }

    return state;
  });

/**
 * matches any alphabetic character `a-z` and `A-Z`
 */
export const alpha = createParser((state) => {
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

export const rest = createParser<string>((state) => {
  const { target, index, isError, errors } = state;

  if (isError) return withResult(state); // bubble errors up

  const slice = target.slice(index);

  return withResult(state, slice, { index: index + slice.length });
});

// combinators

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
