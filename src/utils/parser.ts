export class HTMLParser {
  html?: string;
  constructor(html?: string) {
    this.html = html;
  }
  parseClasses(): { start: number; end: number; result: string }[] {
    // Match all class properties
    if (!this.html) return [];
    const classRegex = /(class|className|dark|light|active|after|before|checked|disabled|focus|hover|tw)\s*=\s*["']([^{}]*)["|']/;
    const quoteRegex = /["']/;
    const classNames = [];
    let _indexStart = 0;
    let _htmlLeft = this.html;
    let propStart = _htmlLeft.search(classRegex);
    while (propStart !== -1) {
      const afterMatch = _htmlLeft.substring(propStart);
      const relativeStart = afterMatch.search(quoteRegex);
      const relativeEnd = afterMatch
        .substring(relativeStart + 1)
        .search(quoteRegex);
      const absoluteStart = propStart + relativeStart + 1;
      const absoluteEnd = absoluteStart + relativeEnd;
      classNames.push({
        start: _indexStart + absoluteStart,
        end: _indexStart + absoluteEnd,
        result: _htmlLeft.substring(absoluteStart, absoluteEnd),
      });
      _htmlLeft = _htmlLeft.substring(absoluteEnd + 2);
      _indexStart += absoluteEnd + 2;
      propStart = _htmlLeft.search(classRegex);
    }
    return classNames;
  }
}
