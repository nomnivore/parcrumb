import { expect, test, describe } from "bun:test";
import { expectTypeOf } from "expect-type";
import {
  alt,
  count,
  delimited,
  digit,
  isNot,
  many,
  many1,
  pair,
  permutation,
  tag,
  tuple,
} from "..";

describe("pair", () => {
  test("run both parsers correctly", () => {
    const parser = pair(tag("count: "), digit);

    const state = parser.parse("count: 5");

    expect(state.result).toBeDefined();

    expect(state.result && state.result[0]).toBe("count: ");
    expect(state.result && state.result[1]).toBe("5");
  });

  test("bubble errors up when one parser errors", () => {
    const parser = pair(tag("hello"), tag("world"));

    const state = parser.parse("fooworld");

    expect(state.result).toBeUndefined();
    expect(state.isError).toBeTrue();
    expect(state.errors.length).toBeGreaterThan(0);
  });
});

describe("tuple", () => {
  test("run all parsers correctly", () => {
    const parser = tuple(
      tag("score: "),
      digit.map((x) => parseInt(x)),
      tag(" points"),
    );

    const state = parser.parse("score: 5 points");

    expect(state.result).toBeDefined();
    expect(state.result && state.result[0]).toBe("score: ");
    expect(state.result && state.result[1]).toBe(5);
    expect(state.result && state.result[2]).toBe(" points");
  });
});

describe("alt", () => {
  test("run and return the first parser that matches", () => {
    const parser = alt(tag("foo"), tag("bar"));

    expect(parser.parse("foobar").result).toBe("foo");
    expect(parser.parse("barfoo").result).toBe("bar");
    expect(parser.parse("baz").isError).toBeTrue();
  });

  test("properly extract the type of the result", () => {
    const parser = alt(tag("count: "), digit.map(parseInt));

    expectTypeOf<ReturnType<typeof parser.parse>["result"]>().toEqualTypeOf<
      string | number | undefined
    >();
  });
});

describe("permutation", () => {
  test("run all parsers in any order", () => {
    const parser = permutation(tag("foo"), tag("bar"), tag("baz"));

    expect(parser.parse("barbazfoo").result).toEqual(["foo", "bar", "baz"]);
    expect(parser.parse("bazfoobar").result).toEqual(["foo", "bar", "baz"]);
    expect(parser.parse("foobarbaz1").result).toEqual(["foo", "bar", "baz"]);
    expect(parser.parse("bazfoo").isError).toBeTrue();
  });
});

describe("delimited", () => {
  test("return the result of the middle parser if all succeed", () => {
    const parser = delimited(tag("("), digit, tag(")"));

    expect(parser.parse("(5)").result).toBe("5");
    expect(parser.parse("(foo)").isError).toBeTrue();
    expect(parser.parse("5").isError).toBeTrue();
    expect(parser.parse("(5").isError).toBeTrue();
  });

  test("should work with a variable-length parser", () => {
    const parser = delimited(tag("["), isNot("]"), tag("]"));

    expect(parser.parse("[foo]").result).toBe("foo");

    expect(parser.parse("[foo bar]").result).toBe("foo bar");
  });
});

// TODO: tests for preceded, terminated, separatedPair

describe("count", () => {
  test("apply the parser n number of times", () => {
    const parser = count(digit, 5);

    expect(parser.parse("12345").result).toHaveLength(5);
    expect(parser.parse("123456").result).toHaveLength(5);
    expect(parser.parse("111").isError).toBeTrue();
  });
});

describe("many", () => {
  test("apply the parser zero or more times", () => {
    const parser = many(digit);

    expect(parser.parse("12345").result).toHaveLength(5);
    expect(parser.parse("").result).toHaveLength(0);
    expect(parser.parse("foo").result).toHaveLength(0);
    expect(parser.parse("zero").isError).toBeFalse();
  });
});

describe("many1", () => {
  test("error if the parser fails to match at least once", () => {
    const parser = many1(digit);

    expect(parser.parse("12345").result).toHaveLength(5);

    expect(parser.parse("").isError).toBeTrue();
  });
});
