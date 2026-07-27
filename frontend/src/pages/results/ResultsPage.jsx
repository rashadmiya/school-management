// pages/ResultsPage.jsx
import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import ResultsList from "@/components/results/ResultsList";
import StudentPerformance from "@/components/result/StudentPerformance";
import ResultEntryForm from "@/components/result/ResultEntryForm";
import { useGetClassesQuery } from "@/features/apis/classesApi";
import { useGetSubjectsQuery } from "@/features/apis/subjectsApi";
import { useGetExamsQuery } from "@/features/apis/examsApi";
import { useGetResultsStatsQuery } from "@/features/apis/resultsApi";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart3, Trophy, Users, Award } from "lucide-react";
import ResultsList from "@/components/result/ResultList";

export default function ResultsPage() {
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedExam, setSelectedExam] = useState(null);
  const [isEntryFormOpen, setIsEntryFormOpen] = useState(false);

  const { data: classesData } = useGetClassesQuery();
  const { data: subjectsData } = useGetSubjectsQuery();
  const { data: examsData } = useGetExamsQuery({ status: 'completed' });
  const { data: statsData } = useGetResultsStatsQuery();

  const classes = classesData?.classes || classesData?.docs || [];
  const subjects = subjectsData?.subjects || subjectsData?.docs || [];
  const exams = examsData?.exams || [];
  const stats = statsData?.statistics;
  // Get students for selected class
  const students = selectedClass?.students || [];

  useEffect(() => {
    if (classes.length > 0 && !selectedClass) {
      setSelectedClass(classes[0]);
    }
  }, [classes, selectedClass]);

  const handleOpenEntryForm = (exam) => {
    setSelectedExam(exam);
    setIsEntryFormOpen(true);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Results Management</h1>
          <p className="text-gray-600 mt-2">
            Manage student results, track performance, and generate reports
          </p>
        </div>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.totalResults}</p>
                  <p className="text-sm text-gray-600">Total Results</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.totalStudents}</p>
                  <p className="text-sm text-gray-600">Students</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Award className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.totalSubjects}</p>
                  <p className="text-sm text-gray-600">Subjects</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <Trophy className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.performance?.excellent}</p>
                  <p className="text-sm text-gray-600">Excellent (A+)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Class Selector */}
      {classes.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <label className="text-sm font-medium min-w-20">Select Class:</label>
              <select
                className="border rounded-md px-3 py-2 flex-1"
                value={selectedClass?._id || ""}
                onChange={(e) => setSelectedClass(classes.find(c => c._id === e.target.value))}
              >
                {classes.map(classItem => (
                  <option key={classItem._id} value={classItem._id}>
                    {classItem.name} - {classItem?.section?.name || ""} ({classItem.students?.length || 0} students)
                  </option>
                ))}
              </select>

              {/* Quick Exam Actions */}
              {exams.length > 0 && (
                <div className="flex gap-2">
                  <select
                    className="border rounded-md px-3 py-2"
                    value={selectedExam?._id || ""}
                    // onChange={(e) => setSelectedExam(exams.find(e => e._id === e.target.value))}
                    onChange={(e) =>setSelectedExam(exams.find(exam => exam._id === e.target.value))
}
                  >
                    <option value="">Select Exam to Enter Results</option>
                    {exams.map(exam => (
                      <option key={exam._id} value={exam._id}>
                        {exam.title} - {exam.class?.name}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={() => selectedExam && handleOpenEntryForm(selectedExam)}
                    disabled={!selectedExam}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                  >
                    Enter Results
                  </button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="all" className="space-y-6">
        <TabsList>
          <TabsTrigger value="all">All Results</TabsTrigger>
          <TabsTrigger value="performance" disabled={!selectedClass}>
            Class Performance
          </TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <ResultsList
            classes={classes}
            subjects={subjects}
            exams={exams}
            showFilters={true}
          />
        </TabsContent>

        <TabsContent value="performance">
          {selectedClass ? (
            <StudentPerformance classId={selectedClass._id} />
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Please select a class to view performance</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="reports">
          <Card>
            <CardContent className="p-6">
              <div className="text-center text-gray-500">
                <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p>Reports and transcript generation coming soon...</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardContent className="p-6">
              <div className="text-center text-gray-500">
                <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p>Advanced analytics and insights coming soon...</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Result Entry Form */}
      {selectedClass && selectedExam && (
        <ResultEntryForm
          open={isEntryFormOpen}
          onOpenChange={setIsEntryFormOpen}
          exam={selectedExam}
          class={selectedClass}
          students={students}
        />
      )}
    </div>
  );
}