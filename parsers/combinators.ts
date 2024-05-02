import { createParser, Parser, withError, withResult } from "../parser";

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
