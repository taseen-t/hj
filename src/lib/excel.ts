import writeXlsxFile from "write-excel-file/node";
import type { Cell, Columns, SheetData } from "write-excel-file";
import { computePercentage, referenceIdFor, type Application } from "./types";

const NAVY = "#05125c";
const GREY = "#6b7280";

function photoCell(url: string | null): string {
  if (!url) return "";
  return url.startsWith("http") ? url : "(uploaded)";
}

const COLUMN_DEFS: ReadonlyArray<{
  header: string;
  width: number;
  value: (a: Application) => string;
}> = [
  { header: "Ref ID", width: 16, value: (a) => referenceIdFor(a) },
  { header: "Submitted", width: 20, value: (a) => new Date(a.createdAt).toLocaleString() },
  { header: "Name", width: 24, value: (a) => a.name },
  { header: "Father Name", width: 24, value: (a) => a.fatherName },
  { header: "Place of Birth", width: 18, value: (a) => a.placeOfBirth },
  { header: "Date of Birth", width: 14, value: (a) => a.dateOfBirth },
  { header: "Religion", width: 14, value: (a) => a.religion },
  { header: "Nationality", width: 14, value: (a) => a.nationality },
  { header: "Gender", width: 10, value: (a) => a.gender },
  { header: "CNIC / Passport", width: 20, value: (a) => a.cnic },
  { header: "Marital Status", width: 14, value: (a) => a.maritalStatus },
  { header: "District of Domicile", width: 18, value: (a) => a.districtOfDomicile },
  { header: "WhatsApp", width: 16, value: (a) => a.whatsapp },
  { header: "Guardian Mobile", width: 16, value: (a) => a.guardianMobile },
  { header: "Mailing Address", width: 32, value: (a) => a.mailingAddress },
  { header: "University Status", width: 28, value: (a) => a.universityStatus },
  { header: "University Name", width: 26, value: (a) => a.universityName },
  { header: "Obtained Marks", width: 14, value: (a) => a.obtainedMarks?.toString() ?? "" },
  { header: "Total Marks", width: 12, value: (a) => a.totalMarks?.toString() ?? "" },
  { header: "Percentage", width: 12, value: (a) => computePercentage(a.obtainedMarks, a.totalMarks) },
  { header: "Preference 1", width: 20, value: (a) => a.preference1 },
  { header: "Preference 2", width: 20, value: (a) => a.preference2 },
  { header: "Preference 3", width: 20, value: (a) => a.preference3 },
  { header: "Preference 4", width: 20, value: (a) => a.preference4 },
  { header: "Assigned Rotation", width: 20, value: (a) => a.assignedRotation ?? "" },
  { header: "Photo", width: 30, value: (a) => photoCell(a.photoUrl) },
];

export async function buildWorkbook(apps: Application[]): Promise<Buffer> {
  const numCols = COLUMN_DEFS.length;

  const headerRow: Cell[] = COLUMN_DEFS.map((c) => ({
    value: c.header,
    type: String,
    fontWeight: "bold",
    color: "#ffffff",
    backgroundColor: NAVY,
    height: 22,
  }));

  const dataRows: Cell[][] = apps.map((a) =>
    COLUMN_DEFS.map(
      (c): Cell => ({
        value: c.value(a),
        type: String,
      })
    )
  );

  const spacerRow: Cell[] = Array.from({ length: numCols }, () => ({
    value: "",
    type: String,
  }));

  // Credit footer: merged across all columns, italic, grey.
  const creditRow: Cell[] = [
    {
      value: "Software Developed by Dr. Rabiya Tariq & Mohammad Taseen Tariq",
      type: String,
      fontStyle: "italic",
      color: GREY,
      span: numCols,
    },
    ...Array<Cell>(numCols - 1).fill(null),
  ];

  const data: SheetData = [headerRow, ...dataRows, spacerRow, creditRow];
  const columns: Columns = COLUMN_DEFS.map((c) => ({ width: c.width }));

  return await writeXlsxFile(data, {
    columns,
    stickyRowsCount: 1,
    buffer: true,
    sheet: "Applications",
  });
}
