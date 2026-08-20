// routes/publicRoutes.js
const express = require("express");
const router = express.Router();
const Page = require("../models/Page");
const Setting = require("../models/Setting");
const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
// NEW: Import directory models
const Stuff = require('../models/Stuff');
const SchoolManagementCommittee = require('../models/SchoolManagementCommittee');
const StudentCabinet = require('../models/StudentCabinet');
const Club = require('../models/Club');
const Section = require('../models/Section');

// 🎯 Get page by slug
router.get("/pages/:slug", catchAsyncErrors(async (req, res, next) => {
  try {
    const page = await Page.findOne({ 
      slug: req.params.slug,
      isPublished: true 
    });

    if (!page) {
      return next(new ErrorHandler("Page not found", 404));
    }

    res.status(200).json({
      success: true,
      page
    });

  } catch (error) {
    next(error);
  }
}));

// 🎯 Get all published pages (for navigation)
router.get("/pages", catchAsyncErrors(async (req, res, next) => {
  try {
    const pages = await Page.find({ 
      isPublished: true 
    })
    .select('title slug order')
    .sort({ order: 1, title: 1 });

    res.status(200).json({
      success: true,
      pages
    });

  } catch (error) {
    next(error);
  }
}));

// 🎯 Get public settings
router.get("/settings", catchAsyncErrors(async (req, res, next) => {
  try {
    const settings = await Setting.find({ 
      isPublic: true 
    }).select('key value type category');

    // Convert to object for easier access
    const settingsObj = {};
    settings.forEach(setting => {
      settingsObj[setting.key] = setting.value;
    });

    res.status(200).json({
      success: true,
      settings: settingsObj
    });

  } catch (error) {
    next(error);
  }
}));

// 🎯 Get school statistics
router.get("/statistics", catchAsyncErrors(async (req, res, next) => {
  try {
    const Student = require("../models/Student");
    const Teacher = require("../models/Teacher");
    const Class = require("../models/Class");

    const [
      totalStudents,
      totalTeachers,
      totalClasses,
      activeStudents
    ] = await Promise.all([
      Student.countDocuments(),
      Teacher.countDocuments(),
      Class.countDocuments(),
      Student.countDocuments({ isActive: true })
    ]);

    res.status(200).json({
      success: true,
      statistics: {
        totalStudents,
        totalTeachers,
        totalClasses,
        activeStudents,
        establishedYear: 2020 // This could be a setting
      }
    });

  } catch (error) {
    next(error);
  }
}));

// NEW: Directory public routes

// 🎯 Get active staff (public)
router.get('/staff', catchAsyncErrors(async (req, res, next) => {
  const { session = "" } = req.query;
  
  let filter = { isActive: true };
  if (session) filter.session = session;

  const staff = await Stuff.find(filter)
    .select('name designation session phoneNumber photo lastQualification joiningDate')
    .sort({ designation: 1, name: 1 });

  res.json({
    success: true,
    staff,
    count: staff.length
  });
}));

// 🎯 Get staff member details (public)
router.get('/staff/:id', catchAsyncErrors(async (req, res, next) => {
  const staff = await Stuff.findById(req.params.id)
    .select('name designation session dateOfBirth nationalIdNo lastQualification phoneNumber address religion photo joiningDate');

  if (!staff || !staff.isActive) {
    return res.status(404).json({
      success: false,
      message: 'Staff member not found'
    });
  }

  res.json({
    success: true,
    staff
  });
}));

// 🎯 Get active committee (public)
router.get('/committee', catchAsyncErrors(async (req, res, next) => {
  const { session = "" } = req.query;
  
  let filter = { isActive: true };
  if (session) filter.session = session;

  const committee = await SchoolManagementCommittee.find(filter)
    .select('name designation session phoneNumber photo order')
    .sort({ order: 1, designation: 1 });

  res.json({
    success: true,
    committee,
    count: committee.length
  });
}));

// 🎯 Get committee member details (public)
router.get('/committee/:id', catchAsyncErrors(async (req, res, next) => {
  const committee = await SchoolManagementCommittee.findById(req.params.id)
    .select('name designation session phoneNumber address religion photo order');

  if (!committee || !committee.isActive) {
    return res.status(404).json({
      success: false,
      message: 'Committee member not found'
    });
  }

  res.json({
    success: true,
    committee
  });
}));

// 🎯 Get active student cabinet (public)
router.get('/cabinet', catchAsyncErrors(async (req, res, next) => {
  const { session = "" } = req.query;
  
  let filter = { isActive: true };
  if (session) filter.session = session;

  const cabinet = await StudentCabinet.find(filter)
    .populate('class', 'name')
    .populate('section', 'name')
    .populate('student', 'name rollNumber')
    .select('name class section rollNumber designation session')
    .sort({ designation: 1 });

  res.json({
    success: true,
    cabinet,
    count: cabinet.length
  });
}));

// 🎯 Get cabinet member details (public)
router.get('/cabinet/:id', catchAsyncErrors(async (req, res, next) => {
  const cabinet = await StudentCabinet.findById(req.params.id)
    .populate('class', 'name')
    .populate('section', 'name')
    .populate('student', 'name rollNumber')
    .select('name class section rollNumber designation session');

  if (!cabinet || !cabinet.isActive) {
    return res.status(404).json({
      success: false,
      message: 'Cabinet member not found'
    });
  }

  res.json({
    success: true,
    cabinet
  });
}));

// 🎯 Get active clubs (public)
router.get('/clubs', catchAsyncErrors(async (req, res, next) => {
  const { session = "" } = req.query;
  
  let filter = { isActive: true };
  if (session) filter.session = session;

  const clubs = await Club.find(filter)
    .populate('supervisor', 'user')
    .populate({
      path: 'supervisor',
      populate: { path: 'user', select: 'name' }
    })
    .populate('members.student', 'name rollNumber')
    .select('clubName supervisor session description meetingSchedule members')
    .sort({ clubName: 1 });

  res.json({
    success: true,
    clubs,
    count: clubs.length
  });
}));

// 🎯 Get club details (public)
router.get('/clubs/:id', catchAsyncErrors(async (req, res, next) => {
  const club = await Club.findById(req.params.id)
    .populate('supervisor', 'user designation')
    .populate({
      path: 'supervisor',
      populate: { path: 'user', select: 'name email' }
    })
    .populate('members.student', 'name rollNumber class')
    .select('clubName supervisor session description meetingSchedule members');

  if (!club || !club.isActive) {
    return res.status(404).json({
      success: false,
      message: 'Club not found'
    });
  }

  res.json({
    success: true,
    club
  });
}));

// 🎯 Get active sections (public)
router.get('/sections', catchAsyncErrors(async (req, res, next) => {
  const sections = await Section.find({ isActive: true })
    .select('name capacity')
    .sort({ name: 1 });

  res.json({
    success: true,
    sections,
    count: sections.length
  });
}));

// 🎯 Get directory statistics (public)
router.get('/directory/stats', catchAsyncErrors(async (req, res, next) => {
  const [
    totalStaff,
    activeStaff,
    totalCommittee,
    activeCommittee,
    totalCabinet,
    activeCabinet,
    totalClubs,
    activeClubs,
    totalSections,
    activeSections
  ] = await Promise.all([
    Stuff.countDocuments(),
    Stuff.countDocuments({ isActive: true }),
    SchoolManagementCommittee.countDocuments(),
    SchoolManagementCommittee.countDocuments({ isActive: true }),
    StudentCabinet.countDocuments(),
    StudentCabinet.countDocuments({ isActive: true }),
    Club.countDocuments(),
    Club.countDocuments({ isActive: true }),
    Section.countDocuments(),
    Section.countDocuments({ isActive: true })
  ]);

  res.json({
    success: true,
    statistics: {
      staff: { total: totalStaff, active: activeStaff },
      committee: { total: totalCommittee, active: activeCommittee },
      cabinet: { total: totalCabinet, active: activeCabinet },
      clubs: { total: totalClubs, active: activeClubs },
      sections: { total: totalSections, active: activeSections }
    }
  });
}));

module.exports = router;