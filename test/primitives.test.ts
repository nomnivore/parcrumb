import { expect, test, describe } from "bun:test";
import {
  alpha,
  char,
  digit,
  isA,
  isNot,
  noneOf,
  oneOf,
  tag,
  tagIgnoreCase,
  take,
  takeWhile,
  takeUntil,
  takeWhile1,
} from "..";

describe("tag", () => {
  test("match a given label", () => {
    const parser = tag("hello");

    expect(parser.parse("hello").result).toBe("hello");
    expect(parser.parse("world").result).toBeUndefined();
    expect(parser.parse("x").result).toBeUndefined();

    expect(parser.parse("hello world")).toSatisfy(
      (state) => state.target.slice(state.index) == " world",
    );
  });

  test("error on an empty label", () => {
    const state = tag("").parse("hello world");
    expect(state.isError).toBeTrue();
    expect(state.result).toBeUndefined();
  });
});

describe("tagIgnoreCase", () => {
  test("match a given label case-insensitively", () => {
    const parser = tagIgnoreCase("hello");

    expect(parser.parse("hello").result).toBe("hello");
    expect(parser.parse("HELLO").result).toBe("HELLO");
    expect(parser.parse("Hello").result).toBe("Hello");
    expect(parser.parse("world").result).toBeUndefined();
    expect(parser.parse("x").result).toBeUndefined();
  });
});

describe("char", () => {
  test("match a given character", () => {
    const parser = char("x");
    expect(parser.parse("x").result).toBe("x");
    expect(parser.parse("xyz").result).toBe("x");
    expect(parser.parse("X").result).toBeUndefined();
    expect(parser.parse("yz").result).toBeUndefined();
  });
});

describe("isA", () => {
  test("match any of the given characters", () => {
    const parser = isA("xyz");
    expect(parser.parse("x").result).toBe("x");
    expect(parser.parse("y").result).toBe("y");
    expect(parser.parse("z").result).toBe("z");
  });

  test("match the longest sequence of any of the given characters", () => {
    const parser = isA("xyz");

    expect(parser.parse("xyz").result).toBe("xyz");
    expect(parser.parse("xy").result).toBe("xy");
    expect(parser.parse("xxyxzax").result).toBe("xxyxz");
  });

  test("update the index correctly", () => {
    const parser = isA("xyz");

    expect(parser.parse("xyz").index).toBe(3);
    expect(parser.parse("xy").index).toBe(2);
    expect(parser.parse("xxyxzax").index).toBe(5);
  });
});

describe("isNot", () => {
  test("match any character not in the given set", () => {
    const parser = isNot("abc");
    expect(parser.parse("x").result).toBe("x");
    expect(parser.parse("y").result).toBe("y");
    expect(parser.parse("b").result).toBeUndefined();
    expect(parser.parse("a").result).toBeUndefined();
  });

  test("match the longest sequence of any character not in the given set", () => {
    const parser = isNot("abc");
    expect(parser.parse("xyz").result).toBe("xyz");
    expect(parser.parse("xy").result).toBe("xy");
    expect(parser.parse("xxyxzax").result).toBe("xxyxz");
    expect(parser.parse("Hello, world!").result).toBe("Hello, world!");
  });
});

describe("oneOf", () => {
  test("match any character in the given set", () => {
    const parser = oneOf("xyz");
    expect(parser.parse("x").result).toBe("x");
    expect(parser.parse("y").result).toBe("y");
    expect(parser.parse("1").result).toBeUndefined();
  });
});

describe("noneOf", () => {
  test("match any character not in the given set", () => {
    const parser = noneOf("xyz");
    expect(parser.parse("a").result).toBe("a");
    expect(parser.parse("b").result).toBe("b");
    expect(parser.parse("x").result).toBeUndefined();
  });
});

describe("take", () => {
  test("take n characters from the input", () => {
    const parser = take(3);

    expect(parser.parse("123").result).toBe("123");
    expect(parser.parse("123456").result).toBe("123");
    expect(parser.parse("12").result).toBeUndefined();
    expect(parser.parse(" 5d2").result).toBe(" 5d");
  });
});

describe("takeWhile", () => {
  test("take characters while the predicate is true", () => {
    const parser = takeWhile((char) => char !== " ");
    expect(parser.parse("hello world").result).toBe("hello");
    expect(parser.parse("123").result).toBe("123");
    expect(parser.parse(" 123").result).toBe("");
  });

  test("consume the entire input if the predicate is always true", () => {
    const parser = takeWhile(() => true);

    expect(parser.parse("hello world").result).toBe("hello world");
    expect(parser.parse("123").result).toBe("123");
    expect(parser.parse("").result).toBe("");
  });
});

describe("takeWhile1", () => {
  test("error if the predicate is false for the first character", () => {
    const parser = takeWhile1((char) => char === " ");
    expect(parser.parse("hello world").isError).toBeTrue();
    expect(parser.parse("123").isError).toBeTrue();
    expect(parser.parse("").isError).toBeTrue();
  });
});

describe("takeUntil", () => {
  test("take characters until the predicate is true", () => {
    const parser = takeUntil((char) => char === " ");
    expect(parser.parse("hello world").result).toBe("hello");
    expect(parser.parse("123").result).toBe("123");
    expect(parser.parse(" 123").result).toBe("");
  });

  test("consume the entire input if the predicate is always false", () => {
    const parser = takeUntil(() => false);
    expect(parser.parse("hello world").result).toBe("hello world");
    expect(parser.parse("123").result).toBe("123");
    expect(parser.parse("").result).toBe("");
  });
});

describe("alpha", () => {
  const parser = alpha;
  test("match alphabet characters", () => {
    expect(parser.parse("abc").result).toBe("a");
    expect(parser.parse("A").result).toBe("A");
    expect(parser.parse("z").result).toBe("z");
    expect(parser.parse("g").result).toBe("g");
    expect(parser.parse("Z").result).toBe("Z");

    expect(parser.parse("|x&!").result).toBeUndefined();
  });

  test("increment index", () => {
    expect(parser.parse("x234").index).toBe(1);
  });

  test("handle empty input", () => {
    expect(parser.parse("").isError).toBeTrue();
  });
});

describe("digit", () => {
  const parser = digit;

  test("match digits", () => {
    expect(parser.parse("12").result).toBe("1");
    expect(parser.parse("0").result).toBe("0");
    expect(parser.parse("9").result).toBe("9");
    expect(parser.parse(" 9").result).toBeUndefined();
    expect(parser.parse("X").result).toBeUndefined();
  });
});

describe("rest", () => {
  test("return the rest of the input", () => {
    // TODO:
  });
});
