// controllers/FeeController.js - UPDATED
const FeeService = require('../services/FeeService');
const FeeTemplate = require('../financeSystem/models/FeeTemplate');
const { validationResult } = require('express-validator');
const Student = require('../models/Student');
const FeeInstance = require('../financeSystem/models/FeeInstance');

class FeeController {
    // POST /api/fees/templates
    static async createTemplate(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    errors: errors.array()
                });
            }

            const template = await FeeService.createTemplate(req.body, req.user._id);

            res.status(201).json({
                success: true,
                message: 'Fee template created successfully',
                data: template
            });
        } catch (err) {
            res.status(400).json({
                success: false,
                message: err.message
            });
        }
    }

    // POST /api/fees/templates/:id/apply
    static async applyFee(req, res) {
        try {
            const result = await FeeService.applyFeeTemplate(
                req.params.id,
                req.user._id,
                req.body
            );

            res.json({
                success: true,
                message: 'Fee applied successfully',
                data: result
            });
        } catch (err) {
            res.status(400).json({
                success: false,
                message: err.message
            });
        }
    }

    // GET /api/fees/student/:studentId
    static async getStudentFees(req, res) {
        try {
            const { session = FeeService.getCurrentSession() } = req.query;
            const fees = await FeeService.getStudentFees(req.params.studentId, session);

            res.json({
                success: true,
                data: fees
            });
        } catch (err) {
            res.status(400).json({
                success: false,
                message: err.message
            });
        }
    }

    // GET /api/fees/student/:studentId/summary
    static async getFeeSummary(req, res) {
        try {
            const { session = FeeService.getCurrentSession() } = req.query;
            console.log("session at fee summary :", session, req.params.studentId)
            const summary = await FeeService.getFeeSummary(req.params.studentId, session);
            // console.log("fee summary :", summary)

            res.json({
                success: true,
                data: summary
            });
        } catch (err) {
            res.status(400).json({
                success: false,
                message: err.message
            });
        }
    }

    // PUT /api/fees/instances/:id
    static async updateFeeInstance(req, res) {
        try {
            const feeInstance = await FeeService.updateFeeInstance(
                req.params.id,
                req.body,
                req.user._id
            );

            res.json({
                success: true,
                message: 'Fee instance updated successfully',
                data: feeInstance
            });
        } catch (err) {
            res.status(400).json({
                success: false,
                message: err.message
            });
        }
    }

    // GET /api/fees/templates
    static async getFeeTemplates(req, res) {
        try {
            const { isActive, session } = req.query;
            const query = {};

            if (isActive !== undefined) {
                query.isActive = isActive === 'true';
            }

            if (session) {
                query.session = session;
            }

            const templates = await FeeTemplate.find(query)
                .sort({ createdAt: -1 })
                .populate('createdBy', 'name email')
                .lean();

            res.json({
                success: true,
                data: templates
            });
        } catch (err) {
            res.status(400).json({
                success: false,
                message: err.message
            });
        }
    }

    // Add this to your backend FeeController.js
    //   static async getEligibleStudents(req, res) {
    //     try {
    //         const template = await FeeTemplate.findById(req.params.id);
    //         if (!template) {
    //             return res.status(404).json({
    //                 success: false,
    //                 message: 'Fee template not found'
    //             });
    //         }

    //         const currentSession = template.session || "2025-2026";
    //         let students = [];
    //         console.log("called this.getEligibleStudents:", template);

    //         // REMOVED isActive from query since your Student model doesn't have it
    //         switch (template.appliesTo.scope) {
    //             case 'all':
    //                 students = await Student.find({
    //                     session: currentSession
    //                 }).select('_id name rollNumber class section feeCategory');
    //                 break;
    //             case 'class':
    //                 students = await Student.find({
    //                     class: template.appliesTo.class,
    //                     session: currentSession
    //                 }).select('_id name rollNumber class section feeCategory');
    //                 break;
    //             case 'section':
    //                 students = await Student.find({
    //                     class: template.appliesTo.class,
    //                     section: template.appliesTo.section,
    //                     session: currentSession
    //                 }).select('_id name rollNumber class section feeCategory');
    //                 break;
    //             case 'individual':
    //                 students = await Student.find({
    //                     _id: template.appliesTo.individualStudent,
    //                     session: currentSession
    //                 }).select('_id name rollNumber class section feeCategory');
    //                 break;
    //         }

    //         console.log("Found students:", students.length);

    //         // Check which students already have this fee
    //         const studentIds = students.map(s => s._id);
    //         const existingFees = await FeeInstance.find({
    //             student: { $in: studentIds },
    //             feeTemplate: template._id,
    //             session: currentSession,
    //             isActive: true
    //         }).select('student');

    //         const existingStudentIds = new Set(existingFees.map(f => f.student.toString()));

    //         res.json({
    //             success: true,
    //             data: {
    //                 template: {
    //                     title: template.title,
    //                     scope: template.appliesTo.scope,
    //                     appliesTo: template.appliesTo
    //                 },
    //                 eligibleStudents: students.map(student => ({
    //                     ...student.toObject(),
    //                     alreadyHasFee: existingStudentIds.has(student._id.toString())
    //                 })),
    //                 counts: {
    //                     total: students.length,
    //                     alreadyHasFee: existingStudentIds.size,
    //                     willBeApplied: students.length - existingStudentIds.size
    //                 }
    //             }
    //         });
    //     } catch (err) {
    //         console.error("Error:", err);
    //         res.status(400).json({
    //             success: false,
    //             message: err.message
    //         });
    //     }
    // }

    static async getEligibleStudents(req, res) {
        try {
            const template = await FeeTemplate.findById(req.params.id);
            if (!template) {
                return res.status(404).json({
                    success: false,
                    message: 'Fee template not found'
                });
            }

            // console.log("Template found:", {
            //     id: template._id,
            //     title: template.title,
            //     session: template.session,
            //     scope: template.appliesTo.scope
            // });

            const currentSession = template.session || "2025-2026";
            // console.log("Using session:", currentSession);

            // DEBUG: Count all students in session first
            // const totalStudentsInSession = await Student.countDocuments({
            //     session: currentSession
            // });
            // console.log("Total students in session:", totalStudentsInSession);

            // DEBUG: Check student with specific ID
            // const testStudent = await Student.findOne({
            //     _id: "69417874d3f738d3d3c8d0a1",
            //     session: currentSession
            // });
            // console.log("Test student found:", testStudent ? "YES" : "NO");
            // if (testStudent) {
            //     console.log("Test student details:", {
            //         name: testStudent.name,
            //         session: testStudent.session,
            //         isActive: testStudent.isActive
            //     });
            // }

            let students = [];
            let query = {};

            // Build query step by step
            query.session = currentSession;

            // Only add isActive if the field exists
            const studentSample = await Student.findOne();
            if (studentSample && studentSample.isActive !== undefined) {
                query.isActive = true;
            } else {
                console.log("Note: isActive field not found in Student model");
            }

            // Add scope-specific conditions
            switch (template.appliesTo.scope) {
                case 'all':
                    // Already have session and isActive (if exists)
                    break;
                case 'class':
                    if (template.appliesTo.class) {
                        query.class = template.appliesTo.class;
                    }
                    break;
                case 'section':
                    if (template.appliesTo.class && template.appliesTo.section) {
                        query.class = template.appliesTo.class;
                        query.section = template.appliesTo.section;
                    }
                    break;
                case 'individual':
                    if (template.appliesTo.individualStudent) {
                        query._id = template.appliesTo.individualStudent;
                    }
                    break;
            }

            // console.log("Final query:", JSON.stringify(query, null, 2));

            students = await Student.find(query)
                .select('_id name rollNumber class feeCategory session isActive')
                .populate('class', 'name section');

            // console.log("Query result count:", students.length);
            // console.log("First student (if any):", students[0] ? students[0].toObject() : null);

            // Check which students already have this fee
            const studentIds = students.map(s => s._id);
            // console.log("Student IDs to check for existing fees:", studentIds);

            const existingFees = await FeeInstance.find({
                student: { $in: studentIds },
                feeTemplate: template._id,
                session: currentSession,
                isActive: true
            }).select('student');

            // console.log("Existing fees found:", existingFees.length);
            // console.log("Existing fee student IDs:", existingFees.map(f => f.student));

            const existingStudentIds = new Set(existingFees.map(f => f.student.toString()));

            res.json({
                success: true,
                data: {
                    template: {
                        title: template.title,
                        scope: template.appliesTo.scope,
                        appliesTo: template.appliesTo,
                        session: template.session
                    },
                    eligibleStudents: students.map(student => ({
                        ...student.toObject(),
                        alreadyHasFee: existingStudentIds.has(student._id.toString())
                    })),
                    counts: {
                        total: students.length,
                        alreadyHasFee: existingStudentIds.size,
                        willBeApplied: students.length - existingStudentIds.size
                    },
                    // debug: {
                    //     queryUsed: query,
                    //     totalStudentsInSession,
                    //     testStudentFound: !!testStudent
                    // }
                }
            });
        } catch (err) {
            console.error("Error in getEligibleStudents:", err);
            res.status(400).json({
                success: false,
                message: err.message,
                stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
            });
        }
    }

    static async getCurrentSession(req, res) {
        try {
            const currentSession = FeeService.getCurrentSession();

            res.json({
                success: true,
                data: {
                    currentSession,
                    displayName: `Academic Year ${currentSession.replace('-', '-')}`,
                    previousSession: `${parseInt(currentSession.split('-')[0]) - 1}-${currentSession.split('-')[0]}`,
                    nextSession: `${parseInt(currentSession.split('-')[1])}-${parseInt(currentSession.split('-')[1]) + 1}`
                }
            });
        } catch (err) {
            res.status(400).json({
                success: false,
                message: err.message
            });
        }
    }

    // Optional: Add session switching capability
    static async setCurrentSession(req, res) {
        try {
            const { session } = req.body;
            const user = req.user;

            // Validate session format (YYYY-YYYY+1)
            const yearPattern = /^\d{4}-\d{4}$/;
            if (!yearPattern.test(session)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid session format. Use YYYY-YYYY format'
                });
            }

            const [startYear, endYear] = session.split('-').map(Number);
            if (endYear !== startYear + 1) {
                return res.status(400).json({
                    success: false,
                    message: 'Session must be consecutive years (e.g., 2024-2025)'
                });
            }

            // Store user's preferred session (you need a UserSettings model)
            // await UserSettings.findOneAndUpdate(
            //     { user: user._id },
            //     { currentSession: session },
            //     { upsert: true, new: true }
            // );

            res.json({
                success: true,
                message: 'Session preference updated',
                data: { session }
            });
        } catch (err) {
            res.status(400).json({
                success: false,
                message: err.message
            });
        }
    }
}

module.exports = FeeController;

// const FeeService = require("../services/FeeService");
// class FeeController {
//   // POST /api/fees/templates
//   static async createTemplate(req, res) {
//     try {
//       const template = await FeeService.createTemplate(req.body);
//       res.status(201).json({
//         success: true,
//         data: template
//       });
//     } catch (err) {
//       res.status(400).json({
//         success: false,
//         message: err.message
//       });
//     }
//   }

//   // POST /api/fees/templates/:id/apply
//   static async applyFee(req, res) {
//     try {
//       const result = await FeeService.applyFee(req.params.id);
//       res.json({
//         success: true,
//         message: "Fee applied successfully",
//         data: result
//       });
//     } catch (err) {
//       res.status(400).json({
//         success: false,
//         message: err.message
//       });
//     }
//   }
// }

// module.exports = FeeController;
