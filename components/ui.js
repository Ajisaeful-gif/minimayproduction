"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export function PageHeader({ eyebrow, title, description, chip }) {
  return (
    <section className="page-header">
      <div>
        <p className="section-title">{eyebrow}</p>
        <h1 className="page-title">{title}</h1>
        <p className="page-description">{description}</p>
      </div>
      {chip ? <div className="page-chip">{chip}</div> : null}
    </section>
  );
}

export function InfoBanner({ title = "Catatan", children }) {
  return (
    <section className="info-banner">
      <div className="banner-icon">i</div>
      <div>
        <p className="banner-copy">{title}</p>
        <h2 className="banner-title">{children}</h2>
      </div>
    </section>
  );
}

export function FormCard({ title, description, action, children }) {
  return (
    <section className="form-card">
      {title ? (
        <div className="card-head">
          <div>
            <p className="section-title">{title}</p>
            {description ? <p className="card-copy">{description}</p> : null}
          </div>
          {action}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function Field({ label, badge, required = false, full = false, children }) {
  return (
    <div className={`field ${full ? "full" : ""}`}>
      <div className="field-head">
        <label className={`field-label ${required ? "required" : ""}`}>{label}</label>
        {badge ? <Badge variant={badge.variant}>{badge.label}</Badge> : null}
      </div>
      {children}
    </div>
  );
}

export function Badge({ variant = "neutral", children, label }) {
  return <span className={`pill ${variant}`}>{children ?? label}</span>;
}

export function TextInput(props) {
  return <input className="text-input" {...props} />;
}

export function SelectInput({ children, ...props }) {
  return (
    <select className="select-input" {...props}>
      {children}
    </select>
  );
}

export function SearchableCombobox({
  items,
  value,
  searchValue,
  onSearchChange,
  onSelect,
  placeholder = "Cari data...",
  emptyMessage = "Data tidak ditemukan."
}) {
  const [open, setOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const inputRef = useRef(null);

  const normalizedItems = useMemo(
    () =>
      items.map((item) =>
        typeof item === "string"
          ? { value: item, label: item }
          : { value: item.value, label: item.label ?? item.value }
      ),
    [items]
  );

  const filteredItems = useMemo(() => {
    const keyword = String(searchValue ?? "").trim().toLowerCase();

    if (!keyword) {
      return normalizedItems;
    }

    return normalizedItems.filter((item) =>
      item.label.toLowerCase().includes(keyword)
    );
  }, [normalizedItems, searchValue]);

  useEffect(() => {
    setHighlightIndex((current) => {
      if (!filteredItems.length) {
        return 0;
      }

      return Math.min(current, filteredItems.length - 1);
    });
  }, [filteredItems]);

  function handleSelect(item) {
    onSelect?.(item.value);
    onSearchChange?.(item.label);
    setOpen(false);
    inputRef.current?.blur();
  }

  return (
    <div className={`searchable-combobox ${open ? "is-open" : ""}`}>
      <input
        autoComplete="off"
        className="text-input searchable-combobox-input"
        onChange={(event) => {
          onSearchChange?.(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(event) => {
          if (!open && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
            setOpen(true);
            return;
          }

          if (event.key === "ArrowDown") {
            event.preventDefault();
            setHighlightIndex((current) =>
              Math.min(current + 1, Math.max(filteredItems.length - 1, 0))
            );
          }

          if (event.key === "ArrowUp") {
            event.preventDefault();
            setHighlightIndex((current) => Math.max(current - 1, 0));
          }

          if (event.key === "Enter") {
            if (open && filteredItems[highlightIndex]) {
              event.preventDefault();
              handleSelect(filteredItems[highlightIndex]);
            }
          }

          if (event.key === "Escape") {
            setOpen(false);
          }
        }}
        onBlur={() => {
          window.setTimeout(() => setOpen(false), 120);
        }}
        placeholder={placeholder}
        ref={inputRef}
        type="text"
        value={searchValue}
      />

      {open ? (
        <div className="searchable-combobox-panel">
          {filteredItems.length ? (
            filteredItems.map((item, index) => {
              const isSelected = value === item.value;
              const isHighlighted = highlightIndex === index;

              return (
                <button
                  className={`searchable-combobox-option ${
                    isSelected ? "is-selected" : ""
                  } ${isHighlighted ? "is-highlighted" : ""}`.trim()}
                  key={item.value}
                  onMouseDown={(event) => {
                    event.preventDefault();
                    handleSelect(item);
                  }}
                  type="button"
                >
                  <span>{item.label}</span>
                  {isSelected ? <span className="searchable-combobox-check">Dipilih</span> : null}
                </button>
              );
            })
          ) : (
            <div className="searchable-combobox-empty">{emptyMessage}</div>
          )}
        </div>
      ) : null}
    </div>
  );
}

export function ScanInput(props) {
  return (
    <div className="scan-row">
      <TextInput {...props} />
      <div className="scan-trigger">▣</div>
    </div>
  );
}

export function CodeDisplay({ meta, value, action }) {
  return (
    <div className="code-display">
      <p className="code-meta">{meta}</p>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
          flexWrap: "wrap"
        }}
      >
        <p className="code-value">{value}</p>
        {action}
      </div>
    </div>
  );
}

export function SummaryCard({ label, value, tone = "" }) {
  return (
    <div className="summary-card">
      <p className="summary-label">{label}</p>
      <p className={`summary-value ${tone}`.trim()}>{value}</p>
    </div>
  );
}

export function StatusStrip({ children }) {
  return <section className="status-strip">{children}</section>;
}

export function ActionRow({ children }) {
  return <div className="action-row">{children}</div>;
}

export function Button({ children, variant = "secondary", small = false, ...props }) {
  return (
    <button
      className={`button ${variant}${small ? " small" : ""}`}
      type="button"
      {...props}
    >
      {children}
    </button>
  );
}

export function Tag({ children }) {
  return <span className="tag">{children}</span>;
}

export function DataTable({ columns, rows, emptyMessage = "Belum ada data." }) {
  return (
    <section className="data-table-wrap">
      <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((column) => (
                <th
                  className={column.align === "center" ? "center" : ""}
                  key={column.key}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length ? (
              rows.map((row, rowIndex) => (
                <tr key={row.key ?? rowIndex}>
                  {columns.map((column) => (
                    <td
                      className={column.align === "center" ? "center" : ""}
                      key={column.key}
                    >
                      {row[column.key]}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td className="empty-state" colSpan={columns.length}>
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function ModalConfirm({
  open,
  title,
  description,
  children,
  onClose,
  onConfirm
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="modal-backdrop">
      <div className="modal-panel">
        <div className="card-head">
          <div>
            <p className="section-title">Konfirmasi</p>
            <h2 className="card-title">{title}</h2>
            {description ? <p className="card-copy">{description}</p> : null}
          </div>
        </div>
        {children}
        <div className="modal-actions">
          <Button onClick={onClose}>Batal</Button>
          <Button onClick={onConfirm} variant="primary">
            Konfirmasi & Simpan
          </Button>
        </div>
      </div>
    </div>
  );
}
