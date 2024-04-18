export type ParserError = {
  msg: string;
  index: number;
};

export function addParserError(
  state: ParserState<unknown>,
  msg: string,
): ParserError[] {
  return [...state.errors, { msg, index: state.index }];
}

export function withError<T>(
  state: ParserState<T>,
  msg: string,
): ParserState<T> {
  return {
    ...state,
    isError: true,
    errors: addParserError(state, msg),
  };
}

export type ParserPredicate = (char: string) => boolean;

export type ParserState<T> = {
  target: string;
  index: number;

  result?: T;

  isError: boolean;
  errors: ParserError[];
};

export type StateTransformer<T> = (state: ParserState<T>) => ParserState<T>;

export class Parser<T> {
  public transform: StateTransformer<T>;
  constructor(fn: StateTransformer<T>) {
    this.transform = fn;
  }

  run(target: string) {
    const initial: ParserState<T> = {
      target,
      index: 0,
      isError: false,
      errors: [],
    };

    return this.transform(initial);
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
