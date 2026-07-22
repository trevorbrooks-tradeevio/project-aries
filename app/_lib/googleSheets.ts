/* Read-only Google Sheets fetch. Uses the same short-lived Google OAuth access
   token as the Calendar integration (it now carries spreadsheets.readonly too),
   pulls one tab's cell values via the Sheets API v4, and returns them as a
   header row plus data rows. Nothing is persisted; the parsed result lives in
   memory for the session. */

export type SheetTable = {
  /** Row 1 of the tab, treated as column headers. */
  headers: string[];
  /** All rows below the header, each padded to headers.length. */
  rows: string[][];
};

/**
 * Pull the spreadsheet ID out of a pasted Google Sheets URL, or accept a bare
 * ID. Returns null if nothing that looks like an ID is found.
 * e.g. https://docs.google.com/spreadsheets/d/<ID>/edit#gid=0
 */
export function parseSpreadsheetId(input: string): string | null {
  const s = input.trim();
  if (!s) return null;
  const m = s.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (m && m[1]) return m[1];
  // A bare ID pasted on its own (no slashes, reasonable length).
  if (/^[a-zA-Z0-9-_]{20,}$/.test(s)) return s;
  return null;
}

/**
 * Fetch a single tab's values.
 * @param token Google OAuth access token with spreadsheets.readonly.
 * @param spreadsheetId The spreadsheet's ID.
 * @param tabName The tab (sheet) name, e.g. "July 2026".
 */
export async function fetchGoogleSheet(
  token: string,
  spreadsheetId: string,
  tabName: string,
): Promise<SheetTable> {
  // The A1 range is just the tab name (quoted), which returns its whole grid.
  const range = encodeURIComponent(`'${tabName}'`);
  const url =
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}` +
    `?majorDimension=ROWS&valueRenderOption=UNFORMATTED_VALUE`;

  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) {
    let detail = "";
    try {
      const j = (await res.json()) as { error?: { message?: string } };
      detail = j.error?.message || "";
    } catch { /* non-JSON body */ }
    if (res.status === 401) throw new Error("Google session expired — reconnect to refresh.");
    if (res.status === 403) throw new Error("No access to this sheet, or the Sheets scope isn't granted — reconnect Google.");
    if (res.status === 404) throw new Error(`Couldn't find a tab named "${tabName}" (or the sheet doesn't exist).`);
    throw new Error(`Sheets request failed (${res.status})${detail ? `: ${detail}` : ""}`);
  }

  const data = (await res.json()) as { values?: unknown[][] };
  const raw = data.values ?? [];
  const headerRow = raw[0];
  if (!headerRow) return { headers: [], rows: [] };

  const toStr = (v: unknown) => (v == null ? "" : String(v));
  const headers = headerRow.map(toStr);
  const width = headers.length;
  const rows = raw.slice(1).map((r) => {
    const cells = r.map(toStr);
    // Pad short rows so every row lines up with the header count.
    while (cells.length < width) cells.push("");
    return cells;
  });
  return { headers, rows };
}

/** Best-effort: index of the first column whose data cells are mostly numeric. */
export function firstNumericColumn(table: SheetTable): number {
  const { headers, rows } = table;
  for (let c = 0; c < headers.length; c++) {
    let num = 0, seen = 0;
    for (const row of rows) {
      const cell = (row[c] ?? "").replace(/[$,\s]/g, "");
      if (cell === "") continue;
      seen++;
      if (!Number.isNaN(Number(cell))) num++;
    }
    if (seen > 0 && num / seen >= 0.6) return c;
  }
  return -1;
}

/** Parse a cell like "$1,234.56" into a number, or NaN. */
export function parseAmount(cell: string): number {
  return Number((cell ?? "").replace(/[$,\s]/g, ""));
}
