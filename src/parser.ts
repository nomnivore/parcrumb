import { alt, tuple } from "./parsers/combinators";
import {
  allConsuming,
  andThen,
  cond,
  consumed,
  map,
  opt,
  peek,
  recognize,
  value,
  verify,
} from "./parsers/modifiers";

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

export type ParserStateResult<T> = {
  target: string;
  index: number;
  result: T;
  isError: false;
  errors: ParserError[];
};
export type ParserStateError<T> = {
  target: string;
  index: number;
  result: undefined;
  isError: true;
  errors: ParserError[];
};

export type ParserStateResultOrError<T> =
  | ParserStateResult<T>
  | ParserStateError<T>;

export function isParserResult<T>(
  state: ParserStateInter<T>,
): state is ParserStateResult<T> {
  return !state.isError;
}

/**
 * @template T the next parser's result type
 * @template F the previous parser's result type, if applicable.
 */
export type StateTransformer<T, F = unknown> = (
  state: ParserStateInter<F>,
) => ParserStateInter<T>;

export class Parser<T> {
  /**
   * used internally by parsers to transform intermediary parser state
   */
  public transform: StateTransformer<T>;

  /**
   * use `createParser` to create a new parser
   */
  constructor(fn: StateTransformer<T>) {
    this.transform = fn;
  }

  parse(target: string): ParserStateResultOrError<T> {
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
   * @alias `this.parse`
   */
  run = this.parse;

  /**
   * chain two parsers together (monadic bind `>>=`)
   * identical to `andThen(this, fn)`
   * @returns a new parser that first runs the current parser and then feeds the resulting state into itself
   * @template U the type of the new parser's result
   */
  andThen<U>(fn: StateTransformer<U, T>): Parser<U> {
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
   * makes the parser optional, returning `null` if the parser fails
   * identical to `opt(this)`
   */
  opt(): Parser<T | null> {
    return opt(this);
  }

  /**
   * returns the result of the parser only if it has consumed all input
   * identical to `allConsuming(this)`
   */
  allConsuming(): Parser<T> {
    return allConsuming(this);
  }

  /**
   * returns the result of the parser without consuming any input
   */
  peek(): Parser<T> {
    return peek(this);
  }

  /**
   * returns the consumed input of the parser
   * idential to `recognize(this)`
   */
  recognize(): Parser<string> {
    return recognize(this);
  }

  /**
   * returns the consumed input and the result of the parser in a tuple
   * identical to `consumed(this)`
   * @returns \[consumed as `string`, result as `T`]
   */
  consumed(): Parser<[string, T]> {
    return consumed(this);
  }

  /**
   * runs the parser only if the condition is true
   * identical to `cond(this, condition)`
   */
  cond(condition: () => boolean | boolean): Parser<T> {
    return cond(this, condition);
  }

  /**
   * runs the parser and returns a successful result only if the result matches the condition
   * identical to `verify(this, condition)`
   * else, returns an error state
   */
  verify(condition: (result: T) => boolean): Parser<T> {
    return verify(this, condition);
  }

  /**
   * returns `value` if the parser succeeds
   * similar to `map(parser, () => value)`
   */
  value<U>(val: U): Parser<U> {
    return value(this, val);
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

/**
 * creates a new parser from state transformer `fn`
 * @template T the type of the parser's result
 */
export function createParser<T>(fn: StateTransformer<T>): Parser<T> {
  return new Parser<T>(fn);
}
