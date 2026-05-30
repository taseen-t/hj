import { computePercentage, type ApplicationInput } from "./types";

// Builds a clean, single-page A4 PDF of the submitted application, entirely in
// the browser (no applicant data ever leaves the page to a third party).
export async function downloadApplicationPdf(
  data: ApplicationInput & { photo?: string; referenceId?: string }
): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const M = 40;
  const navy: [number, number, number] = [5, 18, 92];

  /* ---- Header band ---- */
  doc.setFillColor(...navy);
  doc.rect(0, 0, W, 104, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("APPLICATION FOR HOUSE JOB", M, 38);
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text("Annual Session 2026 - 2027", M, 58);
  doc.text("Allied Hospital-I / II & FTH, Faisalabad", M, 76);

  /* ---- Photo ---- */
  if (data.photo) {
    try {
      const fmt = data.photo.includes("image/png") ? "PNG" : "JPEG";
      doc.setFillColor(255, 255, 255);
      doc.rect(W - M - 74, 14, 74, 84, "F");
      doc.addImage(data.photo, fmt, W - M - 72, 16, 70, 80);
    } catch {
      /* ignore unsupported image */
    }
  }

  /* ---- Reference ID (top-right, below header band) ---- */
  if (data.referenceId) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...navy);
    doc.text(`REFERENCE ID: ${data.referenceId}`, W - M, 122, { align: "right" });
  }

  let y = 142;

  const field = (x: number, label: string, value: string, colWidth: number) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(120, 120, 130);
    doc.text(label.toUpperCase(), x, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);
    doc.setTextColor(20, 20, 30);
    const lines = doc.splitTextToSize(value || "-", colWidth);
    doc.text(lines, x, y + 13);
  };

  const col2 = W / 2 + 6;
  const colWidth = W / 2 - M - 6;
  const rowH = 38;

  const section = (title: string) => {
    doc.setFillColor(238, 242, 255);
    doc.rect(M, y - 12, W - M * 2, 22, "F");
    doc.setTextColor(...navy);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.text(title, M + 8, y + 3);
    y += 28;
  };

  const pairs = (items: [string, string][]) => {
    for (let i = 0; i < items.length; i += 2) {
      field(M, items[i][0], items[i][1], colWidth);
      if (items[i + 1]) field(col2, items[i + 1][0], items[i + 1][1], colWidth);
      y += rowH;
    }
  };

  section("Personal Information");
  pairs([
    ["Name", data.name],
    ["Father Name", data.fatherName],
    ["Place of Birth", data.placeOfBirth],
    ["Date of Birth", data.dateOfBirth],
    ["Religion", data.religion],
    ["Nationality", data.nationality],
    ["Gender", data.gender],
    ["CNIC / Passport", data.cnic],
    ["Marital Status", data.maritalStatus],
    ["District of Domicile", data.districtOfDomicile],
    ["WhatsApp Number", data.whatsapp],
    ["Guardian Mobile", data.guardianMobile],
  ]);
  field(M, "Mailing Address", data.mailingAddress, W - M * 2);
  y += rowH;

  section("Academic Information");
  pairs([
    ["University / College Status", data.universityStatus || "-"],
    ["University / College Name", data.universityName || "-"],
    ["Obtained Marks", data.obtainedMarks || "-"],
    ["Total Marks", data.totalMarks || "-"],
    ["Percentage", computePercentage(data.obtainedMarks, data.totalMarks) || "-"],
  ]);

  section("Preferred Rotations");
  const prefs = [data.preference1, data.preference2, data.preference3, data.preference4];
  prefs.forEach((p, i) => {
    if (!p) return;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(...navy);
    doc.text(`${i + 1}.`, M + 4, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(20, 20, 30);
    doc.text(p, M + 22, y);
    y += 20;
  });

  /* ---- Footer ---- */
  doc.setDrawColor(220, 220, 228);
  doc.line(M, 798, W - M, 798);
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.setTextColor(140, 140, 150);
  doc.text(
    `Generated on ${new Date().toLocaleString()} - This is the applicant's copy.`,
    M,
    815
  );
  doc.text(
    "Software developed by Dr. Rabiya Tariq, Mohammad Taseen Tariq & Zafar Manzoor.",
    W - M,
    815,
    { align: "right" }
  );

  const safe = data.name.replace(/[^a-z0-9]+/gi, "_").replace(/^_|_$/g, "") || "applicant";
  doc.save(`HouseJob-Application-${safe}.pdf`);
}
