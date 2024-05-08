export function isAlphabetic(str: string): boolean {
  if (str.length != 1) return false;

  const charCode = str.charCodeAt(0);

  if (
    !(charCode >= 65 && charCode <= 90) &&
    !(charCode >= 97 && charCode <= 122)
  ) {
    return false;
  }

  return true;
}

export function isDigit(str: string): boolean {
  if (str.length != 1) return false;

  const charCode = str.charCodeAt(0);

  if (!(charCode >= 48 && charCode <= 57)) {
    return false;
  }

  return true;
}

export function isAlphaNumeric(str: string): boolean {
  return isAlphabetic(str) || isDigit(str);
}

export function isSpace(str: string): boolean {
  return str == " " || str == "\t";
}

export function isNewline(str: string): boolean {
  return str == "\n";
}

export function isMultispace(str: string): boolean {
  return isSpace(str) || isNewline(str) || str == "\r";
}

export function isScientificNotation(str: string): boolean {
  return isDigit(str) || str == "." || str == "-" || str.toLowerCase() == "e";
}
