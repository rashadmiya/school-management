// scripts/seedFinanceRoles.js
require('dotenv').config();
const mongoose = require('mongoose');
const Role = require('../models/Role');

const ROLES = [
    {
        name: 'admin',
        description: 'Full system administrator',
        permissions: ['create', 'edit', 'delete', 'view', 'approve', 'void', 'refund'],
    },
    {
        name: 'accountant',
        description: 'Handles fee collection, waivers, refunds',
        permissions: ['create', 'edit', 'view', 'approve', 'refund'],
    },
    {
        name: 'cashier',
        description: 'Receives payments only',
        permissions: ['create', 'view'],
    },
    {
        name: 'auditor',
        description: 'Read-only access to all finance records',
        permissions: ['view'],
    },
];

async function main() {
    await mongoose.connect(process.env.MONGO_URI);
    for (const r of ROLES) {
        await Role.updateOne({ name: r.name }, { $setOnInsert: r }, { upsert: true });
        console.log(`Ensured role: ${r.name}`);
    }
    await mongoose.disconnect();
}
main().catch(e => { console.error(e); process.exit(1); });