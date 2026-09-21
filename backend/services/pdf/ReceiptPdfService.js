// services/pdf/ReceiptPdfService.js
const Payment = require('../../financeSystem/models/Payment');
const Setting = require('../../models/Setting');
const { createDoc, drawFooter, toBuffer } = require('../../utils/pdf');
const { formatCurrency, formatDate } = require('../../utils/format');

class ReceiptPdfService {
    static async generate(paymentId) {
        const payment = await Payment.findById(paymentId)
            .populate({
                path: 'student',
                populate: [
                    { path: 'class', select: 'name section' },
                    { path: 'parent', select: 'name phone' },
                ],
            })
            .populate('receivedBy', 'name')
            .lean();
        if (!payment) throw new Error('Payment not found');

        const settings = await loadSettings();

        const doc = createDoc({ settings, title: 'Payment Receipt' });

        // Meta block
        doc.font('Helvetica-Bold').fontSize(11).text('Receipt Number', 40);
        doc.font('Helvetica').fontSize(11).text(payment.receiptNumber || payment._id.toString(), 40, doc.y + 2);

        doc.font('Helvetica-Bold').fontSize(11).text('Date', 300, doc.y - 13);
        doc.font('Helvetica').fontSize(11).text(formatDate(payment.createdAt), 300, doc.y + 2);

        doc.moveDown(2);

        // Student block
        doc.font('Helvetica-Bold').fontSize(11).text('Student', 40);
        doc.font('Helvetica').fontSize(11).text(payment.student.name, 40, doc.y + 2);
        doc.fontSize(9).fillColor('#666')
            .text(
                `Roll: ${payment.student.rollNumber}  |  Class: ${payment.student.class?.name || ''} ${payment.student.class?.section ? `- ${payment.student.class.section.name}` : ''}`,
                40,
                doc.y + 2
            );
        doc.fillColor('#000');

        doc.moveDown(2);

        // Amount table
        const tableTop = doc.y + 10;
        drawTableHeader(doc, tableTop, ['Description', 'Method', 'Amount']);

        const rowY = tableTop + 22;
        doc.font('Helvetica').fontSize(11);
        doc.text('Fee Payment', 40, rowY);
        doc.text(payment.method.replace('_', ' ').toUpperCase(), 280, rowY);
        doc.font('Helvetica-Bold').text(formatCurrency(payment.amount), 400, rowY, { width: 155, align: 'right' });

        // Divider
        doc.moveTo(40, rowY + 22).lineTo(doc.page.width - 40, rowY + 22).strokeColor('#eee').stroke();

        // Total
        doc.font('Helvetica-Bold').fontSize(13).text('TOTAL', 40, rowY + 34);
        doc.fontSize(13).text(formatCurrency(payment.amount), 400, rowY + 34, { width: 155, align: 'right' });

        // Allocations (below total)
        const allocations = await loadAllocations(payment._id);
        if (allocations.length > 0) {
            doc.moveDown(3);
            doc.font('Helvetica-Bold').fontSize(10).text('Applied To:', 40);
            doc.font('Helvetica').fontSize(10);
            for (const a of allocations) {
                doc.text(`• ${a.title}: ${formatCurrency(a.amount)}`, 40, doc.y + 2);
            }
        }

        doc.moveDown(3);
        doc.font('Helvetica-Oblique').fontSize(9).fillColor('#666')
            .text('This is a computer-generated receipt.', 40, doc.y + 10);
        doc.fillColor('#000');

        drawFooter(doc, settings);

        return toBuffer(doc);
    }
}

function drawTableHeader(doc, y, cols) {
    doc.font('Helvetica-Bold').fontSize(10).fillColor('#333');
    doc.text(cols[0], 40, y);
    doc.text(cols[1], 280, y);
    doc.text(cols[2], 400, y, { width: 155, align: 'right' });
    doc.moveTo(40, y + 14).lineTo(doc.page.width - 40, y + 14).strokeColor('#333').stroke();
    doc.fillColor('#000');
}

async function loadSettings() {
    const rows = await Setting.find().lean();
    const out = {};
    for (const r of rows) out[r.key] = r.value;
    return out;
}

async function loadAllocations(paymentId) {
    const PaymentAllocation = require('../../financeSystem/models/PaymentAllocation');
    const allocs = await PaymentAllocation.find({ payment: paymentId })
        .populate({ path: 'feeInstance', select: 'title' })
        .lean();
    return allocs.map(a => ({
        title: a.feeInstance?.title || 'Fee',
        amount: a.amount.toString(),
    }));
}

module.exports = ReceiptPdfService;