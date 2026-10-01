/**
 * Minimal PDF writer.
 *
 * Hand-rolled rather than pulled from npm for one reason: the invoice has to be
 * a *real* `.pdf` binary that downloads as a file. An HTML "invoice" gets
 * previewed in a new tab by Safari, which is exactly the behaviour we are
 * avoiding, and it is not a PDF no matter what it is named.
 *
 * Uses the base-14 fonts (Helvetica / Helvetica-Bold), so nothing has to be
 * embedded and the output stays a few kilobytes. Base-14 has no glyph for the
 * rupee sign, so `pdfText` maps it to "Rs." and any other unmappable character
 * degrades to "?" rather than emitting bytes the reader cannot interpret.
 *
 * Text is WinAnsi/Latin-1 encoded, which keeps every byte under 0x100 and makes
 * a JS string's `.length` equal to its byte length — the xref offsets below
 * depend on that.
 */

const PAGE = { width: 595.28, height: 841.89 }; // A4 in points
const MARGIN = 42;
const CONTENT_WIDTH = PAGE.width - MARGIN * 2;

/** WinAnsi code points for the handful of non-ASCII glyphs we actually use. */
const WIN_ANSI = {
  "€": 128, "…": 133, "•": 149, "–": 150, "—": 151,
  "‘": 145, "’": 146, "“": 147, "”": 148, "™": 153, "©": 169, "®": 174,
  "°": 176, "±": 177, "·": 183,
};

/** Helvetica advance widths (1/1000 em) for codes 32-126. */
const HELVETICA_WIDTHS = [
  278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278,
  556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 278, 278, 584, 584, 584, 556,
  1015, 667, 667, 722, 722, 667, 611, 778, 722, 278, 500, 667, 556, 833, 722, 778,
  667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 278, 278, 278, 469, 556,
  333, 556, 556, 500, 556, 556, 278, 556, 556, 222, 222, 500, 222, 833, 556, 556,
  556, 556, 333, 500, 278, 556, 500, 722, 500, 500, 500, 334, 260, 334, 584,
];

/** Helvetica-Bold advance widths (1/1000 em) for codes 32-126. */
const BOLD_WIDTHS = [
  278, 333, 474, 556, 556, 889, 722, 238, 333, 333, 389, 584, 278, 333, 278, 278,
  556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 333, 333, 584, 584, 584, 611,
  975, 722, 722, 722, 722, 667, 611, 778, 722, 278, 556, 722, 611, 833, 722, 778,
  667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 333, 278, 333, 584, 556,
  333, 556, 611, 556, 611, 556, 333, 611, 611, 278, 278, 556, 278, 889, 611, 611,
  611, 611, 389, 556, 333, 611, 556, 778, 556, 556, 500, 389, 280, 389, 584,
];

const charWidth = (code, bold) => {
  const widths = bold ? BOLD_WIDTHS : HELVETICA_WIDTHS;
  if (code >= 32 && code <= 126) return widths[code - 32];
  if (WIN_ANSI[code]) return 600;
  return 500;
};

/** Map a JS string to WinAnsi codes, degrading anything unencodable. */
const toWinAnsi = (text) => {
  let out = "";
  for (const char of String(text ?? "")) {
    const code = char.codePointAt(0);
    if (code === 0x20a8 || code === 0x20b9) {
      // Rupee sign / Indian rupee: not in the base-14 glyph set. Callers format
  // money with `formatPricePdf`, so this is only a last-resort safety net.
      out += "Rs.";
    } else if (code >= 32 && code <= 126) {
      out += char;
    } else if (WIN_ANSI[char]) {
      out += String.fromCharCode(WIN_ANSI[char]);
    } else if (code === 10 || code === 13) {
      out += " ";
    } else {
      out += "?";
    }
  }
  return out;
};

/** Escape the three characters that terminate a PDF literal string. */
const escapeText = (text) => toWinAnsi(text).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");

/** Rendered width in points, for wrapping and right-alignment. */
export function measureText(text, size = 10, bold = false) {
  let total = 0;
  for (const char of toWinAnsi(text)) total += charWidth(char.codePointAt(0), bold);
  return (total * size) / 1000;
}

/** Greedy word wrap. Words longer than the line are hard-split, never overflow. */
export function wrapText(text, size, maxWidth, bold = false) {
  const words = toWinAnsi(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (measureText(candidate, size, bold) <= maxWidth) {
      line = candidate;
      continue;
    }
    if (line) lines.push(line);
    if (measureText(word, size, bold) <= maxWidth) {
      line = word;
      continue;
    }
    let chunk = "";
    for (const char of word) {
      if (measureText(chunk + char, size, bold) > maxWidth) {
        lines.push(chunk);
        chunk = char;
      } else {
        chunk += char;
      }
    }
    line = chunk;
  }

  if (line) lines.push(line);
  return lines;
}

const round = (value) => Math.round(value * 100) / 100;

/**
 * A single-page-agnostic PDF document.
 *
 * Coordinates are given top-down from the top margin, because that is how the
 * invoice is laid out; the flip into PDF's bottom-left origin happens in `text`
 * and `rect` so no caller has to think about it.
 */
export class PdfDocument {
  constructor({ title = "Invoice" } = {}) {
    this.title = title;
    this.pages = [];
    this.pageFooter = null;
    /** Points at the bottom reserved for a page footer, excluded from `remaining`. */
    this.bottomInset = 0;
    this._newPage();
  }

  /**
   * Register a footer drawn on EVERY page, not just the last.
   *
   * The callback is handed a scratch document positioned at the bottom of the
   * page, so it draws with the normal `text`/`rect` calls. A two-page invoice
   * whose first page has no contact details is the page a customer is most
   * likely to have separated from the rest.
   */
  setPageFooter(draw) {
    this.pageFooter = draw;
  }

  _newPage() {
    this.ops = [];
    this.cursorY = MARGIN;
    this.pages.push(this.ops);
  }

  /** Vertical space left before the bottom margin, minus any reserved footer. */
  get remaining() {
    return PAGE.height - MARGIN - this.bottomInset - this.cursorY;
  }

  /**
   * Break to a new page, optionally running `onNewPage` (used to repeat table
   * headers). The callback is handed this document so a header helper can
   * take it as a plain argument.
   */
  breakPage(onNewPage) {
    this._newPage();
    onNewPage?.(this);
  }

  /** Require `height` points, breaking if needed. */
  ensure(height, onNewPage) {
    if (this.remaining < height) this.breakPage(onNewPage);
  }

  moveDown(points) {
    this.cursorY += points;
  }

  text(value, { x = MARGIN, size = 10, bold = false, color = [0, 0, 0], align = "left", width = CONTENT_WIDTH, y } = {}) {
    const baseline = y ?? this.cursorY + size;
    const [r, g, b] = color;
    const font = bold ? "/F2" : "/F1";
    let drawX = x;
    if (align === "right") drawX = x + width - measureText(value, size, bold);
    if (align === "center") drawX = x + (width - measureText(value, size, bold)) / 2;

    this.ops.push(
      `BT ${r} ${g} ${b} rg ${font} ${size} Tf 1 0 0 1 ${round(drawX)} ${round(PAGE.height - baseline)} Tm (${escapeText(value)}) Tj ET`,
    );
    return this;
  }

  /** Draw wrapped text, advancing the cursor. Returns the lines drawn. */
  paragraph(value, { size = 10, bold = false, color = [0, 0, 0], width = CONTENT_WIDTH, leading = 1.45, x = MARGIN, maxLines = Infinity } = {}) {
    const lines = wrapText(value, size, width, bold).slice(0, maxLines);
    const step = size * leading;
    for (const line of lines) {
      this.text(line, { x, size, bold, color, y: this.cursorY + size });
      this.cursorY += step;
    }
    return lines;
  }

  /** Filled rectangle. Used for rules and bars — thinner and more reliable than strokes. */
  rect(x, y, width, height, color = [0, 0, 0]) {
    const [r, g, b] = color;
    this.ops.push(
      `${r} ${g} ${b} rg ${round(x)} ${round(PAGE.height - y - height)} ${round(width)} ${round(height)} re f`,
    );
    return this;
  }

  /** Horizontal rule at the current cursor. */
  rule({ color = [0.88, 0.88, 0.88], weight = 0.7, width = CONTENT_WIDTH, x = MARGIN } = {}) {
    this.rect(x, this.cursorY, width, weight, color);
    this.cursorY += weight;
    return this;
  }

  /**
   * Serialise to a PDF byte string.
   *
   * Objects are numbered as they are appended and the xref is patched
   * afterwards, so the layout code above never has to know its object numbers.
   */
  toBlobString() {
    const objects = [];
    const add = (body) => {
      objects.push(body);
      return objects.length; // 1-based object number
    };

    const catalogNum = add(null); // reserved, patched below
    const pagesNum = add(null); // reserved, patched below
    const fontRegular = add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>");
    const fontBold = add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>");

    const pageNums = [];
    for (const ops of this.pages) {
      const stream = [...ops, ...(this.pageFooter ? this.pageFooter() : [])].join("\n");
      const contentsNum = add(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
      const pageNum = add(
        `<< /Type /Page /Parent ${pagesNum} 0 R /MediaBox [0 0 ${PAGE.width} ${PAGE.height}] ` +
          `/Resources << /Font << /F1 ${fontRegular} 0 R /F2 ${fontBold} 0 R >> >> ` +
          `/Contents ${contentsNum} 0 R >>`,
      );
      pageNums.push(pageNum);
    }

    objects[catalogNum - 1] = `<< /Type /Catalog /Pages ${pagesNum} 0 R >>`;
    objects[pagesNum - 1] =
      `<< /Type /Pages /Kids [${pageNums.map((num) => `${num} 0 R`).join(" ")}] /Count ${pageNums.length} >>`;

    let out = "%PDF-1.4\n%âãÏÓ\n";
    const offsets = [];
    objects.forEach((body, index) => {
      offsets.push(out.length);
      out += `${index + 1} 0 obj\n${body}\nendobj\n`;
    });

    const xrefStart = out.length;
    out += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
    for (const offset of offsets) {
      out += `${String(offset).padStart(10, "0")} 00000 n \n`;
    }
    out += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogNum} 0 R /Info << /Title (${escapeText(this.title)}) >> >>\nstartxref\n${xrefStart}\n%%EOF\n`;

    return out;
  }
}

export const PDF_PAGE = PAGE;
export const PDF_MARGIN = MARGIN;
export const PDF_CONTENT_WIDTH = CONTENT_WIDTH;
