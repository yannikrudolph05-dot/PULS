// ============================================================================
//  src/components/Attachments.jsx  –  Anhänge (PDF/Bilder) am Ticket.
//  Im Prototyp ohne Backend werden Dateien als Data-URL gespeichert (im
//  Browser/localStorage). Deshalb ein Größenlimit pro Datei. Im Echtsystem
//  wandern Anhänge später nach SharePoint/Outlook.
// ============================================================================
import React, { useState } from "react";
import { C, MUTED, BORDER } from "../theme.js";

const MAX_FILE = 1.5 * 1024 * 1024; // 1,5 MB je Datei

// Eine Datei -> { name, type, size, dataUrl }  (oder null, wenn zu groß).
function readFile(file) {
  return new Promise((resolve) => {
    if (file.size > MAX_FILE) return resolve({ tooBig: file.name });
    const reader = new FileReader();
    reader.onload = () => resolve({ name: file.name, type: file.type, size: file.size, dataUrl: reader.result });
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

const isImg = (a) => (a.type || "").startsWith("image/");
const kb = (n) => (n > 1024 * 1024 ? (n / 1024 / 1024).toFixed(1) + " MB" : Math.max(1, Math.round(n / 1024)) + " KB");

// Liste der Anhänge (Bild-Thumbnails / Datei-Chips). onRemove optional.
export function AttachmentView({ items = [], onRemove }) {
  if (!items.length) return null;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
      {items.map((a, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            border: `1px solid ${BORDER}`,
            borderRadius: 8,
            padding: "5px 8px",
            background: "#F7FBFD",
            maxWidth: 240,
          }}
        >
          {isImg(a) ? (
            <a href={a.dataUrl} target="_blank" rel="noreferrer">
              <img src={a.dataUrl} alt={a.name} style={{ width: 34, height: 34, objectFit: "cover", borderRadius: 4, display: "block" }} />
            </a>
          ) : (
            <span style={{ fontSize: 18 }}>📄</span>
          )}
          <a
            href={a.dataUrl}
            target="_blank"
            rel="noreferrer"
            download={a.name}
            style={{ fontSize: 12, color: C.navy, textDecoration: "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
            title={a.name}
          >
            {a.name}
            <span style={{ color: MUTED }}> · {kb(a.size)}</span>
          </a>
          {onRemove && (
            <button
              onClick={() => onRemove(i)}
              title="Entfernen"
              style={{ border: "none", background: "transparent", color: MUTED, cursor: "pointer", fontSize: 15, lineHeight: 1 }}
            >
              ×
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

// Auswahl + Liste mit Entfernen-Möglichkeit.
export function AttachmentPicker({ value = [], onChange, compact }) {
  const [warn, setWarn] = useState("");

  const onPick = async (e) => {
    const picked = [...e.target.files];
    e.target.value = "";
    const results = await Promise.all(picked.map(readFile));
    const ok = results.filter((r) => r && !r.tooBig);
    const big = results.filter((r) => r && r.tooBig).map((r) => r.tooBig);
    if (big.length) setWarn(`Zu groß (max. 1,5 MB), nicht hinzugefügt: ${big.join(", ")}`);
    else setWarn("");
    if (ok.length) onChange([...(value || []), ...ok]);
  };

  const remove = (i) => onChange(value.filter((_, idx) => idx !== i));

  return (
    <div>
      <label
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          cursor: "pointer",
          border: `1px solid ${BORDER}`,
          background: C.white,
          borderRadius: 6,
          padding: compact ? "6px 12px" : "8px 14px",
          fontSize: 13,
          color: C.navy,
          fontWeight: 700,
        }}
      >
        📎 Anhang hinzufügen
        <input type="file" multiple accept="image/*,application/pdf" onChange={onPick} style={{ display: "none" }} />
      </label>
      {warn && <div style={{ fontSize: 11.5, color: "#B8860B", marginTop: 6 }}>{warn}</div>}
      <AttachmentView items={value} onRemove={remove} />
    </div>
  );
}
