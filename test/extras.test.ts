import { describe, expect, test } from "bun:test";
import { pair } from "../src/parsers/combinators";
import { tag } from "../src/parsers/primitives";
import { eof } from "../src/parsers/extras";

describe("eof", () => {
  test("match the end of the input", () => {
    const parser = pair(tag("abcd"), eof);

    expect(parser.parse("abcd").result).toEqual(["abcd", ""]);
    expect(eof.parse("").result).toEqual("");

    expect(eof.parse("abcd").isError).toBeTrue();
  });
});
