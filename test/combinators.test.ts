import { expect, test, describe } from "bun:test";
import { digit, pair, tag, tuple } from "..";

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
