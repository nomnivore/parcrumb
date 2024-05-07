import {
  createParser,
  isParserResult,
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

/**
 * returns the result of the first parser that succeeds
 */
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
 * returns the result of the first parser that succeeds
 * @alias alt
 */
export const or = alt;

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
    if (!isParserResult(state))
      return withError(state, "Delimited parser failed");

    const res = state.result[1];

    return withResult(state, res);
  });

/**
 * returns the second parser's result if both succeed
 */
export const preceded = <A, B>(pre: Parser<A>, parser: Parser<B>) =>
  tuple(pre, parser).andThen<B>((state) => {
    if (!isParserResult(state))
      return withError(state, "Preceded parser failed");

    const res = state.result[1];

    return withResult(state, res);
  });

/**
 * returns the first parser's result if both succeed
 */
export const terminated = <A, B>(parser: Parser<A>, post: Parser<B>) =>
  tuple(parser, post).andThen<A>((state) => {
    if (!isParserResult(state))
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
    if (!isParserResult(state))
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

/**
 * runs the parser repeatedly until it fails, returning an array of results
 *
 * see also: `many1`
 */
export const many = <T>(parser: Parser<T>): Parser<T[]> =>
  createParser<T[]>((state) => {
    const { isError } = state;

    if (isError) return withResult(state); // bubble errors up

    const results: T[] = [];

    let prevState = state as ParserStateInter<T>;
    while (!prevState.isError) {
      const nextState = parser.transform(prevState);
      if (nextState.isError) break;
      results.push(nextState.result as T);
      prevState = nextState;
    }

    return withResult(prevState, results);
  });

/**
 * runs the parser at least once, and then repeatedly until it fails, returning an array of results
 *
 * see also: `many`
 */
export const many1 = <T>(parser: Parser<T>): Parser<T[]> =>
  many(parser).andThen((state) => {
    if (!isParserResult(state)) return withResult(state);

    if (state.result.length === 0)
      return withError(state, "Many1 parser failed (no results)");

    return state;
  });

/**
 * runs the parser `parser` until `until` succeeds, returning an array of results and the result of `until`
 *
 * on each iteration, the `until` parser is run. If it succeeds, the `manyUntil` parser will stop and return the results
 */
export const manyUntil = <T, U>(parser: Parser<T>, until: Parser<U>) =>
  createParser<[T[], U]>((state) => {
    const { isError } = state;

    if (isError) return withResult(state); // bubble errors up

    const results: T[] = [];

    let prevState = state as ParserStateInter<T>;
    let untilState = state as ParserStateInter<U>;
    // run until the `until` parser succeeds

    while (true) {
      untilState = until.transform(prevState);
      if (isParserResult(untilState)) break;

      prevState = parser.transform(prevState);
      if (!isParserResult(prevState)) {
        // parser failed

        return withError(
          prevState,
          "ManyUntil parser failed (`parser` failed before `until` parser)",
        );
      }

      results.push(prevState.result as T);
    }

    return withResult(untilState, [results, untilState.result]);
  });

/**
 * runs the given parser up to `max` times, ensuring it has run at least `min` times (inclusive)
 */
export const manyTimes = <T>(parser: Parser<T>, min: number, max: number) =>
  // TODO: write tests
  createParser<T[]>((state) => {
    const { isError } = state;
    if (isError) return withResult(state); // bubble errors up

    if (min < 0 || max < 0 || max < 0)
      return withError(
        state,
        `Invalid min/max values given for 'manyTimes': ${min}/${max}`,
      );

    const results: T[] = [];

    let prevState = state as ParserStateInter<T>;
    // run until the `until` parser succeeds

    for (let i = 0; i < max; i++) {
      const nextState = parser.transform(prevState);
      if (!isParserResult(nextState)) break;

      prevState = nextState;
      results.push(prevState.result as T);
    }

    if (results.length < min)
      return withError(
        prevState,
        `ManyTimes parser ran only ${results.length} times (${min} required)`,
      );

    return withResult(prevState, results);
  });

export const separatedList = <T>(item: Parser<T>, separator: Parser<unknown>) =>
  // TODO: write tests
  createParser<T[]>((state) => {
    const { isError } = state;

    if (isError) return withResult(state); // bubble errors up

    const results: T[] = [];

    // match once then loop all additional 'separator' separated matches

    let prevState = state;
    const first = item.transform(prevState);

    if (!first.isError) {
      results.push(first.result as T);
      prevState = first;
    }

    while (!first.isError) {
      // match a separator first, then another item
      const sep = separator.transform(prevState);
      if (!isParserResult(sep)) break;

      const nextItem = item.transform(sep);
      if (!isParserResult(nextItem)) break;

      results.push(nextItem as T);
      prevState = nextItem;
    }

    return withResult(prevState, results);
  });

export const separatedList1 = <T>(
  item: Parser<T>,
  separator: Parser<unknown>,
) =>
  // TODO: write tests
  separatedList(item, separator).andThen((state) => {
    if (!isParserResult(state)) return state;

    if (state.result.length < 1)
      return withError(state, "separatedList1 did not return any results");

    return state;
  });

// maybe implement some 'fold' parsers? in the meantime, we can use something like
// many(...).map(x => x.reduce(...))
