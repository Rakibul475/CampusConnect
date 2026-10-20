import { describe, expect, it } from "vitest";
import { toCsv } from "./csv";

describe("toCsv", () => {
  it("joins rows with CRLF and quotes cells that need it", () => {
    expect(toCsv(["a", "b"], [["plain", 'say "hi", ok'], ["two\nlines", null]])).toBe(
      'a,b\r\nplain,"say ""hi"", ok"\r\n"two\nlines",\r\n'
    );
  });

  it("neutralises cells a spreadsheet would treat as formulas", () => {
    expect(toCsv(["x"], [["=SUM(A1)"], ["-5"], ["@cmd"], ["fine"]])).toBe("x\r\n'=SUM(A1)\r\n'-5\r\n'@cmd\r\nfine\r\n");
  });
});
