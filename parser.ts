import { alt, tuple } from "./parsers/combinators";
import { andThen, map } from "./parsers/modifiers";

export type ParserError = {
  msg: string;
  index: number;
};

export function addParserError(
  state: ParserStateInter<unknown>,
  msg: string,
): ParserError[] {
  return [...state.errors, { msg, index: state.index }];
}

/**
 * creates a new intermediary parser state with an error message
 */
export function withError<T>(
  state: ParserStateInter<unknown>,
  msg: string,
): ParserStateInter<T> {
  return {
    ...state,
    result: undefined,
    isError: true,
    errors: addParserError(state, msg),
  };
}

/**
 * creates a new intermediary parser state with a result of type T
 * if no result is provided, it will be undefined
 */
export function withResult<T>(
  state: ParserStateInter<unknown>,
  result: T | undefined = undefined,
  overrides: Partial<ParserStateInter<T>> = {},
): ParserStateInter<T> {
  return {
    ...state,
    ...overrides,
    result,
  };
}

export type ParserPredicate = (char: string) => boolean;

export type ParserStateInter<T> = {
  target: string;
  index: number;

  result?: T;

  isError: boolean;
  errors: ParserError[];
};

export type ParserState<T, S extends boolean> = ParserStateInter<T> & {
  isError: S extends true ? false : true;
  result: S extends true ? T : undefined;
};

export type ParserStateResult<T> = ParserState<T, true>;
export type ParserStateError<T> = ParserState<T, false>;

export type ParserStateResultOrError<T> =
  | ParserStateResult<T>
  | ParserStateError<T>;

export function isParserResult<T>(
  state: ParserStateInter<T>,
): state is ParserStateResult<T> {
  return !state.isError;
}

export type StateTransformer<T> = (
  state: ParserStateInter<unknown>,
) => ParserStateInter<T>;

export class Parser<T> {
  public transform: StateTransformer<T>;
  constructor(fn: StateTransformer<T>) {
    this.transform = fn;
  }

  run(target: string): ParserStateResultOrError<T> {
    const initial: ParserStateInter<T> = {
      target,
      index: 0,
      isError: false,
      errors: [],
    };

    const resultState = this.transform(initial);

    if (resultState.isError) {
      return resultState as ParserStateError<T>;
    }

    return resultState as ParserStateResult<T>;
  }

  /**
   * chain two parsers together (monadic bind `>>=`)
   * @returns a new parser that first runs the current parser and then feeds the resulting state into itself
   * @template U the type of the new parser's result (must be specified explicitly or the resulting type will be `unknown`)
   */
  andThen<U>(
    fn: (state: ParserStateInter<T>) => ParserStateInter<U>,
  ): Parser<U> {
    return andThen(this, fn);
  }

  /**
   * runs the current parser and then the provided parser in a sequence, returning an array of both results

   * identical to `tuple(this, parser)`
   */
  and<U>(parser: Parser<U>) {
    return tuple(this, parser);
  }

  /**
   * runs the current parser, and if it fails, runs the provided parser
   * identical to `alt(this, parser)`
   */
  or<U>(parser: Parser<U>): Parser<T | U> {
    return alt(this, parser);
  }

  /**
   * runs the current parser and then applies the provided function to its result as a new parser
   * can be used to transform the result of a parser, e.g. `parser.map(x => x + 1)`
   * @template U the type of the new parser's result
   *
   * identical to `map(parser, fn)`
   */
  map<U>(fn: (result: T) => U): Parser<U> {
    return map(this, fn);
  }
}

export function createParser<T>(fn: StateTransformer<T>): Parser<T> {
  return new Parser<T>(fn);
}
