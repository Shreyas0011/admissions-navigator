import { read, utils } from "xlsx";

import { BULK_COLUMNS, BULK_COLUMN_HINTS, SAMPLE_BULK_ROW, bulkRowSchema } from "@/domains/students/bulk.schema";
import type { BulkColumn, BulkRow } from "@/domains/students/bulk.schema";
import { leadSourceSchema } from "@/domains/students/schema";

export type ParsedRow = {
  index: number;
  raw: Record<string, string>;
  value: BulkRow | null;
  errors: string[];
};

/** Columns the admin picks from a list rather than typing free text. */
export const LEAD_SOURCES = leadSourceSchema.options as readonly string[];

const DATA_ROWS = 300;

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function templateRows() {
  return [
    BULK_COLUMNS.map((c) => c as string),
    BULK_COLUMNS.map((c) => SAMPLE_BULK_ROW[c]),
    BULK_COLUMNS.map((c) => BULK_COLUMN_HINTS[c]),
  ];
}

function csvTemplate() {
  const sheet = utils.aoa_to_sheet(templateRows());
  download(new Blob([utils.sheet_to_csv(sheet)], { type: "text/csv" }), "students-template.csv");
}

/**
 * XLSX template with real dropdowns on the columns that must match configured
 * values. The allowed values live on a hidden "Lists" sheet and are referenced
 * by range: inline `"a,b,c"` formulae are capped at 255 characters, which the
 * programme list exceeds, and Excel then silently drops the validation.
 */
async function xlsxTemplate(programmeCodes: readonly string[]) {
  const { Workbook } = await import("exceljs");
  const book = new Workbook();
  const sheet = book.addWorksheet("Students");
  for (const row of templateRows()) sheet.addRow(row);
  sheet.getRow(1).font = { bold: true };
  sheet.columns = BULK_COLUMNS.map(() => ({ width: 24 }));

  const listSheet = book.addWorksheet("Lists", { state: "veryHidden" });

  const lists: Partial<Record<BulkColumn, readonly string[]>> = {
    lead_source: LEAD_SOURCES,
    ...(programmeCodes.length > 0 ? { programme_code: programmeCodes } : {}),
  };

  let listColumn = 0;
  for (const [column, values] of Object.entries(lists) as [BulkColumn, readonly string[]][]) {
    listColumn += 1;
    const listLetter = listSheet.getColumn(listColumn).letter;
    values.forEach((value, i) => {
      listSheet.getCell(`${listLetter}${i + 1}`).value = value;
    });
    const range = `Lists!$${listLetter}$1:$${listLetter}$${values.length}`;

    const letter = sheet.getColumn(BULK_COLUMNS.indexOf(column) + 1).letter;
    for (let row = 2; row <= DATA_ROWS + 1; row += 1) {
      sheet.getCell(`${letter}${row}`).dataValidation = {
        type: "list",
        allowBlank: true,
        formulae: [range],
        showErrorMessage: true,
        errorTitle: "Pick from the list",
        error: `Choose one of: ${values.join(", ")}`,
      };
    }
  }

  const buffer = await book.xlsx.writeBuffer();
  download(
    new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    "students-template.xlsx",
  );
}

export async function downloadTemplate(
  format: "csv" | "xlsx",
  programmeCodes: readonly string[] = [],
) {
  if (format === "csv") return csvTemplate();
  return xlsxTemplate(programmeCodes);
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
        BULK_COLUMNS.map((c) => {
          const cell = raw[c] ?? "";
          return [c, c === "lead_source" ? cell.toUpperCase() : cell];
        }),
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
    .filter((row) => row.raw["full_name"] !== BULK_COLUMN_HINTS.full_name)
    .filter((row) => row.raw["email"] !== SAMPLE_BULK_ROW.email);
}
