// services/ParentService.js
const Parent = require('../models/Parent');
const Student = require('../models/Student');

class ParentService {
    /**
     * Upsert a parent by phone, link to the given student.
     * If the parent is new, returns { parent, tempPin } where tempPin is the
     * plaintext 6-digit code the admin must relay to the parent. If the parent
     * already existed, tempPin is null.
     *
     * Safe to call repeatedly. Must be called inside the student-create txn.
     */
    static async attachToStudent(
        { phone, name, email, altPhone, address },
        studentId,
        dbSession
    ) {
        if (!phone) return { parent: null, tempPin: null };

        const normalized = Parent.normalizePhone(phone);
        if (!normalized) return { parent: null, tempPin: null };

        const opts = { new: true, session: dbSession };
        const existing = await Parent.findOne({ phone: normalized }).session(dbSession);

        let parent, tempPin = null;

        if (existing) {
            const $set = {};
            if (email)    $set.email    = email;
            if (altPhone) $set.altPhone = altPhone;
            if (address)  $set.address  = address;

            parent = await Parent.findByIdAndUpdate(
                existing._id,
                { $set, $addToSet: { children: studentId } },
                opts
            );
        } else {
            tempPin = Parent.generateTempPin();
            const pinHash = await require('bcryptjs').hash(tempPin, 10);

            const [created] = await Parent.create([{
                phone: normalized,
                name: name || 'Guardian',
                email, altPhone, address,
                children: [studentId],
                pin: pinHash,
                pinIsTemp: true,
                isVerified: false,
            }], { session: dbSession });
            parent = created;
        }

        await Student.findByIdAndUpdate(
            studentId,
            { parent: parent._id },
            { session: dbSession }
        );

        return { parent, tempPin };
    }

    /** Link an existing parent to a student (used when the admin picks one). */
    static async linkExisting(parentId, studentId, dbSession) {
        const opts = { new: true };
        if (dbSession) opts.session = dbSession;

        const parent = await Parent.findByIdAndUpdate(
            parentId,
            { $addToSet: { children: studentId } },
            opts
        );
        if (!parent) throw new Error('Parent not found');

        await Student.findByIdAndUpdate(
            studentId,
            { parent: parent._id },
            dbSession ? { session: dbSession } : {}
        );

        return parent;
    }

    /** Detach from a student (called on student delete / reparenting). */
    static async detachFromStudent(studentId, dbSession) {
        const opts = dbSession ? { session: dbSession } : {};
        await Parent.updateMany(
            { children: studentId },
            { $pull: { children: studentId } },
            opts
        );
    }

    /** Search parents (used by the admin picker in the Family tab). */
    static async search(query = '', limit = 20) {
        const q = {};
        if (query && query.trim()) {
            const s = query.trim();
            q.$or = [
                { name:  { $regex: s, $options: 'i' } },
                { phone: { $regex: s, $options: 'i' } },
                { email: { $regex: s, $options: 'i' } },
            ];
        }
        return Parent.find(q)
            .select('name phone email children')
            .populate('children', 'name rollNumber')
            .limit(limit)
            .lean();
    }
}

module.exports = ParentService;

// // services/ParentService.js
// const Parent = require('../models/Parent');
// const Student = require('../models/Student');

// class ParentService {
//     /**
//      * Upsert by phone, link to the student. Safe to call repeatedly.
//      * Returns the parent doc (new or existing).
//      */
//     static async attachToStudent({ phone, name, email, altPhone, address }, studentId, dbSession) {
//         if (!phone) return null;

//         const normalized = Parent.normalizePhone(phone);
//         if (!normalized) return null;

//         const opts = { upsert: true, new: true, setDefaultsOnInsert: true };
//         if (dbSession) opts.session = dbSession;

//         const parent = await Parent.findOneAndUpdate(
//             { phone: normalized },
//             {
//                 $setOnInsert: { phone: normalized, name: name || 'Guardian' },
//                 // Only fill in missing fields on the existing doc
//                 $set: {
//                     ...(email    ? { email }     : {}),
//                     ...(altPhone ? { altPhone }  : {}),
//                     ...(address  ? { address }   : {}),
//                 },
//                 $addToSet: { children: studentId },
//             },
//             opts
//         );

//         // Attach the parent to the student (so student.parent is set)
//         const studentOpts = dbSession ? { session: dbSession } : {};
//         await Student.findByIdAndUpdate(studentId, { parent: parent._id }, studentOpts);

//         return parent;
//     }

//     /** Called on student delete, so we don't leave orphan links. */
//     static async detachFromStudent(studentId, dbSession) {
//         const opts = dbSession ? { session: dbSession } : {};
//         await Parent.updateMany({ children: studentId }, { $pull: { children: studentId } }, opts);
//     }
// }

// module.exports = ParentService;