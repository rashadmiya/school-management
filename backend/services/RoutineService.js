// services/routineService.js
const updateTeacherSubjectsAndClasses = async (teacherId, subjectId, classId) => {
  try {
    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      throw new Error('Teacher not found');
    }

    const updates = {
      subjectAdded: false,
      classAdded: false
    };

    // Add subject if not already present
    if (!teacher.subjects.includes(subjectId)) {
      teacher.subjects.push(subjectId);
      updates.subjectAdded = true;
    }

    // Add class if not already present
    if (!teacher.classes.includes(classId)) {
      teacher.classes.push(classId);
      updates.classAdded = true;
    }

    if (updates.subjectAdded || updates.classAdded) {
      await teacher.save();
    }

    return updates;
  } catch (error) {
    console.error('Error updating teacher:', error);
    throw error;
  }
};

const updateClassSubjects = async (classId, subjectId) => {
  try {
    const classDoc = await Class.findById(classId);
    if (!classDoc) {
      throw new Error('Class not found');
    }

    if (!classDoc.subjects.includes(subjectId)) {
      classDoc.subjects.push(subjectId);
      await classDoc.save();
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error updating class:', error);
    throw error;
  }
};

const updateSubjectClasses = async (subjectId, classId) => {
  try {
    const subjectDoc = await Subject.findById(subjectId);
    if (!subjectDoc) {
      throw new Error('Subject not found');
    }

    if (!subjectDoc.classes.includes(classId)) {
      subjectDoc.classes.push(classId);
      await subjectDoc.save();
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error updating subject:', error);
    throw error;
  }
};

const removeSubjectFromTeacher = async (teacherId, subjectId) => {
  try {
    const teacher = await Teacher.findById(teacherId);
    if (!teacher) return false;

    // Check if this subject is used in any other routine
    const otherRoutines = await Routine.find({
      teacher: teacherId,
      subject: subjectId,
      _id: { $ne: null } // Exclude current routine (handled separately)
    });

    if (otherRoutines.length === 0) {
      teacher.subjects = teacher.subjects.filter(
        id => id.toString() !== subjectId.toString()
      );
      await teacher.save();
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error removing subject from teacher:', error);
    throw error;
  }
};

/**
 * Remove class from teacher's classes array
 */
const removeClassFromTeacher = async (teacherId, classId) => {
  try {
    const teacher = await Teacher.findById(teacherId);
    if (!teacher) return false;

    // Check if this class is used in any other routine
    const otherRoutines = await Routine.find({
      teacher: teacherId,
      class: classId,
      _id: { $ne: null }
    });

    if (otherRoutines.length === 0) {
      teacher.classes = teacher.classes.filter(
        id => id.toString() !== classId.toString()
      );
      await teacher.save();
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error removing class from teacher:', error);
    throw error;
  }
};

/**
 * Remove subject from class's subjects array
 */
const removeSubjectFromClass = async (classId, subjectId) => {
  try {
    const classDoc = await Class.findById(classId);
    if (!classDoc) return false;

    // Check if this subject is used in any other routine
    const otherRoutines = await Routine.find({
      class: classId,
      subject: subjectId,
      _id: { $ne: null }
    });

    if (otherRoutines.length === 0) {
      classDoc.subjects = classDoc.subjects.filter(
        id => id.toString() !== subjectId.toString()
      );
      await classDoc.save();
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error removing subject from class:', error);
    throw error;
  }
};

/**
 * Remove class from subject's classes array
 */
const removeClassFromSubject = async (subjectId, classId) => {
  try {
    const subjectDoc = await Subject.findById(subjectId);
    if (!subjectDoc) return false;

    // Check if this class is used in any other routine
    const otherRoutines = await Routine.find({
      subject: subjectId,
      class: classId,
      _id: { $ne: null }
    });

    if (otherRoutines.length === 0) {
      subjectDoc.classes = subjectDoc.classes.filter(
        id => id.toString() !== classId.toString()
      );
      await subjectDoc.save();
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error removing class from subject:', error);
    throw error;
  }
};

module.exports = {
  updateTeacherSubjectsAndClasses,
  updateClassSubjects,
  updateSubjectClasses,
  removeClassFromSubject,
  removeClassFromTeacher,
  removeSubjectFromClass,
  removeSubjectFromTeacher
};