// services/pdf/StatementPdfService.js
const BillService = require('../../financeSystem/services/BillService');
const { createDoc, drawFooter, toBuffer } = require('../../utils/pdf');
const { formatCurrency, formatDate } = require('../../utils/format');

class StatementPdfService {
    static async generate(studentId, sessionYear) {
        const settings = await loadSettings();
        const statement = await BillService.getStudentStatement(studentId, sessionYear);

        const doc = createDoc({ settings, title: 'Fee Statement' });

        // Student meta
        doc.font('Helvetica-Bold').fontSize(12).text(statement.student.name, 40);
        doc.font('Helvetica').fontSize(10).fillColor('#666')
            .text(`Roll: ${statement.student.rollNumber}  |  Class: ${statement.student.class || ''} ${statement.student.section ? `- ${statement.student.section}` : ''}`, 40, doc.y + 2)
            .text(`Session: ${statement.session}`, 40, doc.y + 2);
        doc.fillColor('#000');

        doc.moveDown(1.5);

        // Summary box
        const summary = statement.summary || {};
        drawSummaryBox(doc, summary);

        doc.moveDown(1.5);

        // Bills table
        doc.font('Helvetica-Bold').fontSize(12).text('Monthly Bills');
        doc.moveDown(0.5);

        for (const bill of statement.bills) {
            const startY = doc.y + 6;

            // Month header
            doc.font('Helvetica-Bold').fontSize(11).fillColor('#000')
                .text(bill.monthLabel, 40, startY);

            doc.font('Helvetica-Bold').fontSize(10).fillColor('#333')
                .text(`Due: ${formatCurrency(bill.due)}`, 400, startY, { width: 155, align: 'right' });

            // Items
            let y = startY + 18;
            doc.font('Helvetica').fontSize(10).fillColor('#333');
            for (const item of bill.items) {
                doc.text(item.title, 60, y);
                doc.text(item.status, 280, y);
                doc.text(formatCurrency(item.dueAmount), 400, y, { width: 155, align: 'right' });
                y += 16;
            }

            // Underline
            doc.moveTo(40, y + 4).lineTo(doc.page.width - 40, y + 4).strokeColor('#eee').stroke();

            doc.y = y + 10;

            // Page break
            if (doc.y > doc.page.height - 120) doc.addPage();
        }

        doc.moveDown(1.5);

        // Payments history
        if (statement.payments.length > 0) {
            doc.font('Helvetica-Bold').fontSize(12).text('Recent Payments');
            doc.moveDown(0.5);

            for (const p of statement.payments.slice(0, 20)) {
                doc.font('Helvetica').fontSize(10);
                doc.text(`${formatDate(p.createdAt)}  •  ${p.receiptNumber}`, 40, doc.y + 4);
                doc.text(formatCurrency(p.amount), 400, doc.y - 11, { width: 155, align: 'right' });
            }
        }

        drawFooter(doc, settings);

        return toBuffer(doc);
    }
}

function drawSummaryBox(doc, summary) {
    const boxTop = doc.y + 6;
    const boxHeight = 90;
    const boxWidth = doc.page.width - 80;

    doc
        .roundedRect(40, boxTop, boxWidth, boxHeight, 6)
        .fillAndStroke('#f7f7f7', '#eee');

    doc.fillColor('#000');
    const leftX = 60;
    const rightX = 320;
    const row1 = boxTop + 15;
    const row2 = row1 + 22;
    const row3 = row2 + 22;

    doc.font('Helvetica').fontSize(10).fillColor('#666');
    doc.text('Total Fee', leftX, row1);
    doc.font('Helvetica-Bold').fontSize(12).fillColor('#000')
        .text(formatCurrency(summary.totalFee), leftX + 100, row1 - 2);

    doc.font('Helvetica').fontSize(10).fillColor('#666');
    doc.text('Total Paid', rightX, row1);
    doc.font('Helvetica-Bold').fontSize(12).fillColor('#0a0')
        .text(formatCurrency(summary.totalPaid), rightX + 100, row1 - 2);

    doc.font('Helvetica').fontSize(10).fillColor('#666');
    doc.text('Waived', leftX, row2);
    doc.font('Helvetica-Bold').fontSize(12).fillColor('#60a')
        .text(formatCurrency(summary.totalWaived), leftX + 100, row2 - 2);

    doc.font('Helvetica').fontSize(10).fillColor('#666');
    doc.text('Advance', rightX, row2);
    doc.font('Helvetica-Bold').fontSize(12).fillColor('#268')
        .text(formatCurrency(summary.advanceBalance), rightX + 100, row2 - 2);

    doc.font('Helvetica-Bold').fontSize(12).fillColor('#666')
        .text('Amount Due', leftX, row3);
    doc.font('Helvetica-Bold').fontSize(16).fillColor('#c00')
        .text(formatCurrency(summary.dueBalance), leftX + 100, row3 - 4);

    doc.fillColor('#000');
    doc.y = boxTop + boxHeight + 10;
}

async function loadSettings() {
    const Setting = require('../../models/Setting');
    const rows = await Setting.find().lean();
    const out = {};
    for (const r of rows) out[r.key] = r.value;
    return out;
}

module.exports = StatementPdfService;