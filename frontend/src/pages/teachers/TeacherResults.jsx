// components/teacher/TeacherResults.jsx
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { BarChart3, FileText, Plus, ArrowLeft, Users, TrendingUp } from "lucide-react";
import { useGetTeacherClassesQuery, useGetTeacherExamsQuery } from "@/features/apis/teachersApi";
import ResultEntryForm from "@/components/result/ResultEntryForm";
import ResultsList from "@/components/result/ResultList";
import StudentPerformance from "@/components/result/StudentPerformance";
import { Link, useSearchParams } from "react-router-dom";

export default function TeacherResults() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState("entry");
  const [selectedClassId, setSelectedClassId] = useState(searchParams.get("class") || "");
  const [resultFormOpen, setResultFormOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);

  const { data: classesData, isLoading: classesLoading } = useGetTeacherClassesQuery();
  const { data: examsData, isLoading: examsLoading } = useGetTeacherExamsQuery();
  // const { data: subjectsData } = useGetSubjectsQuery();

  const classes = classesData?.classes || [];
  const exams = examsData?.exams || [];
  // const subjects = subjectsData?.subjects || [];

  console.log("exam in teacher result page :", examsData)

  // If class is selected via URL parameter, use it
  React.useEffect(() => {
    const urlClassId = searchParams.get("class");
    if (urlClassId && classes.some(cls => cls._id === urlClassId)) {
      setSelectedClassId(urlClassId);
    }
  }, [searchParams, classes]);

  const selectedClass = classes.find(cls => cls._id === selectedClassId);

  // Get exams for selected class
  const classExams = exams.filter(exam =>
    exam.class?._id === selectedClassId || exam.class === selectedClassId
  );

  // Get subjects for selected class
  const classSubjects = selectedClass?.subjects || [];

  if (classesLoading || examsLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading your data...</div>
        </CardContent>
      </Card>
    );
  }

  // If no class is selected, show class selection
  if (!selectedClassId && classes.length > 0) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Results Management</h1>
          <p className="text-gray-600 mt-2">Enter and manage exam results for your classes</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{classes.length}</p>
                  <p className="text-sm text-gray-600">Total Classes</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <FileText className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{exams.length}</p>
                  <p className="text-sm text-gray-600">Total Exams</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {exams.filter(e => new Date(e.date) < new Date()).length}
                  </p>
                  <p className="text-sm text-gray-600">Completed Exams</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {classes.reduce((total, cls) => total + (cls.students?.length || 0), 0)}
                  </p>
                  <p className="text-sm text-gray-600">Total Students</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Classes Grid */}
        <Card>
          <CardHeader>
            <CardTitle>Select a Class</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {classes.map((classItem) => {
                const classExamCount = exams.filter(exam =>
                  exam.class?._id === classItem._id || exam.class === classItem._id
                ).length;

                return (
                  <Card
                    key={classItem._id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setSelectedClassId(classItem._id)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Users className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          {/* <h3 className="font-semibold text-lg">{classItem.name}</h3> */}
                          <h3 className="font-semibold text-lg">
                            {classItem.name} {classItem.section ? `- ${classItem.section.name}` : ''}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {classItem.students?.length || 0} students
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {classExamCount} exams
                            </Badge>
                          </div>
                        </div>
                        <Plus className="w-5 h-5 text-gray-400" />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {classes.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p>No classes assigned to you yet.</p>
                <p className="text-sm">Contact administrator to get assigned to classes.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // If class is selected, show results management
  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center justify-between">
        <div className="flex gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedClassId("");
              setSearchParams({});
            }}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Classes
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Results - {selectedClass?.name} - {selectedClass?.section?.name || ""}</h1>
            <p className="text-gray-600 mt-2">
              Managing results for {selectedClass?.students?.length || 0} students
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-blue-100 text-blue-800">
            {selectedClass?.students?.length || 0} Students
          </Badge>
          <Badge variant="outline">
            {classExams.length} Exams
          </Badge>
          <Badge variant="outline">
            {classSubjects.length} Subjects
          </Badge>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="entry" className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Enter Results
          </TabsTrigger>
          <TabsTrigger value="view" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            View Results
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Performance
          </TabsTrigger>
        </TabsList>

        {/* Enter Results Tab */}
        <TabsContent value="entry" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Available Exams</CardTitle>
            </CardHeader>
            <CardContent>
              {classExams.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p>No exams found for this class.</p>
                  <p className="text-sm">Schedule exams first to enter results.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {classExams.map((exam) => {
                    const examDate = new Date(exam.date);
                    const isCompleted = examDate < new Date();
                    const isToday = examDate.toDateString() === new Date().toDateString();

                    return (
                      <Card key={exam._id} className={`${!isCompleted ? 'opacity-75' : ''}`}>
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            <div className="flex justify-between items-start">
                              <h3 className="font-semibold">{exam.title}</h3>
                              <Badge
                                variant={
                                  isToday ? "default" : isCompleted ? "secondary" : "outline"
                                }
                                className={
                                  isToday
                                    ? "bg-green-100 text-green-800"
                                    : isCompleted
                                      ? "bg-gray-100 text-gray-800"
                                      : "bg-blue-100 text-blue-800"
                                }
                              >
                                {isToday ? "Today" : isCompleted ? "Completed" : "Upcoming"}
                              </Badge>
                            </div>

                            <div className="text-sm text-gray-600">
                              <div>Subject: {exam.subject?.name}</div>
                              <div>Date: {examDate.toLocaleDateString()}</div>
                              <div>Marks: {exam.totalMarks}</div>
                            </div>

                            <Button
                              onClick={() => {
                                setSelectedExam(exam);
                                setResultFormOpen(true);
                              }}
                              disabled={!isCompleted}
                              className="w-full"
                              variant={isCompleted ? "default" : "outline"}
                            >
                              {isCompleted ? "Enter Results" : "Not Completed"}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* View Results Tab */}
        <TabsContent value="view" className="space-y-6">
          <ResultsList
            classes={[selectedClass]}
            subjects={classSubjects}
            exams={classExams}
            showFilters={true}
          />
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <StudentPerformance classId={selectedClassId} />
        </TabsContent>
      </Tabs>

      {/* Result Entry Form Dialog */}
      <ResultEntryForm
        open={resultFormOpen}
        onOpenChange={setResultFormOpen}
        exam={selectedExam}
        class={selectedClass}
        students={selectedClass?.students || []}
      />

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap">
            <Button
              variant="outline"
              onClick={() => setActiveTab("entry")}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Enter New Results
            </Button>
            <Button
              variant="outline"
              onClick={() => setActiveTab("view")}
              className="flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              View All Results
            </Button>
            <Button
              variant="outline"
              onClick={() => setActiveTab("performance")}
              className="flex items-center gap-2"
            >
              <TrendingUp className="w-4 h-4" />
              Performance Analysis
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Generate Reports
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}