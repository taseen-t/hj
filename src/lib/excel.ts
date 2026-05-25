import ExcelJS from "exceljs";
import type { Application } from "./types";

function photoCell(url: string | null): string {
  if (!url) return "";
  return url.startsWith("http") ? url : "(uploaded)";
}

export async function buildWorkbook(apps: Application[]): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "House Job Application Portal";
  wb.created = new Date();

  const ws = wb.addWorksheet("Applications", {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  ws.columns = [
    { header: "Submitted", key: "createdAt", width: 20 },
    { header: "Name", key: "name", width: 24 },
    { header: "Father Name", key: "fatherName", width: 24 },
    { header: "Place of Birth", key: "placeOfBirth", width: 18 },
    { header: "Date of Birth", key: "dateOfBirth", width: 14 },
    { header: "Religion", key: "religion", width: 14 },
    { header: "Nationality", key: "nationality", width: 14 },
    { header: "Gender", key: "gender", width: 10 },
    { header: "CNIC / Passport", key: "cnic", width: 20 },
    { header: "Marital Status", key: "maritalStatus", width: 14 },
    { header: "District of Domicile", key: "districtOfDomicile", width: 18 },
    { header: "WhatsApp", key: "whatsapp", width: 16 },
    { header: "Guardian Mobile", key: "guardianMobile", width: 16 },
    { header: "Mailing Address", key: "mailingAddress", width: 32 },
    { header: "University Status", key: "universityStatus", width: 28 },
    { header: "University Name", key: "universityName", width: 26 },
    { header: "Obtained Marks", key: "obtainedMarks", width: 14 },
    { header: "Total Marks", key: "totalMarks", width: 12 },
    { header: "Preference 1", key: "preference1", width: 20 },
    { header: "Preference 2", key: "preference2", width: 20 },
    { header: "Preference 3", key: "preference3", width: 20 },
    { header: "Preference 4", key: "preference4", width: 20 },
    { header: "Assigned Rotation", key: "assignedRotation", width: 20 },
    { header: "Photo", key: "photo", width: 30 },
  ];

  for (const a of apps) {
    ws.addRow({
      createdAt: new Date(a.createdAt).toLocaleString(),
      name: a.name,
      fatherName: a.fatherName,
      placeOfBirth: a.placeOfBirth,
      dateOfBirth: a.dateOfBirth,
      religion: a.religion,
      nationality: a.nationality,
      gender: a.gender,
      cnic: a.cnic,
      maritalStatus: a.maritalStatus,
      districtOfDomicile: a.districtOfDomicile,
      whatsapp: a.whatsapp,
      guardianMobile: a.guardianMobile,
      mailingAddress: a.mailingAddress,
      universityStatus: a.universityStatus,
      universityName: a.universityName,
      obtainedMarks: a.obtainedMarks ?? "",
      totalMarks: a.totalMarks ?? "",
      preference1: a.preference1,
      preference2: a.preference2,
      preference3: a.preference3,
      preference4: a.preference4,
      assignedRotation: a.assignedRotation ?? "",
      photo: photoCell(a.photoUrl),
    });
  }

  const header = ws.getRow(1);
  header.font = { bold: true, color: { argb: "FFFFFFFF" } };
  header.alignment = { vertical: "middle" };
  header.height = 22;
  header.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF05125C" } };
  });
  ws.autoFilter = { from: "A1", to: { row: 1, column: ws.columnCount } };

  // Credit footer, two rows below the data.
  const creditRowIdx = ws.rowCount + 2;
  ws.mergeCells(creditRowIdx, 1, creditRowIdx, ws.columnCount);
  const creditCell = ws.getCell(creditRowIdx, 1);
  creditCell.value = "Software Developed by Dr. Rabiya Tariq & Mohammad Taseen Tariq";
  creditCell.font = { italic: true, color: { argb: "FF6B7280" } };

  const out = await wb.xlsx.writeBuffer();
  return Buffer.from(out);
}
