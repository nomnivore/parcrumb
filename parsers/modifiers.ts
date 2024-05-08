import type { Parser, ParserStateInter, StateTransformer } from "../parser";
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
 * @template U the type of the new parser's result
 */
export const andThen = <T, U>(
  parser: Parser<T>,
  fn: StateTransformer<U, T>,
): Parser<U> => {
  return createParser<U>((state) => {
    const firstState = parser.transform(state);

    if (firstState.isError) {
      return withError(firstState, "LHS of andThen failed");
    }

    return fn(firstState);
  });
};

/**
 * expects a parser to fail, returning 'null' if it fails
 * and an error state if it succeeds
 */
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

/**
 * returns the result of the parser only if it has consumed all input
 */
export const allConsuming = <T>(parser: Parser<T>) =>
  createParser<T>((state) => {
    const { isError, target } = state;

    if (isError) return withResult(state); // bubble errors up

    const nextState = parser.transform(state);

    if (!isParserResult(nextState)) return nextState;

    if (nextState.index !== target.length)
      return withError(nextState, "parser did not consume all input");

    return nextState;
  });

/**
 * makes the parser optional, returning `null` if the parser fails
 */
export const opt = <T>(parser: Parser<T>) =>
  createParser<T | null>((state) => {
    const { isError } = state;

    if (isError) return withResult(state); // bubble errors up

    const nextState = parser.transform(state);
    if (isParserResult(nextState)) return nextState;

    return withResult(state, null);
  });

/**
 * returns the result of the parser without consuming any input
 */
export const peek = <T>(parser: Parser<T>) =>
  createParser<T>((state) => {
    // return a successful state without changing the index
    const { isError, index } = state;

    if (isError) return withResult(state); // bubble errors up

    const nextState = parser.transform(state);

    if (isParserResult(nextState)) {
      return withResult(nextState, nextState.result, { index });
    }

    return withError({ ...nextState, index }, "peek failed");
  });

/**
 * returns the consumed input of the parser
 */
export const recognize = <T>(parser: Parser<T>) =>
  createParser<string>((state) => {
    const { isError } = state;

    if (isError) return withResult(state); // bubble errors up

    const nextState = parser.transform(state);

    if (!isParserResult(nextState))
      return withError(nextState, "recognize failed");

    const consumed = state.target.slice(state.index, nextState.index);

    return withResult(nextState, consumed);
  });

/**
 * returns the consumed input and the result of the parser in a tuple
 * @returns \[consumed as `string`, result as `T`]
 */
export const consumed = <T>(parser: Parser<T>) =>
  createParser<[string, T]>((state) => {
    const { isError } = state;

    if (isError) return withResult(state); // bubble errors up

    const nextState = parser.transform(state);

    if (!isParserResult(nextState))
      return withError(nextState, "recognize failed");

    const input = state.target.slice(state.index, nextState.index);
    const output = nextState.result;

    return withResult(nextState, [input, output]);
  });

/**
 * runs the parser only if the condition is true
 */
export const cond = <T>(
  parser: Parser<T>,
  condition: () => boolean | boolean,
) =>
  createParser<T>((state) => {
    const { isError } = state;

    if (isError) return withResult(state); // bubble errors up

    const success = typeof condition === "function" ? condition() : condition;
    if (!success) return withError(state, "condition not met");

    return parser.transform(state);
  });

/**
 * runs the parser and returns a successful result only if the result matches the condition
 * else, returns an error state
 */
export const verify = <T>(
  parser: Parser<T>,
  condition: (result: T) => boolean,
) =>
  createParser<T>((state) => {
    const { isError } = state;
    if (isError) return withResult(state); // bubble errors up

    const nextState = parser.transform(state);

    if (!isParserResult(nextState)) return nextState;

    if (!condition(nextState.result))
      return withError(nextState, "verify failed (condition failed)");

    return nextState;
  });

/**
 * returns `value` if the parser succeeds
 * similar to `map(parser, () => value)`
 */
export const value = <U, T>(parser: Parser<T>, value: U) =>
  createParser<U>((state) => {
    const { isError } = state;

    if (isError) return withResult(state); // bubble errors up

    const nextState = parser.transform(state);

    if (!isParserResult(nextState)) return withResult(nextState); // bubble up error

    return withResult(nextState, value);
  });
