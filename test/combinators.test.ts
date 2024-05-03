import { expect, test, describe } from "bun:test";
import { expectTypeOf } from "expect-type";
import {
  alt,
  count,
  delimited,
  digit,
  isNot,
  pair,
  permutation,
  tag,
  tuple,
} from "..";

describe("pair", () => {
  test("run both parsers correctly", () => {
    const parser = pair(tag("count: "), digit);

    const state = parser.run("count: 5");

    expect(state.result).toBeDefined();

    expect(state.result && state.result[0]).toBe("count: ");
    expect(state.result && state.result[1]).toBe("5");
  });

  test("bubble errors up when one parser errors", () => {
    const parser = pair(tag("hello"), tag("world"));

    const state = parser.run("fooworld");

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

    const state = parser.run("score: 5 points");

    expect(state.result).toBeDefined();
    expect(state.result && state.result[0]).toBe("score: ");
    expect(state.result && state.result[1]).toBe(5);
    expect(state.result && state.result[2]).toBe(" points");
  });
});

describe("alt", () => {
  test("run and return the first parser that matches", () => {
    const parser = alt(tag("foo"), tag("bar"));

    expect(parser.run("foobar").result).toBe("foo");
    expect(parser.run("barfoo").result).toBe("bar");
    expect(parser.run("baz").isError).toBeTrue();
  });

  test("properly extract the type of the result", () => {
    const parser = alt(tag("count: "), digit.map(parseInt));

    expectTypeOf<ReturnType<typeof parser.run>["result"]>().toEqualTypeOf<
      string | number | undefined
    >();
  });
});

describe("permutation", () => {
  test("run all parsers in any order", () => {
    const parser = permutation(tag("foo"), tag("bar"), tag("baz"));

    expect(parser.run("barbazfoo").result).toEqual(["foo", "bar", "baz"]);
    expect(parser.run("bazfoobar").result).toEqual(["foo", "bar", "baz"]);
    expect(parser.run("foobarbaz1").result).toEqual(["foo", "bar", "baz"]);
    expect(parser.run("bazfoo").isError).toBeTrue();
  });
});

describe("delimited", () => {
  test("return the result of the middle parser if all succeed", () => {
    const parser = delimited(tag("("), digit, tag(")"));

    expect(parser.run("(5)").result).toBe("5");
    expect(parser.run("(foo)").isError).toBeTrue();
    expect(parser.run("5").isError).toBeTrue();
    expect(parser.run("(5").isError).toBeTrue();
  });

  test("should work with a variable-length parser", () => {
    const parser = delimited(tag("["), isNot("]"), tag("]"));

    expect(parser.run("[foo]").result).toBe("foo");

    expect(parser.run("[foo bar]").result).toBe("foo bar");
  });
});

// TODO: tests for preceded, terminated, separatedPair

describe("count", () => {
  test("apply the parser n number of times", () => {
    const parser = count(digit, 5);

    expect(parser.run("12345").result).toHaveLength(5);
    expect(parser.run("123456").result).toHaveLength(5);
    expect(parser.run("111").isError).toBeTrue();
  });
});
