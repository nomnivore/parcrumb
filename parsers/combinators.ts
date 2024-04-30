import { createParser, Parser, withError, withResult } from "../parser";

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
