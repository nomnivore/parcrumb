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

describe("take", () => {
  test("take n characters from the input", () => {
    const parser = take(3);

    expect(parser.run("123").result).toBe("123");
    expect(parser.run("123456").result).toBe("123");
    expect(parser.run("12").result).toBeUndefined();
    expect(parser.run(" 5d2").result).toBe(" 5d");
  });
});

describe("takeWhile", () => {
  test("take characters while the predicate is true", () => {
    const parser = takeWhile((char) => char !== " ");
    expect(parser.run("hello world").result).toBe("hello");
    expect(parser.run("123").result).toBe("123");
    expect(parser.run(" 123").result).toBe("");
  });

  test("consume the entire input if the predicate is always true", () => {
    const parser = takeWhile(() => true);

    expect(parser.run("hello world").result).toBe("hello world");
    expect(parser.run("123").result).toBe("123");
    expect(parser.run("").result).toBe("");
  });
});

describe("takeWhile1", () => {
  test("error if the predicate is false for the first character", () => {
    const parser = takeWhile1((char) => char === " ");
    expect(parser.run("hello world").isError).toBeTrue();
    expect(parser.run("123").isError).toBeTrue();
    expect(parser.run("").isError).toBeTrue();
  });
});

describe("takeUntil", () => {
  test("take characters until the predicate is true", () => {
    const parser = takeUntil((char) => char === " ");
    expect(parser.run("hello world").result).toBe("hello");
    expect(parser.run("123").result).toBe("123");
    expect(parser.run(" 123").result).toBe("");
  });

  test("consume the entire input if the predicate is always false", () => {
    const parser = takeUntil(() => false);
    expect(parser.run("hello world").result).toBe("hello world");
    expect(parser.run("123").result).toBe("123");
    expect(parser.run("").result).toBe("");
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

describe("rest", () => {
  test("return the rest of the input", () => {
    // TODO:
  });
});