// parsers that may use one or more primitives and combinators

import {
  isAlphaNumeric,
  isAlphabetic,
  isDigit,
  isMultispace,
  isScientificNotation,
  isSpace,
} from "../predicates";
import { alt } from "./combinators";
import { char, tag, takeWhile, takeWhile1 } from "./primitives";

export const digit0 = takeWhile(isDigit);
export const digit1 = takeWhile1(isDigit);

export const alpha0 = takeWhile(isAlphabetic);
export const alpha1 = takeWhile1(isAlphabetic);

export const alphanumeric0 = takeWhile(isAlphaNumeric);
export const alphanumeric1 = takeWhile1(isAlphaNumeric);

export const space0 = takeWhile(isSpace);
export const space1 = takeWhile1(isSpace);

export const multispace0 = takeWhile(isMultispace);
export const multispace1 = takeWhile1(isMultispace);

export const newline = char("\n");
export const crlf = tag("\r\n");
export const lineEnding = alt(newline, crlf);

export const notLineEnding = takeWhile((c) => c != "\r" && c != "\n");

export const binary = takeWhile((c) => c == "0" || c == "1");

export const float = takeWhile(isScientificNotation).map((res) =>
  parseFloat(res)
);