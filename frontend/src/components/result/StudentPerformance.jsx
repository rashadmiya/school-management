// components/results/StudentPerformance.jsx
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useGetClassPerformanceQuery } from "@/features/apis/resultsApi";
import { Award, TrendingUp, Trophy, Users } from "lucide-react";
import { useState } from "react";

const TERMS = ["Term 1", "Term 2", "Final"];
const CURRENT_YEAR = new Date().getFullYear();

export default function StudentPerformance({ classId, isDarkMode = false }) {
  const [selectedTerm, setSelectedTerm] = useState("Term 1");
  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR);

  const { data, isLoading } = useGetClassPerformanceQuery({
    classId,
    term: selectedTerm,
    year: selectedYear
  });

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
    selectContent: isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white",
    selectItem: isDarkMode ? "text-gray-300 hover:bg-gray-700" : "text-gray-900 hover:bg-gray-100",
    badge: {
      outline: isDarkMode ? "border-gray-700 text-gray-300" : "",
      default: isDarkMode ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "",
      secondary: isDarkMode ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" : "",
      destructive: isDarkMode ? "bg-red-500/20 text-red-400 border-red-500/30" : "",
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
    rank: {
      gold: isDarkMode ? "text-yellow-400" : "text-yellow-500",
      silver: isDarkMode ? "text-gray-400" : "text-gray-400",
      bronze: isDarkMode ? "text-orange-400" : "text-orange-500",
    },
    tableHeader: isDarkMode ? "bg-gray-800" : "bg-gray-50",
    tableRow: isDarkMode ? "border-gray-800 hover:bg-gray-800/50" : "border-gray-200 hover:bg-gray-50",
    progressBar: {
      bg: isDarkMode ? "bg-gray-700" : "bg-gray-200",
      high: "bg-emerald-500",
      medium: "bg-yellow-500",
      low: "bg-orange-500",
      veryLow: "bg-red-500",
    },
    textColor: {
      high: isDarkMode ? "text-emerald-400" : "text-green-600",
      medium: isDarkMode ? "text-yellow-400" : "text-yellow-600",
      low: isDarkMode ? "text-orange-400" : "text-orange-600",
      veryLow: isDarkMode ? "text-red-400" : "text-red-600",
    }
  };

  if (isLoading) {
    return (
      <Card className={isDarkMode ? "bg-gray-900/50 border-gray-800" : ""}>
        <CardContent className="p-6">
          <div className={`text-center ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
            Loading performance data...
          </div>
        </CardContent>
      </Card>
    );
  }

  const { performance, statistics } = data || {};

  const getPerformanceColor = (percentage) => {
    if (percentage >= 90) return theme.progressBar.high;
    if (percentage >= 75) return theme.progressBar.medium;
    if (percentage >= 50) return theme.progressBar.low;
    return theme.progressBar.veryLow;
  };

  const getPerformanceTextColor = (percentage) => {
    if (percentage >= 90) return theme.textColor.high;
    if (percentage >= 75) return theme.textColor.medium;
    if (percentage >= 50) return theme.textColor.low;
    return theme.textColor.veryLow;
  };

  const getRankIcon = (rank) => {
    if (rank === 1) return <Trophy className={`w-5 h-5 ${theme.rank.gold}`} />;
    if (rank === 2) return <Trophy className={`w-5 h-5 ${theme.rank.silver}`} />;
    if (rank === 3) return <Trophy className={`w-5 h-5 ${theme.rank.bronze}`} />;
    return null;
  };

  const getGradeBadgeVariant = (percentage) => {
    if (percentage >= 90) return "default";
    if (percentage >= 75) return "secondary";
    return "destructive";
  };

  const getGradeLabel = (percentage) => {
    if (percentage >= 90) return 'Excellent';
    if (percentage >= 75) return 'Good';
    if (percentage >= 50) return 'Average';
    return 'Needs Improvement';
  };

  const getGradeBadgeClass = (percentage) => {
    if (percentage >= 90) return theme.badge.default;
    if (percentage >= 75) return theme.badge.secondary;
    return theme.badge.destructive;
  };

  return (
    <div className="space-y-6">
      {/* Header and Filters */}
      <Card className={`${isDarkMode ? "bg-gray-900/50 border-gray-800" : "bg-white border-gray-200"} shadow-sm`}>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className={`flex items-center gap-2 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
              <TrendingUp className="w-5 h-5" />
              Class Performance - {data?.class?.name}
            </CardTitle>
            
            <div className="flex gap-4 flex-wrap">
              <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                <SelectTrigger className={`w-32 ${theme.select}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className={theme.selectContent}>
                  {TERMS.map((term) => (
                    <SelectItem key={term} value={term} className={theme.selectItem}>
                      {term}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                <SelectTrigger className={`w-24 ${theme.select}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className={theme.selectContent}>
                  {[CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2].map((year) => (
                    <SelectItem key={year} value={year.toString()} className={theme.selectItem}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        {/* Class Statistics */}
        {statistics && (
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className={`text-center p-4 rounded-lg border ${theme.stat.blue}`}>
                <Users className={`w-8 h-8 mx-auto mb-2 ${isDarkMode ? "text-blue-400" : "text-blue-600"}`} />
                <p className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                  {statistics.totalStudents}
                </p>
                <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                  Total Students
                </p>
              </div>
              
              <div className={`text-center p-4 rounded-lg border ${theme.stat.green}`}>
                <TrendingUp className={`w-8 h-8 mx-auto mb-2 ${isDarkMode ? "text-emerald-400" : "text-green-600"}`} />
                <p className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                  {statistics.classAverage.toFixed(1)}%
                </p>
                <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                  Class Average
                </p>
              </div>
              
              <div className={`text-center p-4 rounded-lg border ${theme.stat.purple}`}>
                <Award className={`w-8 h-8 mx-auto mb-2 ${isDarkMode ? "text-purple-400" : "text-purple-600"}`} />
                <p className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                  {statistics.subjects.length}
                </p>
                <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                  Subjects
                </p>
              </div>
              
              <div className={`text-center p-4 rounded-lg border ${theme.stat.orange}`}>
                <Trophy className={`w-8 h-8 mx-auto mb-2 ${isDarkMode ? "text-orange-400" : "text-orange-600"}`} />
                <p className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                  {statistics.topPerformer?.student.name.split(' ')[0] || '-'}
                </p>
                <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                  Top Performer
                </p>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Performance Table */}
      <Card className={`${isDarkMode ? "bg-gray-900/50 border-gray-800" : "bg-white border-gray-200"} shadow-sm overflow-hidden`}>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`border-b ${theme.tableHeader} ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
                  <th className={`text-left p-4 font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>Rank</th>
                  <th className={`text-left p-4 font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>Student</th>
                  <th className={`text-center p-4 font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>Exams</th>
                  <th className={`text-center p-4 font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>Total Marks</th>
                  <th className={`text-center p-4 font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>Average %</th>
                  <th className={`text-center p-4 font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>Grade</th>
                  <th className={`text-center p-4 font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>Performance</th>
                </tr>
              </thead>
              <tbody>
                {performance?.map((studentPerf) => (
                  <tr key={studentPerf.student._id} className={`border-b ${theme.tableRow}`}>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {studentPerf.rank <= 3 ? (
                          getRankIcon(studentPerf.rank)
                        ) : (
                          <div className="w-5 h-5 flex items-center justify-center">
                            <span className={`text-sm font-medium ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                              {studentPerf.rank}
                            </span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div>
                        <p className={`font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                          {studentPerf.student.name}
                        </p>
                        <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                          Roll: {studentPerf.student.rollNumber}
                        </p>
                      </div>
                    </td>
                    <td className="text-center p-4">
                      <Badge variant="outline" className={isDarkMode ? "border-gray-700 text-gray-300" : ""}>
                        {studentPerf.totalExams}
                      </Badge>
                    </td>
                    <td className={`text-center p-4 font-mono ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                      {studentPerf.totalMarks} / {studentPerf.totalPossible}
                    </td>
                    <td className="text-center p-4">
                      <div className="flex items-center justify-center gap-2">
                        <div className={`w-16 ${theme.progressBar.bg} rounded-full h-2`}>
                          <div 
                            className={`h-2 rounded-full ${getPerformanceColor(studentPerf.averagePercentage)}`}
                            style={{ width: `${Math.min(studentPerf.averagePercentage, 100)}%` }}
                          ></div>
                        </div>
                        <span className={`font-medium ${getPerformanceTextColor(studentPerf.averagePercentage)}`}>
                          {studentPerf.averagePercentage.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="text-center p-4">
                      <Badge 
                        variant={getGradeBadgeVariant(studentPerf.averagePercentage)}
                        className={getGradeBadgeClass(studentPerf.averagePercentage)}
                      >
                        {getGradeLabel(studentPerf.averagePercentage)}
                      </Badge>
                    </td>
                    <td className="text-center p-4">
                      <div className="flex flex-wrap gap-1 justify-center">
                        {Object.entries(studentPerf.subjectPerformance).slice(0, 3).map(([subject, perf]) => (
                          <Badge 
                            key={subject} 
                            variant="outline" 
                            className={`text-xs ${isDarkMode ? "border-gray-700 text-gray-300" : ""}`}
                          >
                            {subject}: {perf.percentage}%
                          </Badge>
                        ))}
                        {Object.keys(studentPerf.subjectPerformance).length > 3 && (
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${isDarkMode ? "border-gray-700 text-gray-300" : ""}`}
                          >
                            +{Object.keys(studentPerf.subjectPerformance).length - 3} more
                          </Badge>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}