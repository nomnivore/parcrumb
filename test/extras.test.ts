import { describe, expect, test } from "bun:test";
import { pair } from "../parsers/combinators";
import { tag } from "../parsers/primitives";
import { eof } from "../parsers/extras";

describe("eof", () => {
  test("match the end of the input", () => {
    const parser = pair(tag("abcd"), eof);

    expect(parser.run("abcd").result).toEqual(["abcd", ""]);
    expect(eof.run("").result).toEqual("");

    expect(eof.run("abcd").isError).toBeTrue();
  });
});
