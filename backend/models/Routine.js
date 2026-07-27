//Routine.js
const mongoose = require("mongoose");

const routineSchema = new mongoose.Schema(
    {
        class: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Class",
            required: true,
        },
        // section: {
        //     type: mongoose.Schema.Types.ObjectId,
        //     ref: "Section",
        // },
        subject: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Subject",
            required: true,
        },
        teacher: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Teacher",
            required: true,
        },
        day: {
            type: String,
            enum: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
            required: true,
        },
        periodNumber: {
            type: Number,
            required: true,
            min: 1,
            max: 12
        },
        startTime: {
            type: String, // Format: "HH:MM"
            required: true,
        },
        endTime: {
            type: String, // Format: "HH:MM"
            required: true,
        },
        roomNumber: {
            type: String,
        },
        isActive: {
            type: Boolean,
            default: true
        }
    },
    { timestamps: true }
);

// Prevent duplicate routine for same class+day+period
routineSchema.index({ 
    class: 1, 
    section: 1,
    day: 1, 
    periodNumber: 1 
}, { unique: true });

// Prevent teacher double booking
routineSchema.index({ 
    teacher: 1, 
    day: 1,
    $or: [
        { startTime: 1, endTime: 1 }
    ]
});

module.exports = mongoose.model("Routine", routineSchema);


// const mongoose = require("mongoose");

// const routineSchema = new mongoose.Schema(
//   {
//     class: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Class",
//       required: true,
//     },
//     subject: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Subject",
//       required: true,
//     },
//     teacher: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Teacher",
//       required: true,
//     },
//     day: {
//       type: String,
//       enum: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
//       required: true,
//     },
//     startTime: {
//       type: String,
//       required: true,
//     },
//     endTime: {
//       type: String,
//       required: true,
//     },
//     roomNumber: {
//       type: String,
//     },
//   },
//   { timestamps: true }
// );

// // Prevent duplicates: one teacher cannot have overlapping class at same time
// routineSchema.index({ teacher: 1, day: 1, startTime: 1, endTime: 1 });

// module.exports = mongoose.model("Routine", routineSchema);
