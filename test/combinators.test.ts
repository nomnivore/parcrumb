import { expect, test, describe } from "bun:test";
import { alpha, digit, pair, tag } from "..";

describe("map", () => {
  test("transform the result of a parser", () => {
    const parser = digit.map((result) => parseInt(result));

    expect(parser.run("5").result).toBe(5);
  });
});

describe("tag", () => {
  test("match a given label", () => {
    const parser = tag("hello");

    expect(parser.run("hello").result).toBe("hello");
    expect(parser.run("world").result).toBeUndefined();
    expect(parser.run("x").result).toBeUndefined();

    expect(parser.run("hello world")).toSatisfy(
      (state) => state.target.slice(state.index) == " world",
    );
  });

  test("error on an empty label", () => {
    const state = tag("").run("hello world");
    expect(state.isError).toBeTrue();
    expect(state.result).toBeUndefined();
  });
});

describe("alpha", () => {
  const parser = alpha;
  test("match alphabet characters", () => {
    expect(parser.run("abc").result).toBe("a");
    expect(parser.run("A").result).toBe("A");
    expect(parser.run("z").result).toBe("z");
    expect(parser.run("g").result).toBe("g");
    expect(parser.run("Z").result).toBe("Z");

    expect(parser.run("|x&!").result).toBeUndefined();
  });

  test("increment index", () => {
    expect(parser.run("x234").index).toBe(1);
  });

  test("handle empty input", () => {
    expect(parser.run("").isError).toBeTrue();
  });
});

describe("digit", () => {
  const parser = digit;

  test("match digits", () => {
    expect(parser.run("12").result).toBe("1");
    expect(parser.run("0").result).toBe("0");
    expect(parser.run("9").result).toBe("9");
    expect(parser.run(" 9").result).toBeUndefined();
    expect(parser.run("X").result).toBeUndefined();
  });
});

describe("pair", () => {
  test("run both parsers correctly", () => {
    const parser = pair(tag("count: "), digit);

    const state = parser.run("count: 5");

    console.log(state);

    expect(state.result).toBeDefined();

    expect(state.result && state.result[0]).toBe("count: ");
    expect(state.result && state.result[1]).toBe("5");
  });

  test("bubble errors up when one parser errors", () => {
    const parser = pair(tag("hello"), tag("world"));

    const state = parser.run("fooworld");

    expect(state.result).toBeUndefined();
    expect(state.isError).toBeTrue();
    expect(state.errors).toHaveLength(1);
  });
});

describe("rest", () => {
  test("return the rest of the input", () => {
    // TODO:
  });
});
