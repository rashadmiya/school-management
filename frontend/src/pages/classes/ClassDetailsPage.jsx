// pages/ClassDetailsPage.jsx
import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Users,
  BookOpen,
  User,
  Calendar,
  Mail,
  Phone,
  GraduationCap,
  PieChart,
  BarChart3,
  Download,
  Share2,
  Edit,
  Plus
} from "lucide-react";
import {
  useGetClassQuery,
  useGetClassStatsQuery,
  useAddStudentToClassMutation,
  useAddSubjectToClassMutation,
  useRemoveSubjectFromClassMutation
} from "@/features/apis/classesApi";
import { useGetStudentsQuery } from "@/features/apis/studentsApi";
import { useGetSubjectsQuery } from "@/features/apis/subjectsApi";
import TodaysRoutine from "@/components/routine/TodaysRoutine";
import { toast } from "react-toastify";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import StudentDialogForm from "@/components/student/StudentDialogForm";

export default function ClassDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [addStudentDialogOpen, setAddStudentDialogOpen] = useState(false);
  const [addSubjectDialogOpen, setAddSubjectDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");

  const { data, isLoading, refetch } = useGetClassQuery(id);
  const { data: statsData } = useGetClassStatsQuery(id);
  const { data: studentsData } = useGetStudentsQuery();
  const { data: subjectsData } = useGetSubjectsQuery();

  const [addStudentToClass] = useAddStudentToClassMutation();
  const [addSubjectToClass] = useAddSubjectToClassMutation();
  const [removeSubjectFromClass] = useRemoveSubjectFromClassMutation();

  const classData = data?.class;
  const stats = statsData?.stats;
  const allStudents = studentsData?.students || studentsData?.docs || [];
  const allSubjects = subjectsData?.subjects || subjectsData?.docs || [];

  // Filter students not already in this class
  const availableStudents = allStudents.filter(student =>
    !classData?.students?.some(s => s._id === student._id)
  );

  // Filter subjects not already assigned to this class
  const availableSubjects = allSubjects.filter(subject =>
    !classData?.subjects?.some(s => s._id === subject._id)
  );

  const handleAddStudent = async () => {
    if (!selectedStudent) {
      toast.error("Please select a student");
      return;
    }

    try {
      await addStudentToClass({ id, studentId: selectedStudent }).unwrap();
      toast.success("Student added to class successfully");
      setSelectedStudent("");
      setAddStudentDialogOpen(false);
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || "Failed to add student");
    }
  };

  const handleAddSubject = async () => {
    if (!selectedSubject) {
      toast.error("Please select a subject");
      return;
    }

    try {
      await addSubjectToClass({ id, subjectId: selectedSubject }).unwrap();
      toast.success("Subject added to class successfully");
      setSelectedSubject("");
      setAddSubjectDialogOpen(false);
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || "Failed to add subject");
    }
  };

  const handleRemoveSubject = async (subjectId) => {
    if (!confirm("Are you sure you want to remove this subject from the class?")) return;

    try {
      await removeSubjectFromClass({ id, subjectId }).unwrap();
      toast.success("Subject removed from class");
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || "Failed to remove subject");
    }
  };

  const handleStudentDialogOpenChange = (open) => {
    setAddStudentDialogOpen(open);
  };

  const handleSaved = () => {
    setAddStudentDialogOpen(false);
    refetch();
    toast.success("Student added successfully");
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading class details...</div>
      </div>
    );
  }

  if (!classData) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Class not found</div>
        <Button onClick={() => navigate("/admin/classes")} className="mt-4">
          Back to Classes
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-start gap-4">
          <Button variant="outline" onClick={() => navigate("/admin/classes")} className="shrink-0">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex flex-wrap items-baseline gap-2">
              <span>Class {classData.name}</span>
              {classData?.section?.name && (
                <Badge variant="secondary" className="text-lg font-normal">
                  Section: {classData.section.name}
                </Badge>
              )}
            </h1>
            <div className="flex flex-wrap items-center gap-3 mt-2">
              <div className="flex items-center gap-1 text-gray-600">
                <Calendar className="w-4 h-4" />
                <span className="font-medium">{classData.academicYear || 'N/A'}</span>
              </div>
              {classData.supervisor && (
                <div className="flex items-center gap-1 text-gray-600">
                  <User className="w-4 h-4" />
                  <span>Supervisor: {classData.supervisor.user?.name}</span>
                </div>
              )}
              <Badge variant={classData.students?.length > 0 ? "default" : "outline"}>
                {classData.students?.length || 0} students
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="flex items-center gap-2">
            <Share2 className="w-4 h-4" />
            Share
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Button onClick={() => navigate(`/admin/classes/edit/${id}`)} className="flex items-center gap-2">
            <Edit className="w-4 h-4" />
            Edit Class
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Students</p>
                <p className="text-2xl font-bold mt-1">{stats?.totalStudents || 0}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            {stats?.genderDistribution && (
              <div className="mt-3 text-xs text-gray-600">
                <div className="flex justify-between">
                  <span>Male: {stats.genderDistribution.male}</span>
                  <span>Female: {stats.genderDistribution.female}</span>
                  {stats.genderDistribution.other > 0 && (
                    <span>Other: {stats.genderDistribution.other}</span>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Subjects</p>
                <p className="text-2xl font-bold mt-1">{stats?.totalSubjects || 0}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <BookOpen className="w-6 h-6 text-green-600" />
              </div>
            </div>
            {classData.subjects?.length > 0 && (
              <p className="mt-3 text-xs text-gray-600 truncate">
                {classData.subjects.slice(0, 3).map(s => s.name).join(', ')}
                {classData.subjects.length > 3 && '...'}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Attendance Rate</p>
                <p className="text-2xl font-bold mt-1">92%</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <PieChart className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <p className="mt-3 text-xs text-gray-600">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average Score</p>
                <p className="text-2xl font-bold mt-1">84%</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <BarChart3 className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <p className="mt-3 text-xs text-gray-600">Last term</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="students">
            Students ({classData.students?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="subjects">
            Subjects ({classData.subjects?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="routine">Today's Routine</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Supervisor Info */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5" />
                  Class Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Class Name</p>
                    <p className="font-medium">{classData.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Section</p>
                    <p className="font-medium">{classData.section?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Academic Year</p>
                    <p className="font-medium">{classData.academicYear}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Class ID</p>
                    <p className="font-mono text-sm">{classData._id?.slice(-8)}</p>
                  </div>
                </div>

                {classData.supervisor && (
                  <div className="border-t pt-4">
                    <p className="text-sm font-medium text-gray-600 mb-2">Class Supervisor</p>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{classData.supervisor.user?.name}</p>
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                          {classData.supervisor.user?.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {classData.supervisor.user.email}
                            </span>
                          )}
                          {classData.supervisor.user?.phoneNumber && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {classData.supervisor.user.phoneNumber}
                            </span>
                          )}
                        </div>
                        {classData.supervisor.designation && (
                          <Badge variant="outline" className="mt-1">
                            {classData.supervisor.designation}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Add Student Dialog */}
                {/* <Dialog open={addStudentDialogOpen} onOpenChange={setAddStudentDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Student
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Student to Class</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">Select Student</label>
                        <Select value={selectedStudent}
                          onValueChange={(value) => setSelectedStudent(value == "none" ? undefined : value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose a student" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableStudents.map(student => (
                              <SelectItem key={student._id} value={student._id}>
                                {student.name} (Roll: {student.rollNumber})
                              </SelectItem>
                            ))}
                            {availableStudents.length === 0 && (
                              <SelectItem value="none" disabled>No students available</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setAddStudentDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleAddStudent} disabled={!selectedStudent}>
                          Add Student
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog> */}

                {/* Add Subject Dialog */}
                <Dialog open={addSubjectDialogOpen} onOpenChange={setAddSubjectDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Subject
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Subject to Class</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">Select Subject</label>
                        <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose a subject" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableSubjects.map(subject => (
                              <SelectItem key={subject._id} value={subject._id}>
                                {subject.name} ({subject.code})
                              </SelectItem>
                            ))}
                            {availableSubjects.length === 0 && (
                              <SelectItem value="" disabled>No subjects available</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setAddSubjectDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleAddSubject} disabled={!selectedSubject}>
                          Add Subject
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => {
                    // setEditingStudent(null); // create mode
                    setAddStudentDialogOpen(true);
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Student
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Calendar className="w-4 h-4 mr-2" />
                  View Timetable
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <BookOpen className="w-4 h-4 mr-2" />
                  View Syllabus
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Users className="w-4 h-4 mr-2" />
                  View Parents
                </Button>
              </CardContent>
            </Card>

            {/* <StudentDialogForm
              open={addStudentDialogOpen}
              onOpenChange={handleStudentDialogOpenChange}
              initialData={null}
              onSaved={handleSaved}
              classes={classData ? [classData] : []}
            /> */}

          </div>
        </TabsContent>

        {/* Students Tab */}
        <TabsContent value="students">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Students in Class {classData.name}</CardTitle>
                <CardDescription>
                  {classData.students?.length || 0} students enrolled
                </CardDescription>
              </div>

              <div class="w-fit">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => {
                    // setEditingStudent(null); // create mode
                    setAddStudentDialogOpen(true);
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Student
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {classData.students?.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {classData.students.map((student) => (
                    <Card key={student._id} className="overflow-hidden">
                      <CardContent className="p-0">
                        <div className="flex items-center p-4">
                          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                            <User className="w-6 h-6 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">{student.name}</p>
                            <div className="flex items-center gap-3 text-sm text-gray-600 mt-1">
                              <span>Roll: {student.rollNumber}</span>
                              <Badge variant={student.gender === 'male' ? 'default' : 'secondary'} className="text-xs">
                                {student.gender}
                              </Badge>
                            </div>
                            {student.guardianContact && (
                              <p className="text-xs text-gray-500 mt-1">
                                Contact: {student.guardianContact}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 mx-auto text-gray-300" />
                  <p className="text-gray-500 mt-2">No students in this class yet</p>
                  <Button
                    onClick={() => setAddStudentDialogOpen(true)}
                    className="mt-4"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Student
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Subjects Tab */}
        <TabsContent value="subjects">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Subjects in Class {classData.name}</CardTitle>
                <CardDescription>
                  {classData.subjects?.length || 0} subjects assigned
                </CardDescription>
              </div>
              <Dialog open={addSubjectDialogOpen} onOpenChange={setAddSubjectDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Add Subject
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Subject to Class</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Select Subject</label>
                      <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a subject" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableSubjects.map(subject => (
                            <SelectItem key={subject._id} value={subject._id}>
                              {subject.name} ({subject.code})
                            </SelectItem>
                          ))}
                          {availableSubjects.length === 0 && (
                            <SelectItem value="" disabled>No subjects available</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setAddSubjectDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleAddSubject} disabled={!selectedSubject}>
                        Add Subject
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {classData.subjects?.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {classData.subjects.map((subject) => (
                    <Card key={subject._id} className="relative">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{subject.name}</p>
                            <p className="text-sm text-gray-600">Code: {subject.code}</p>
                            {subject.description && (
                              <p className="text-sm text-gray-500 mt-2">{subject.description}</p>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveSubject(subject._id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            Remove
                          </Button>
                        </div>
                        {subject.classes && subject.classes.length > 0 && (
                          <div className="mt-3 pt-3 border-t">
                            <p className="text-xs font-medium text-gray-600">Also taught in:</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {subject.classes.slice(0, 3).map((cls, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {cls.name}
                                </Badge>
                              ))}
                              {subject.classes.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{subject.classes.length - 3} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <BookOpen className="w-12 h-12 mx-auto text-gray-300" />
                  <p className="text-gray-500 mt-2">No subjects assigned to this class</p>
                  <Button
                    onClick={() => setAddSubjectDialogOpen(true)}
                    className="mt-4"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Subject
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Routine Tab */}
        <TabsContent value="routine">
          <TodaysRoutine classId={id} />
        </TabsContent>

        {/* Attendance Tab */}
        <TabsContent value="attendance">
          <Card>
            <CardHeader>
              <CardTitle>Attendance Overview</CardTitle>
              <CardDescription>
                View and manage student attendance for this class
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-4" />
                <p>Attendance module coming soon...</p>
                <p className="text-sm mt-2">Track daily attendance, view reports, and generate analytics</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Results Tab */}
        <TabsContent value="results">
          <Card>
            <CardHeader>
              <CardTitle>Exam Results</CardTitle>
              <CardDescription>
                View and manage exam results for this class
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <GraduationCap className="w-12 h-12 mx-auto mb-4" />
                <p>Results module coming soon...</p>
                <p className="text-sm mt-2">Enter exam marks, calculate grades, and generate report cards</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <StudentDialogForm
        open={addStudentDialogOpen}
        onOpenChange={handleStudentDialogOpenChange}
        initialData={null}
        onSaved={handleSaved}
        classes={classData ? [classData] : []}
      />
    </div>
  );
}

// // pages/ClassDetailsPage.jsx
// import React from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { ArrowLeft, Users, BookOpen, User, Calendar } from "lucide-react";
// import { useGetClassQuery, useGetClassStatsQuery } from "@/features/apis/classesApi";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import TodaysRoutine from "@/components/routine/TodaysRoutine";

// export default function ClassDetailsPage() {
//   const { id } = useParams();
//   const navigate = useNavigate();

//   const { data, isLoading } = useGetClassQuery(id);
//   const { data: statsData } = useGetClassStatsQuery(id);

//   if (isLoading) {
//     return (
//       <div className="container mx-auto p-6">
//         <div className="text-center">Loading class details...</div>
//       </div>
//     );
//   }

//   const classData = data?.class;
//   const stats = statsData?.stats;

//   if (!classData) {
//     return (
//       <div className="container mx-auto p-6">
//         <div className="text-center">Class not found</div>
//       </div>
//     );
//   }

//   return (
//     <div className="container mx-auto space-y-6">
//       {/* Header */}
//       <div className="flex gap-4">
//         <Button variant="outline" onClick={() => navigate("/admin/classes")}>
//           <ArrowLeft className="w-4 h-4 mr-2" />
//           Back to Classes
//         </Button>
//         <div>
//           <h1 className="text-3xl font-bold">
//             {classData?.name}
//             {classData?.section?.name ? ` - ${classData.section.name}` : ''}
//             <span className="text-lg font-normal text-gray-600 ml-2">
//               ({classData?.academicYear || 'N/A'})
//             </span>
//           </h1>
//           <p className="text-gray-600">Class details and management</p>
//         </div>
//       </div>

//       {/* Stats Cards */}
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//         <Card>
//           <CardContent className="p-6">
//             <div className="flex items-center gap-4">
//               <div className="p-3 bg-blue-100 rounded-lg">
//                 <Users className="w-6 h-6 text-blue-600" />
//               </div>
//               <div>
//                 <p className="text-sm font-medium text-gray-600">Total Students</p>
//                 <p className="text-2xl font-bold">{stats?.totalStudents || 0}</p>
//               </div>
//             </div>
//           </CardContent>
//         </Card>

//         <Card>
//           <CardContent className="p-6">
//             <div className="flex items-center gap-4">
//               <div className="p-3 bg-green-100 rounded-lg">
//                 <BookOpen className="w-6 h-6 text-green-600" />
//               </div>
//               <div>
//                 <p className="text-sm font-medium text-gray-600">Subjects</p>
//                 <p className="text-2xl font-bold">{stats?.totalSubjects || 0}</p>
//               </div>
//             </div>
//           </CardContent>
//         </Card>

//         <Card>
//           <CardContent className="p-6">
//             <div className="flex items-center gap-4">
//               <div className="p-3 bg-purple-100 rounded-lg">
//                 <User className="w-6 h-6 text-purple-600" />
//               </div>
//               <div>
//                 <p className="text-sm font-medium text-gray-600">Male Students</p>
//                 <p className="text-2xl font-bold">{stats?.maleStudents || 0}</p>
//               </div>
//             </div>
//           </CardContent>
//         </Card>

//         <Card>
//           <CardContent className="p-6">
//             <div className="flex items-center gap-4">
//               <div className="p-3 bg-pink-100 rounded-lg">
//                 <User className="w-6 h-6 text-pink-600" />
//               </div>
//               <div>
//                 <p className="text-sm font-medium text-gray-600">Female Students</p>
//                 <p className="text-2xl font-bold">{stats?.femaleStudents || 0}</p>
//               </div>
//             </div>
//           </CardContent>
//         </Card>
//       </div>

//       <Tabs defaultValue="overview" className="space-y-6">
//         <TabsList>
//           <TabsTrigger value="overview">Overview</TabsTrigger>
//           <TabsTrigger value="students">Students ({classData.students?.length || 0})</TabsTrigger>
//           <TabsTrigger value="subjects">Subjects ({classData.subjects?.length || 0})</TabsTrigger>
//           <TabsTrigger value="schedule">Today's Schedule</TabsTrigger>
//         </TabsList>

//         <TabsContent value="overview">
//           <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//             {/* Supervisor Info */}
//             <Card>
//               <CardHeader>
//                 <CardTitle className="flex items-center gap-2">
//                   <User className="w-5 h-5" />
//                   Class Supervisor
//                 </CardTitle>
//               </CardHeader>
//               <CardContent>
//                 {classData.supervisor ? (
//                   <div className="space-y-3">
//                     <div>
//                       <p className="font-medium">{classData.supervisor.name}</p>
//                       <p className="text-gray-600">{classData.supervisor.email}</p>
//                       {classData.supervisor.phoneNumber && (
//                         <p className="text-gray-600">{classData.supervisor.phoneNumber}</p>
//                       )}
//                     </div>
//                   </div>
//                 ) : (
//                   <p className="text-gray-500">No supervisor assigned</p>
//                 )}
//               </CardContent>
//             </Card>

//             {/* Quick Actions */}
//             <Card>
//               <CardHeader>
//                 <CardTitle>Quick Actions</CardTitle>
//               </CardHeader>
//               <CardContent className="space-y-3">
//                 <Button variant="outline" className="w-full justify-start">
//                   <Users className="w-4 h-4 mr-2" />
//                   Manage Students
//                 </Button>
//                 <Button variant="outline" className="w-full justify-start">
//                   <BookOpen className="w-4 h-4 mr-2" />
//                   Manage Subjects
//                 </Button>
//                 <Button variant="outline" className="w-full justify-start">
//                   <Calendar className="w-4 h-4 mr-2" />
//                   View Full Timetable
//                 </Button>
//               </CardContent>
//             </Card>
//           </div>
//         </TabsContent>

//         <TabsContent value="students">
//           <Card>
//             <CardHeader>
//               <CardTitle>Students in {classData.name}</CardTitle>
//             </CardHeader>
//             <CardContent>
//               {classData.students?.length > 0 ? (
//                 <div className="space-y-3">
//                   {classData.students.map((student) => (
//                     <div key={student._id} className="flex items-center justify-between p-3 border rounded-lg">
//                       <div>
//                         <p className="font-medium">{student.name}</p>
//                         <p className="text-sm text-gray-600">Roll: {student.rollNumber}</p>
//                       </div>
//                       <Badge variant={student.gender === 'male' ? 'default' : 'secondary'}>
//                         {student.gender}
//                       </Badge>
//                     </div>
//                   ))}
//                 </div>
//               ) : (
//                 <p className="text-gray-500">No students in this class</p>
//               )}
//             </CardContent>
//           </Card>
//         </TabsContent>

//         <TabsContent value="subjects">
//           <Card>
//             <CardHeader>
//               <CardTitle>Subjects in {classData.name}</CardTitle>
//             </CardHeader>
//             <CardContent>
//               {classData.subjects?.length > 0 ? (
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                   {classData.subjects.map((subject) => (
//                     <div key={subject._id} className="p-4 border rounded-lg">
//                       <p className="font-medium">{subject.name}</p>
//                       <p className="text-sm text-gray-600">Code: {subject.code}</p>
//                       {subject.description && (
//                         <p className="text-sm text-gray-600 mt-1">{subject.description}</p>
//                       )}
//                     </div>
//                   ))}
//                 </div>
//               ) : (
//                 <p className="text-gray-500">No subjects assigned to this class</p>
//               )}
//             </CardContent>
//           </Card>
//         </TabsContent>

//         <TabsContent value="schedule">
//           <TodaysRoutine classId={id} />
//         </TabsContent>
//       </Tabs>
//     </div>
//   );
// }