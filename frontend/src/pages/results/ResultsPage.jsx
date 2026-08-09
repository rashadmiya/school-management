// pages/ResultsPage.jsx
import ResultEntryForm from "@/components/result/ResultEntryForm";
import ResultsList from "@/components/result/ResultList";
import StudentPerformance from "@/components/result/StudentPerformance";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGetClassesQuery } from "@/features/apis/classesApi";
import { useGetExamsQuery } from "@/features/apis/examsApi";
import { useGetResultsStatsQuery } from "@/features/apis/resultsApi";
import { useGetSubjectsQuery } from "@/features/apis/subjectsApi";
import { useAppSelector } from "@/features/store";
import { Award, BarChart3, Trophy, Users } from "lucide-react";
import { useEffect, useState } from "react";

export default function ResultsPage() {
  const isDarkMode = useAppSelector((state) => state.global.isDarkMode);
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

  // Theme-based classes
  const theme = {
    textPrimary: isDarkMode ? "text-white" : "text-gray-900",
    textSecondary: isDarkMode ? "text-gray-300" : "text-gray-700",
    textMuted: isDarkMode ? "text-gray-400" : "text-gray-500",
    textLight: isDarkMode ? "text-gray-500" : "text-gray-400",
    border: isDarkMode ? "border-gray-700" : "border-gray-200",
    bgCard: isDarkMode ? "bg-gray-900/50" : "bg-white",
    bgHover: isDarkMode ? "hover:bg-gray-800/50" : "hover:bg-gray-50",
    bgInput: isDarkMode ? "bg-gray-800" : "bg-white",
    inputBorder: isDarkMode ? "border-gray-700" : "border-gray-200",
    select: isDarkMode 
      ? "bg-gray-800 border-gray-700 text-white" 
      : "bg-white border-gray-200 text-gray-900",
    option: isDarkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900",
    button: {
      primary: isDarkMode 
        ? "bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-700 disabled:text-gray-400" 
        : "bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-300 disabled:text-gray-500",
    },
    tabs: {
      list: isDarkMode ? "bg-gray-800" : "bg-gray-100",
      trigger: isDarkMode 
        ? "text-gray-400 data-[state=active]:bg-gray-700 data-[state=active]:text-white data-[state=active]:shadow-none" 
        : "text-gray-600 data-[state=active]:bg-white data-[state=active]:text-gray-900",
    },
    stat: {
      blue: isDarkMode 
        ? "bg-blue-500/10 border-blue-500/20 text-blue-400" 
        : "bg-blue-50 text-blue-600",
      green: isDarkMode 
        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
        : "bg-green-50 text-green-600",
      purple: isDarkMode 
        ? "bg-purple-500/10 border-purple-500/20 text-purple-400" 
        : "bg-purple-50 text-purple-600",
      orange: isDarkMode 
        ? "bg-orange-500/10 border-orange-500/20 text-orange-400" 
        : "bg-orange-50 text-orange-600",
    },
    cardIcon: {
      blue: isDarkMode ? "bg-blue-500/20 text-blue-400" : "bg-blue-100 text-blue-600",
      green: isDarkMode ? "bg-emerald-500/20 text-emerald-400" : "bg-green-100 text-green-600",
      purple: isDarkMode ? "bg-purple-500/20 text-purple-400" : "bg-purple-100 text-purple-600",
      orange: isDarkMode ? "bg-orange-500/20 text-orange-400" : "bg-orange-100 text-orange-600",
    },
    disabledButton: isDarkMode 
      ? "bg-gray-700 text-gray-400 cursor-not-allowed" 
      : "bg-gray-300 text-gray-500 cursor-not-allowed",
  };

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
    <div className={`container mx-auto p-6 space-y-6 ${isDarkMode ? "text-white" : ""}`}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className={`text-3xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
            Results Management
          </h1>
          <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
            Manage student results, track performance, and generate reports
          </p>
        </div>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className={`${isDarkMode ? "bg-gray-900/50 border-gray-800" : "bg-white border-gray-200"} shadow-sm`}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg border ${theme.cardIcon.blue}`}>
                  <BarChart3 className="w-6 h-6" />
                </div>
                <div>
                  <p className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                    {stats?.totalResults}
                  </p>
                  <p className={isDarkMode ? "text-sm text-gray-400" : "text-sm text-gray-600"}>
                    Total Results
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={`${isDarkMode ? "bg-gray-900/50 border-gray-800" : "bg-white border-gray-200"} shadow-sm`}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg border ${theme.cardIcon.green}`}>
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <p className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                    {stats?.totalStudents}
                  </p>
                  <p className={isDarkMode ? "text-sm text-gray-400" : "text-sm text-gray-600"}>
                    Students
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={`${isDarkMode ? "bg-gray-900/50 border-gray-800" : "bg-white border-gray-200"} shadow-sm`}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg border ${theme.cardIcon.purple}`}>
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <p className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                    {stats?.totalSubjects}
                  </p>
                  <p className={isDarkMode ? "text-sm text-gray-400" : "text-sm text-gray-600"}>
                    Subjects
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={`${isDarkMode ? "bg-gray-900/50 border-gray-800" : "bg-white border-gray-200"} shadow-sm`}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg border ${theme.cardIcon.orange}`}>
                  <Trophy className="w-6 h-6" />
                </div>
                <div>
                  <p className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                    {stats?.performance?.excellent}
                  </p>
                  <p className={isDarkMode ? "text-sm text-gray-400" : "text-sm text-gray-600"}>
                    Excellent (A+)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Class Selector */}
      {classes.length > 0 && (
        <Card className={`${isDarkMode ? "bg-gray-900/50 border-gray-800" : "bg-white border-gray-200"} shadow-sm`}>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <label className={`text-sm font-medium min-w-20 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                Select Class:
              </label>
              <select
                className={`border rounded-md px-3 py-2 flex-1 ${theme.select}`}
                value={selectedClass?._id || ""}
                onChange={(e) => setSelectedClass(classes.find(c => c._id === e.target.value))}
              >
                {classes.map(classItem => (
                  <option key={classItem._id} value={classItem._id} className={theme.option}>
                    {classItem.name} - {classItem?.section?.name || ""} ({classItem.students?.length || 0} students)
                  </option>
                ))}
              </select>

              {/* Quick Exam Actions */}
              {exams.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  <select
                    className={`border rounded-md px-3 py-2 ${theme.select}`}
                    value={selectedExam?._id || ""}
                    onChange={(e) => setSelectedExam(exams.find(exam => exam._id === e.target.value))}
                  >
                    <option value="" className={theme.option}>Select Exam to Enter Results</option>
                    {exams.map(exam => (
                      <option key={exam._id} value={exam._id} className={theme.option}>
                        {exam.title} - {exam.class?.name}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={() => selectedExam && handleOpenEntryForm(selectedExam)}
                    disabled={!selectedExam}
                    className={`px-4 py-2 rounded-md transition-colors ${
                      selectedExam ? theme.button.primary : theme.disabledButton
                    }`}
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
        <TabsList className={theme.tabs.list}>
          <TabsTrigger 
            value="all" 
            className={theme.tabs.trigger}
          >
            All Results
          </TabsTrigger>
          <TabsTrigger 
            value="performance" 
            className={theme.tabs.trigger}
            disabled={!selectedClass}
          >
            Class Performance
          </TabsTrigger>
          <TabsTrigger 
            value="reports" 
            className={theme.tabs.trigger}
          >
            Reports
          </TabsTrigger>
          <TabsTrigger 
            value="analytics" 
            className={theme.tabs.trigger}
          >
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <ResultsList
            classes={classes}
            subjects={subjects}
            exams={exams}
            showFilters={true}
            isDarkMode={isDarkMode}
          />
        </TabsContent>

        <TabsContent value="performance">
          {selectedClass ? (
            <StudentPerformance 
              classId={selectedClass._id} 
              isDarkMode={isDarkMode}
            />
          ) : (
            <Card className={`${isDarkMode ? "bg-gray-900/50 border-gray-800" : "bg-white border-gray-200"} shadow-sm`}>
              <CardContent className="p-6 text-center">
                <Users className={`w-12 h-12 ${isDarkMode ? "text-gray-600" : "text-gray-300"} mx-auto mb-4`} />
                <p className={isDarkMode ? "text-gray-400" : "text-gray-500"}>
                  Please select a class to view performance
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="reports">
          <Card className={`${isDarkMode ? "bg-gray-900/50 border-gray-800" : "bg-white border-gray-200"} shadow-sm`}>
            <CardContent className="p-6">
              <div className={`text-center ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                <BarChart3 className={`w-12 h-12 ${isDarkMode ? "text-gray-600" : "text-gray-300"} mx-auto mb-4`} />
                <p>Reports and transcript generation coming soon...</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card className={`${isDarkMode ? "bg-gray-900/50 border-gray-800" : "bg-white border-gray-200"} shadow-sm`}>
            <CardContent className="p-6">
              <div className={`text-center ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                <Trophy className={`w-12 h-12 ${isDarkMode ? "text-gray-600" : "text-gray-300"} mx-auto mb-4`} />
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
          isDarkMode={isDarkMode}
        />
      )}
    </div>
  );
}