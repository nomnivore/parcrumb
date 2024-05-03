import {
  createParser,
  Parser,
  withError,
  withResult,
  type ParserStateInter,
} from "../parser";

export type ParserTuple<A extends unknown[]> = {
  [K in keyof A]: Parser<A[K]>;
};

export const tuple = <A extends unknown[]>(...parsers: ParserTuple<A>) =>
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

      results.push(nextState.result);
      prevState = nextState;
    }

    return withResult(prevState, results);
  });

// TODO: unneeded? just use tuple :)
export const pair = <A, B>(a: Parser<A>, b: Parser<B>) => tuple(a, b);

type ArrayToUnion<A extends unknown[]> = (
  A extends any ? (k: A[number]) => void : never
) extends (k: infer I) => void
  ? I
  : never;

export const alt = <A extends unknown[]>(
  ...parsers: { [K in keyof A]: Parser<A[K]> }
) =>
  createParser<ArrayToUnion<A>>((state) => {
    const { isError } = state;

    if (isError) return withResult(state); // bubble errors up

    for (const parser of parsers) {
      const nextState = parser.transform({ ...state });
      if (!nextState.isError) {
        return withResult(nextState, nextState.result as ArrayToUnion<A>);
      }
    }

    return withError(state, "No parser matched in 'alt'");
  });

/**
 * succeeds if all parsers succeed, in any order
 */
export const permutation = <A extends unknown[]>(...parsers: ParserTuple<A>) =>
  createParser<A>((state) => {
    const { isError } = state;

    if (isError) return withResult(state); // bubble errors up

    let prevState = state;
    let results: A = [] as any;

    const completed = new Set<number>();

    let hasProgress = true;

    while (hasProgress && completed.size < parsers.length) {
      hasProgress = false;

      for (const [i, parser] of parsers.entries()) {
        if (completed.has(i)) continue;

        const nextState = parser.transform({ ...prevState });

        if (nextState.isError) continue;

        // parser succeeded
        completed.add(i);
        hasProgress = true;
        results[i] = nextState.result;

        prevState = nextState;
      }
    }

    // TODO: add error message for which parsers failed
    if (completed.size < parsers.length) {
      return withError(prevState, "Not all parsers succeeded in permutation");
    }

    return withResult(prevState, results);
  });

/**
 * returns the middle parser's result if all parsers succeed
 */
export const delimited = <A, B, C>(
  pre: Parser<A>,
  parser: Parser<B>,
  post: Parser<C>,
) =>
  tuple(pre, parser, post).andThen<B>((state) => {
    if (state.isError || state.result == undefined)
      return withError(state, "Delimited parser failed");

    const res = state.result[1];

    return withResult(state, res);
  });

/**
 * returns the second parser's result if both succeed
 */
export const preceded = <A, B>(pre: Parser<A>, parser: Parser<B>) =>
  tuple(pre, parser).andThen<B>((state) => {
    if (state.isError || state.result == undefined)
      return withError(state, "Preceded parser failed");

    const res = state.result[1];

    return withResult(state, res);
  });

/**
 * returns the first parser's result if both succeed
 */
export const terminated = <A, B>(parser: Parser<A>, post: Parser<B>) =>
  tuple(parser, post).andThen<A>((state) => {
    if (state.isError || state.result == undefined)
      return withError(state, "Terminated parser failed");

    const res = state.result[0];

    return withResult(state, res);
  });

/**
 * returns the first and third parser's results `[A, C]` if all 3 parsers succeed
 */
export const separatedPair = <A, B, C>(
  left: Parser<A>,
  separator: Parser<B>,
  right: Parser<C>,
) =>
  tuple(left, separator, right).andThen<[A, C]>((state) => {
    if (state.isError || state.result == undefined)
      return withError(state, "SeparatedPair parser failed");

    const lr = state.result[0];
    const rr = state.result[2];

    return withResult(state, [lr, rr]);
  });

export const count = <T>(parser: Parser<T>, count: number) =>
  createParser<T[]>((state) => {
    const { isError } = state;

    if (isError) return withResult(state); // bubble errors up

    const results: T[] = [];

    let prevState = state as ParserStateInter<T>;

    for (let i = 0; i < count; i++) {
      prevState = parser.transform(prevState);

      if (prevState.isError)
        return withError(prevState, `Count parser failed on iteration ${i}`);

      results.push(prevState.result!);
    }

    return withResult(prevState, results);
  });
