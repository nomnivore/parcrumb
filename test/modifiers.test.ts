import { expect, test, describe } from "bun:test";
import { recognize } from "../src/parsers/modifiers";
import { float } from "../src/parsers/extras";

describe("recognize", () => {
  test("should return the consumed input of the parser", () => {
    const parser = recognize(float);

    expect(parser.parse("1.23").result).toBeTypeOf("string");
    expect(parser.parse("1.23a").result).toBe("1.23");
  });
});
