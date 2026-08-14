import { jsPDF } from "jspdf";
import QRCode from "qrcode";

import { formatDateTime } from "@/lib/datetime";

type HallTicketData = {
  ticketNumber: string;
  bookingRef: string;
  qrPayload: string;
  student: { fullName: string; studentCode: string; id: string; phone: string; email: string };
  exam: {
    title: string;
    startsAt: string | null;
    reportingAt: string | null;
    durationMinutes: number;
    venue: string;
    instructions: string;
  };
};

export async function downloadHallTicketPdf(data: HallTicketData) {
  const document = new jsPDF({ unit: "mm", format: "a4" });
  const qr = await QRCode.toDataURL(data.qrPayload, { margin: 1, width: 420 });

  document.setFont("helvetica", "bold");
  document.setFontSize(11);
  document.text("ADMISSIONS OS", 18, 20);
  document.setFontSize(20);
  document.text("ENTRANCE EXAM HALL TICKET", 18, 31);
  document.setDrawColor(205);
  document.line(18, 37, 192, 37);

  document.addImage(qr, "PNG", 151, 43, 41, 41);
  document.setFontSize(13);
  document.text(data.exam.title, 18, 50, { maxWidth: 125 });
  document.setFont("helvetica", "normal");
  document.setFontSize(9);
  document.text(`Ticket: ${data.ticketNumber}`, 18, 62);
  document.text(`Booking: ${data.bookingRef}`, 18, 68);

  const rows = [
    ["Candidate name", data.student.fullName],
    ["Student number", data.student.studentCode],
    ["Student ID", data.student.id],
    ["Contact", data.student.phone],
    ["Exam date & time", data.exam.startsAt ? formatDateTime(data.exam.startsAt) : "To be announced"],
    ["Reporting time", data.exam.reportingAt ? formatDateTime(data.exam.reportingAt) : "30 minutes prior"],
    ["Duration", `${data.exam.durationMinutes} minutes`],
    ["Venue", data.exam.venue],
  ];

  let y = 94;
  for (const [label, value] of rows) {
    document.setFont("helvetica", "bold");
    document.text(label, 18, y);
    document.setFont("helvetica", "normal");
    document.text(String(value), 64, y, { maxWidth: 126 });
    y += 10;
  }

  document.setFillColor(246, 247, 249);
  document.roundedRect(18, y + 2, 174, 49, 2, 2, "F");
  document.setFont("helvetica", "bold");
  document.text("Instructions", 24, y + 12);
  document.setFont("helvetica", "normal");
  document.text(data.exam.instructions, 24, y + 21, { maxWidth: 162 });
  document.setFontSize(8);
  document.text("Carry a printed copy of this hall ticket and your Aadhaar card for verification.", 18, 282);

  document.save(`hall-ticket-${data.student.studentCode}.pdf`);
}