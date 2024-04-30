import { expect, test, describe } from "bun:test";
import { digit } from "..";

describe("map", () => {
  test("transform the result of a parser", () => {
    const parser = digit.map((result) => parseInt(result));

    expect(parser.run("5").result).toBe(5);
  });
});
