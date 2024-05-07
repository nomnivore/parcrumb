import { expect, test, describe } from "bun:test";
import { alpha, digit } from "..";
import { withResult } from "../parser";

describe("map", () => {
  test("transform the result of a parser", () => {
    const parser = digit.map((result) => parseInt(result));

    expect(parser.parse("5").result).toBe(5);
  });
});

describe("andThen", () => {
  test("chain two parsers together", () => {
    const parser = digit.andThen((state) => {
      const num = parseInt(state.result!);

      return withResult(state, num * 2);
    });

    expect(parser.parse("5").result).toBe(10);
    expect(parser.parse("7").result).toBe(14);
    expect(parser.parse("foo").isError).toBeTrue();
  });
});

describe("and", () => {
  test("run two parsers in sequence", () => {
    const parser = digit.and(digit);

    expect(parser.parse("57").result).toEqual(["5", "7"]);
    expect(parser.parse("foo").isError).toBeTrue();
    expect(parser.parse("5foo").isError).toBeTrue();
    expect(parser.parse("14foo").result).toEqual(["1", "4"]);
  });
});

describe("or", () => {
  test("return the second parser's result if the first fails", () => {
    const parser = digit.or(alpha);

    expect(parser.parse("5").result).toBe("5");
    expect(parser.parse("a").result).toBe("a");
  });
});
