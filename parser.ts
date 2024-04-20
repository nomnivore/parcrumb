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

  map<U>(fn: (result: T) => U): Parser<U> {
    return new Parser((state) => {
      const nextState = this.transform({ ...state, result: undefined });
      return {
        ...nextState,
        result:
          nextState.result != undefined ? fn(nextState.result) : undefined,
      };
    });
  }
}

export function createParser<T>(fn: StateTransformer<T>): Parser<T> {
  return new Parser(fn);
}
