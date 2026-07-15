"use client";

/* Lightweight contentEditable editor with a formatting toolbar (bold /
   italic / underline / bulleted / numbered). Stores HTML. Pass a `key` so
   it re-initializes when the edited record changes (see ListView).

   Uses document.execCommand — deprecated but still supported by every
   evergreen browser for these basic commands. Flagged here for a future
   swap to a maintained rich-text library if formatting needs grow. */

import { useEffect, useRef, useState } from "react";

type RichTextProps = {
  value: string;
  onChange?: (html: string) => void;
  placeholder?: string;
};

type FmtState = { bold?: boolean; italic?: boolean; underline?: boolean; ul?: boolean; ol?: boolean };

export function RichText({ value, onChange, placeholder }: RichTextProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [fmt, setFmt] = useState<FmtState>({});
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (ref.current) ref.current.innerHTML = value || "";
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const emit = () => onChange?.(ref.current?.innerHTML ?? "");
  const refresh = () => {
    setFmt({
      bold: document.queryCommandState("bold"),
      italic: document.queryCommandState("italic"),
      underline: document.queryCommandState("underline"),
      ul: document.queryCommandState("insertUnorderedList"),
      ol: document.queryCommandState("insertOrderedList"),
    });
  };
  const cmd = (c: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    ref.current?.focus();
    document.execCommand(c, false, undefined);
    emit();
    refresh();
  };

  function Btn({ c, on, children, style }: { c: string; on?: boolean; children: React.ReactNode; style?: React.CSSProperties }) {
    return (
      <button type="button" className={"rte-btn" + (on ? " on" : "")} onMouseDown={cmd(c)} style={style} tabIndex={-1}>
        {children}
      </button>
    );
  }

  return (
    <div className={"rte" + (focused ? " focused" : "")}>
      <div className="rte-toolbar">
        <Btn c="bold" on={fmt.bold} style={{ fontWeight: 800 }}>B</Btn>
        <Btn c="italic" on={fmt.italic} style={{ fontStyle: "italic" }}>I</Btn>
        <Btn c="underline" on={fmt.underline} style={{ textDecoration: "underline" }}>U</Btn>
        <span className="rte-sep" />
        <Btn c="insertUnorderedList" on={fmt.ul} style={{ fontSize: 16 }}>•</Btn>
        <Btn c="insertOrderedList" on={fmt.ol} style={{ fontSize: 12 }}>1.</Btn>
      </div>
      <div
        ref={ref}
        className="rte-area"
        contentEditable
        suppressContentEditableWarning
        data-placeholder={placeholder || ""}
        onInput={emit}
        onFocus={() => setFocused(true)}
        onBlur={() => { setFocused(false); emit(); }}
        onKeyUp={refresh}
        onMouseUp={refresh}
      />
    </div>
  );
}
