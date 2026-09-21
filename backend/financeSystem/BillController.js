// controllers/BillController.js
const BillService = require('./services/BillService');
const { getCurrentSession } = require('../utils/accademicSession');

class BillController {
    static async getMonthlyBills(req, res) {
        const session = req.query.session || getCurrentSession();
        const bills = await BillService.getMonthlyBills(req.params.studentId, session);
        res.json({ success: true, data: bills });
    }

    static async getCurrentBill(req, res) {
        const session = req.query.session || getCurrentSession();
        const bill = await BillService.getCurrentBill(req.params.studentId, session);
        res.json({ success: true, data: bill });
    }

    static async getStudentStatement(req, res) {
        const session = req.query.session || getCurrentSession();
        const statement = await BillService.getStudentStatement(req.params.studentId, session);
        res.json({ success: true, data: statement });
    }
}

module.exports = BillController;