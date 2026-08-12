import { read, utils, write } from "xlsx";

import { BULK_COLUMNS, BULK_COLUMN_HINTS, SAMPLE_BULK_ROW, bulkRowSchema } from "@/domains/students/bulk.schema";
import type { BulkRow } from "@/domains/students/bulk.schema";

export type ParsedRow = {
  index: number;
  raw: Record<string, string>;
  value: BulkRow | null;
  errors: string[];
};

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/** Template with a header row, a filled example row and a hint row. */
export function downloadTemplate(format: "csv" | "xlsx") {
  const rows = [
    BULK_COLUMNS.map((c) => c),
    BULK_COLUMNS.map((c) => SAMPLE_BULK_ROW[c]),
    BULK_COLUMNS.map((c) => BULK_COLUMN_HINTS[c]),
  ];
  const sheet = utils.aoa_to_sheet(rows);

  if (format === "csv") {
    download(new Blob([utils.sheet_to_csv(sheet)], { type: "text/csv" }), "students-template.csv");
    return;
  }
  const book = utils.book_new();
  utils.book_append_sheet(book, sheet, "Students");
  const buffer = write(book, { bookType: "xlsx", type: "array" }) as ArrayBuffer;
  download(
    new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    "students-template.xlsx",
  );
}

function normaliseCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).trim();
}

/** Reads a CSV/XLSX file and validates every cell against the row schema. */
export async function parseUpload(file: File): Promise<ParsedRow[]> {
  const buffer = await file.arrayBuffer();
  const book = read(buffer, { type: "array", cellDates: true });
  const first = book.SheetNames[0];
  if (!first) throw new Error("This file has no sheets");
  const sheet = book.Sheets[first];
  if (!sheet) throw new Error("This file has no sheets");

  const records = utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });

  return records
    .map((record, i) => {
      const raw: Record<string, string> = {};
      for (const key of Object.keys(record)) {
        raw[key.trim().toLowerCase().replace(/\s+/g, "_")] = normaliseCell(record[key]);
      }
      const candidate = Object.fromEntries(
        BULK_COLUMNS.map((c) => [c, (raw[c] ?? "").toUpperCase && c === "lead_source"
          ? (raw[c] ?? "").toUpperCase()
          : (raw[c] ?? "")]),
      );
      const parsed = bulkRowSchema.safeParse(candidate);
      return {
        index: i + 2,
        raw: candidate as Record<string, string>,
        value: parsed.success ? parsed.data : null,
        errors: parsed.success
          ? []
          : parsed.error.issues.map((issue) => `${issue.path.join(".") || "row"}: ${issue.message}`),
      };
    })
    .filter((row) => Object.values(row.raw).some((v) => v !== ""))
    .filter((row) => row.raw["full_name"] !== BULK_COLUMN_HINTS.full_name);
}
