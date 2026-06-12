import jsPDF from "jspdf";
import { Document, Packer, Paragraph, HeadingLevel, TextRun } from "docx";
import { saveAs } from "file-saver";
import { GrantTemplate } from "./grantTemplates";

interface ProposalForExport {
  title: string;
  funder_name?: string | null;
  sections: Record<string, string>;
  organization?: { name?: string };
}

export function exportProposalPDF(p: ProposalForExport, template: GrantTemplate) {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const margin = 56;
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  let y = margin;

  const writeLine = (text: string, size: number, bold = false) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(size);
    const lines = doc.splitTextToSize(text, pageW - margin * 2);
    for (const ln of lines) {
      if (y > pageH - margin) { doc.addPage(); y = margin; }
      doc.text(ln, margin, y);
      y += size * 1.3;
    }
  };

  writeLine(p.title, 20, true);
  writeLine(`${template.funder} — ${template.name}`, 11);
  if (p.organization?.name) writeLine(`Submitted by: ${p.organization.name}`, 11);
  y += 12;

  for (const s of template.sections) {
    y += 8;
    writeLine(s.title, 14, true);
    y += 2;
    writeLine(p.sections[s.key] || "(empty)", 11);
  }
  doc.save(`${p.title.replace(/\s+/g, "_")}.pdf`);
}

export async function exportProposalDOCX(p: ProposalForExport, template: GrantTemplate) {
  const children: Paragraph[] = [
    new Paragraph({ heading: HeadingLevel.TITLE, children: [new TextRun(p.title)] }),
    new Paragraph({ children: [new TextRun({ text: `${template.funder} — ${template.name}`, italics: true })] }),
  ];
  if (p.organization?.name) children.push(new Paragraph({ children: [new TextRun(`Submitted by: ${p.organization.name}`)] }));
  children.push(new Paragraph({ children: [new TextRun("")] }));

  for (const s of template.sections) {
    children.push(new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(s.title)] }));
    const body = p.sections[s.key] || "";
    for (const para of body.split(/\n+/)) children.push(new Paragraph({ children: [new TextRun(para)] }));
  }

  const doc = new Document({ sections: [{ children }] });
  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${p.title.replace(/\s+/g, "_")}.docx`);
}
