"use client";

/* Budget view backed by a Google Sheet. The user pastes a Sheets link and a tab
   name (both persisted via cloud state in DashApp); on Load we pull that tab
   read-only with the shared Google token and render it as a table. Layout-
   agnostic: row 1 is treated as headers, and the first mostly-numeric column is
   summed for a footer total. Nothing about the sheet is written back. */

import { useCallback, useEffect, useState } from "react";
import {
  fetchGoogleSheet,
  parseSpreadsheetId,
  firstNumericColumn,
  parseAmount,
  type SheetTable,
} from "../_lib/googleSheets";

type Status = "idle" | "loading" | "loaded" | "error";

export function BudgetView({
  token,
  onConnectGoogle,
  sheetUrl,
  setSheetUrl,
  tabName,
  setTabName,
}: {
  token: string | null;
  onConnectGoogle: () => void;
  sheetUrl: string;
  setSheetUrl: (v: string) => void;
  tabName: string;
  setTabName: (v: string) => void;
}) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [table, setTable] = useState<SheetTable | null>(null);

  const spreadsheetId = parseSpreadsheetId(sheetUrl);

  const load = useCallback(async () => {
    if (!token) { onConnectGoogle(); return; }
    const id = parseSpreadsheetId(sheetUrl);
    if (!id) { setStatus("error"); setError("That doesn't look like a Google Sheets link."); return; }
    if (!tabName.trim()) { setStatus("error"); setError("Enter the tab name to load."); return; }
    setStatus("loading"); setError("");
    try {
      setTable(await fetchGoogleSheet(token, id, tabName.trim()));
      setStatus("loaded");
    } catch (e) {
      setStatus("error");
      setError(e instanceof Error ? e.message : "Failed to load the sheet.");
    }
  }, [token, sheetUrl, tabName, onConnectGoogle]);

  // Auto-load once when a token, a valid link, and a tab are all present and we
  // haven't loaded yet (e.g. returning to the view after connecting).
  useEffect(() => {
    if (token && spreadsheetId && tabName.trim() && status === "idle") void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, spreadsheetId, tabName]);

  const numCol = table ? firstNumericColumn(table) : -1;
  const total =
    table && numCol >= 0
      ? table.rows.reduce((sum, r) => {
          const n = parseAmount(r[numCol] ?? "");
          return Number.isNaN(n) ? sum : sum + n;
        }, 0)
      : null;

  return (
    <>
      <div className="view-head">
        <span className="eyebrow"><span className="slash">/</span>Money</span>
        <h1 className="view-title">Budget</h1>
      </div>

      <div className="budget-source">
        <input
          className="budget-input"
          type="text"
          placeholder="Paste Google Sheets link"
          value={sheetUrl}
          onChange={(e) => setSheetUrl(e.target.value)}
          aria-label="Google Sheets link"
        />
        <input
          className="budget-input budget-tab"
          type="text"
          placeholder="Tab name"
          value={tabName}
          onChange={(e) => setTabName(e.target.value)}
          aria-label="Tab name"
        />
        {status === "loading" ? (
          <button className="btn btn-ghost btn-sm" disabled type="button">Loading…</button>
        ) : !token ? (
          <button className="btn btn-red btn-sm" onClick={onConnectGoogle} type="button">Connect Google</button>
        ) : (
          <button className="btn btn-red btn-sm" onClick={() => void load()} type="button">
            {status === "loaded" ? "Refresh" : "Load"}
          </button>
        )}
      </div>

      {status === "error" && <div className="budget-banner error">{error}</div>}

      {status === "loaded" && table && table.headers.length === 0 && (
        <div className="list-empty">That tab is empty.</div>
      )}

      {status === "loaded" && table && table.headers.length > 0 && (
        <div className="budget-table-wrap">
          <table className="budget-table">
            <thead>
              <tr>{table.headers.map((h, i) => <th key={i}>{h || `Column ${i + 1}`}</th>)}</tr>
            </thead>
            <tbody>
              {table.rows.map((row, ri) => (
                <tr key={ri}>
                  {row.map((cell, ci) => (
                    <td key={ci} className={ci === numCol ? "num" : undefined}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
            {total != null && (
              <tfoot>
                <tr>
                  {table.headers.map((_, i) =>
                    i === numCol
                      ? <td key={i} className="num total">{total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      : <td key={i}>{i === 0 ? "Total" : ""}</td>,
                  )}
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}

      {status === "idle" && !spreadsheetId && (
        <div className="placeholder-card">
          <p className="placeholder-blurb">Paste a Google Sheets link and the tab name above, then Load. The tab is read directly from your sheet each time and never stored.</p>
        </div>
      )}
    </>
  );
}
