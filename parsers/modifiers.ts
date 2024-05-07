import type { Parser, ParserStateInter } from "../parser";
import { createParser, isParserResult, withError, withResult } from "../parser";

/**
 * creates a new parser that will first run the a parser and then apply a function to the result
 * can be used to transform the result of a parser, e.g. `map(parser, (result) => result + 1)`
 * @template T the type of the first parser's result
 * @template U the type of the new parser's result, returned by the provided function
 */
export const map = <T, U>(
  parser: Parser<T>,
  fn: (result: T) => U,
): Parser<U> => {
  return createParser((state) => {
    const nextState = parser.transform(state);
    return withResult(
      nextState,
      isParserResult(nextState) ? fn(nextState.result) : undefined,
    );
  });
};

/**
 * chain two parsers together (monadic bind `>>=`)
 * @returns a new parser that first runs the current parser and then feeds the resulting state into itself
 * @template U the type of the new parser's result (must be specified explicitly or the resulting type will be `unknown`)
 */
export const andThen = <T, U>(
  parser: Parser<T>,
  fn: (state: ParserStateInter<T>) => ParserStateInter<U>,
): Parser<U> => {
  return createParser<U>((state) => {
    const firstState = parser.transform(state);

    if (firstState.isError) {
      return withError(firstState, "LHS of andThen failed");
    }

    return fn(firstState);
  });
};

export const not = (parser: Parser<unknown>) =>
  createParser<null>((state) => {
    const { isError } = state;

    if (isError) return withResult(state); // bubble errors up

    const nextState = parser.transform(state);
    // do we need anything from nextState? all we care is if it succeeded or not

    if (isParserResult(nextState))
      return withError(
        state,
        "parser provided in 'not' parser succeeded unexpectedly",
      );

    return withResult(state, null);
  });
