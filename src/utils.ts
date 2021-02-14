import { MarkdownString } from "vscode";

export function highlightCSS(css?:string): MarkdownString | undefined {
  if (css) {
    return new MarkdownString(`\`\`\`css\n${css}\n\`\`\``);
  }
}

export function flatColors(colors: {[key:string]:string|{[key:string]:string}}) {
  const flatten: {[key:string]:string} = {};
  for (const [key, value] of Object.entries(colors)) {
    if (typeof value === 'string') {
      flatten[key] = value;
    } else {
      for (const [skey, svalue] of Object.entries(value)) {
        flatten[`${key}-${skey}`] = svalue;
      };
    }
  }
  return flatten;
};

export function isColor(className:string, colors: {[key:string]:string}): number[] | undefined {
  for (const [key, value] of Object.entries(colors)) {
    if (className.endsWith('-' + key)) {
      return hex2RGB(value);
    }
  }
}

export function hex2RGB(hex: string): number[] | undefined {
  const RGB_HEX = /^#?(?:([\da-f]{3})[\da-f]?|([\da-f]{6})(?:[\da-f]{2})?)$/i;
  const [, short, long] = String(hex).match(RGB_HEX) || [];

  if (long) {
    const value = Number.parseInt(long, 16);
    return [value >> 16, (value >> 8) & 0xff, value & 0xff];
  } else if (short) {
    return Array.from(short, (s) => Number.parseInt(s, 16)).map(
      (n) => (n << 4) | n
    );
  }
}