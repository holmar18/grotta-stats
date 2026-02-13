import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const COLORS = {
  accent: [34, 197, 94],
  dark: [20, 20, 20],
  gray: [120, 120, 120],
  lightBg: [245, 245, 245],
  white: [255, 255, 255],
};

function addHeader(doc, title, subtitle) {
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.dark);
  doc.text(title, 14, 22);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.gray);
  doc.text(subtitle, 14, 30);

  // Accent line
  doc.setDrawColor(...COLORS.accent);
  doc.setLineWidth(1.5);
  doc.line(14, 34, 196, 34);

  return 40; // y position after header
}

/**
 * Export a single game as PDF
 */
export function exportGamePdf(game, fieldStats, gkStats, fieldDefs, gkDefs) {
  const doc = new jsPDF();
  let y = addHeader(
    doc,
    `vs ${game.opponent}`,
    `Dagsetning: ${game.game_date}`
  );

  // Field players
  if (fieldStats.length > 0) {
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.dark);
    doc.text('Útileikmenn', 14, y);
    y += 4;

    autoTable(doc, {
      startY: y,
      head: [['Leikmaður', ...fieldDefs.map((s) => s.label)]],
      body: fieldStats.map((r) => [
        r.playerName,
        ...fieldDefs.map((s) => r[s.key] || 0),
      ]),
      styles: {
        fontSize: 9,
        cellPadding: 3,
        textColor: COLORS.dark,
        lineColor: [220, 220, 220],
        lineWidth: 0.3,
      },
      headStyles: {
        fillColor: COLORS.dark,
        textColor: COLORS.white,
        fontStyle: 'bold',
        fontSize: 8,
      },
      alternateRowStyles: { fillColor: COLORS.lightBg },
      margin: { left: 14, right: 14 },
    });

    y = doc.lastAutoTable.finalY + 12;
  }

  // Goalkeepers
  if (gkStats.length > 0) {
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.dark);
    doc.text('Markvörðir', 14, y);
    y += 4;

    autoTable(doc, {
      startY: y,
      head: [['Markvörður', ...gkDefs.map((s) => s.label)]],
      body: gkStats.map((r) => [
        r.playerName,
        ...gkDefs.map((s) => r[s.key] || 0),
      ]),
      styles: {
        fontSize: 9,
        cellPadding: 3,
        textColor: COLORS.dark,
        lineColor: [220, 220, 220],
        lineWidth: 0.3,
      },
      headStyles: {
        fillColor: COLORS.dark,
        textColor: COLORS.white,
        fontStyle: 'bold',
        fontSize: 8,
      },
      alternateRowStyles: { fillColor: COLORS.lightBg },
      margin: { left: 14, right: 14 },
    });
  }

  // Footer
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.gray);
  doc.text('Grótta Stats', 14, pageHeight - 10);
  doc.text(new Date().toLocaleDateString('is-IS'), 196, pageHeight - 10, { align: 'right' });

  doc.save(`Grotta_vs_${game.opponent}_${game.game_date}.pdf`);
}

/**
 * Export a player profile as PDF
 */
export function exportPlayerPdf(player, gameRows, statDefs, totals, averages, gameCount) {
  const doc = new jsPDF();
  let y = addHeader(
    doc,
    `${player.is_goalkeeper ? '🧤 ' : ''}${player.name}`,
    `${player.is_goalkeeper ? 'Markvörður' : 'Útileikmaður'} · ${gameCount} leikir`
  );

  // Summary table
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.dark);
  doc.text('Samtals & meðaltal', 14, y);
  y += 4;

  autoTable(doc, {
    startY: y,
    head: [['Tölfræði', 'Samtals', 'Meðaltal']],
    body: statDefs.map((s) => [
      s.label,
      totals[s.key] || 0,
      averages[s.key] || '0.0',
    ]),
    styles: {
      fontSize: 10,
      cellPadding: 4,
      textColor: COLORS.dark,
      lineColor: [220, 220, 220],
      lineWidth: 0.3,
    },
    headStyles: {
      fillColor: COLORS.dark,
      textColor: COLORS.white,
      fontStyle: 'bold',
    },
    alternateRowStyles: { fillColor: COLORS.lightBg },
    columnStyles: {
      0: { fontStyle: 'bold' },
      1: { halign: 'center' },
      2: { halign: 'center' },
    },
    margin: { left: 14, right: 14 },
  });

  y = doc.lastAutoTable.finalY + 12;

  // Game by game
  if (gameRows.length > 0) {
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.dark);
    doc.text('Leikjayfirlit', 14, y);
    y += 4;

    autoTable(doc, {
      startY: y,
      head: [['Leikur', 'Dags', ...statDefs.map((s) => s.label)]],
      body: gameRows.map((r) => [
        `vs ${r.opponent}`,
        r.game_date,
        ...statDefs.map((s) => r[s.key] || 0),
      ]),
      styles: {
        fontSize: 8,
        cellPadding: 3,
        textColor: COLORS.dark,
        lineColor: [220, 220, 220],
        lineWidth: 0.3,
      },
      headStyles: {
        fillColor: COLORS.dark,
        textColor: COLORS.white,
        fontStyle: 'bold',
        fontSize: 7,
      },
      alternateRowStyles: { fillColor: COLORS.lightBg },
      margin: { left: 14, right: 14 },
    });
  }

  // Footer
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.gray);
  doc.text('Grótta Stats', 14, pageHeight - 10);
  doc.text(new Date().toLocaleDateString('is-IS'), 196, pageHeight - 10, { align: 'right' });

  doc.save(`Grotta_${player.name}.pdf`);
}