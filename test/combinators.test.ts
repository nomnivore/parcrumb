import { expect, test, describe } from "bun:test";
import {
  alpha,
  char,
  digit,
  isA,
  isNot,
  noneOf,
  oneOf,
  pair,
  tag,
  tagIgnoreCase,
  tuple,
} from "..";

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

describe("tagIgnoreCase", () => {
  test("match a given label case-insensitively", () => {
    const parser = tagIgnoreCase("hello");

    expect(parser.run("hello").result).toBe("hello");
    expect(parser.run("HELLO").result).toBe("HELLO");
    expect(parser.run("Hello").result).toBe("Hello");
    expect(parser.run("world").result).toBeUndefined();
    expect(parser.run("x").result).toBeUndefined();
  });
});

describe("char", () => {
  test("match a given character", () => {
    const parser = char("x");
    expect(parser.run("x").result).toBe("x");
    expect(parser.run("xyz").result).toBe("x");
    expect(parser.run("X").result).toBeUndefined();
    expect(parser.run("yz").result).toBeUndefined();
  });
});

describe("isA", () => {
  test("match any of the given characters", () => {
    const parser = isA("xyz");
    expect(parser.run("x").result).toBe("x");
    expect(parser.run("y").result).toBe("y");
    expect(parser.run("z").result).toBe("z");
  });

  test("match the longest sequence of any of the given characters", () => {
    const parser = isA("xyz");

    expect(parser.run("xyz").result).toBe("xyz");
    expect(parser.run("xy").result).toBe("xy");
    expect(parser.run("xxyxzax").result).toBe("xxyxz");
  });

  test("update the index correctly", () => {
    const parser = isA("xyz");

    expect(parser.run("xyz").index).toBe(3);
    expect(parser.run("xy").index).toBe(2);
    expect(parser.run("xxyxzax").index).toBe(5);
  });
});

describe("isNot", () => {
  test("match any character not in the given set", () => {
    const parser = isNot("abc");
    expect(parser.run("x").result).toBe("x");
    expect(parser.run("y").result).toBe("y");
    expect(parser.run("b").result).toBeUndefined();
    expect(parser.run("a").result).toBeUndefined();
  });

  test("match the longest sequence of any character not in the given set", () => {
    const parser = isNot("abc");
    expect(parser.run("xyz").result).toBe("xyz");
    expect(parser.run("xy").result).toBe("xy");
    expect(parser.run("xxyxzax").result).toBe("xxyxz");
    expect(parser.run("Hello, world!").result).toBe("Hello, world!");
  });
});

describe("oneOf", () => {
  test("match any character in the given set", () => {
    const parser = oneOf("xyz");
    expect(parser.run("x").result).toBe("x");
    expect(parser.run("y").result).toBe("y");
    expect(parser.run("1").result).toBeUndefined();
  });
});

describe("noneOf", () => {
  test("match any character not in the given set", () => {
    const parser = noneOf("xyz");
    expect(parser.run("a").result).toBe("a");
    expect(parser.run("b").result).toBe("b");
    expect(parser.run("x").result).toBeUndefined();
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

describe("rest", () => {
  test("return the rest of the input", () => {
    // TODO:
  });
});
