// components/results/StudentPerformance.jsx
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useGetClassPerformanceQuery } from "@/features/apis/resultsApi";
import { Trophy, TrendingUp, Users, Award } from "lucide-react";

const TERMS = ["Term 1", "Term 2", "Final"];
const CURRENT_YEAR = new Date().getFullYear();

export default function StudentPerformance({ classId }) {
  const [selectedTerm, setSelectedTerm] = useState("Term 1");
  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR);

  const { data, isLoading } = useGetClassPerformanceQuery({
    classId,
    term: selectedTerm,
    year: selectedYear
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading performance data...</div>
        </CardContent>
      </Card>
    );
  }

  const { performance, statistics } = data || {};

  return (
    <div className="space-y-6">
      {/* Header and Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Class Performance - {data?.class?.name}
            </CardTitle>
            
            <div className="flex gap-4">
              <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TERMS.map((term) => (
                    <SelectItem key={term} value={term}>
                      {term}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2].map((year) => (
                    <SelectItem key={year} value={year.toString()}>
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
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <p className="text-2xl font-bold">{statistics.totalStudents}</p>
                <p className="text-sm text-gray-600">Total Students</p>
              </div>
              
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <p className="text-2xl font-bold">{statistics.classAverage.toFixed(1)}%</p>
                <p className="text-sm text-gray-600">Class Average</p>
              </div>
              
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <Award className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <p className="text-2xl font-bold">{statistics.subjects.length}</p>
                <p className="text-sm text-gray-600">Subjects</p>
              </div>
              
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <Trophy className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                <p className="text-2xl font-bold">
                  {statistics.topPerformer?.student.name.split(' ')[0] || '-'}
                </p>
                <p className="text-sm text-gray-600">Top Performer</p>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Performance Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left p-4 font-medium">Rank</th>
                  <th className="text-left p-4 font-medium">Student</th>
                  <th className="text-center p-4 font-medium">Exams</th>
                  <th className="text-center p-4 font-medium">Total Marks</th>
                  <th className="text-center p-4 font-medium">Average %</th>
                  <th className="text-center p-4 font-medium">Grade</th>
                  <th className="text-center p-4 font-medium">Performance</th>
                </tr>
              </thead>
              <tbody>
                {performance?.map((studentPerf) => (
                  <tr key={studentPerf.student._id} className="border-b hover:bg-gray-50">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {studentPerf.rank <= 3 ? (
                          <Trophy className={`w-5 h-5 ${
                            studentPerf.rank === 1 ? 'text-yellow-500' :
                            studentPerf.rank === 2 ? 'text-gray-400' :
                            'text-orange-500'
                          }`} />
                        ) : (
                          <div className="w-5 h-5 flex items-center justify-center">
                            <span className="text-sm font-medium">{studentPerf.rank}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="font-medium">{studentPerf.student.name}</p>
                        <p className="text-sm text-gray-500">
                          Roll: {studentPerf.student.rollNumber}
                        </p>
                      </div>
                    </td>
                    <td className="text-center p-4">
                      <Badge variant="outline">
                        {studentPerf.totalExams}
                      </Badge>
                    </td>
                    <td className="text-center p-4 font-mono">
                      {studentPerf.totalMarks} / {studentPerf.totalPossible}
                    </td>
                    <td className="text-center p-4">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              studentPerf.averagePercentage >= 90 ? 'bg-green-500' :
                              studentPerf.averagePercentage >= 75 ? 'bg-yellow-500' :
                              studentPerf.averagePercentage >= 50 ? 'bg-orange-500' :
                              'bg-red-500'
                            }`}
                            style={{ width: `${Math.min(studentPerf.averagePercentage, 100)}%` }}
                          ></div>
                        </div>
                        <span className={`font-medium ${
                          studentPerf.averagePercentage >= 90 ? 'text-green-600' :
                          studentPerf.averagePercentage >= 75 ? 'text-yellow-600' :
                          studentPerf.averagePercentage >= 50 ? 'text-orange-600' :
                          'text-red-600'
                        }`}>
                          {studentPerf.averagePercentage.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="text-center p-4">
                      <Badge 
                        variant={
                          studentPerf.averagePercentage >= 90 ? "default" :
                          studentPerf.averagePercentage >= 75 ? "secondary" :
                          "destructive"
                        }
                      >
                        {studentPerf.averagePercentage >= 90 ? 'Excellent' :
                         studentPerf.averagePercentage >= 75 ? 'Good' :
                         studentPerf.averagePercentage >= 50 ? 'Average' :
                         'Needs Improvement'}
                      </Badge>
                    </td>
                    <td className="text-center p-4">
                      <div className="flex flex-wrap gap-1 justify-center">
                        {Object.entries(studentPerf.subjectPerformance).slice(0, 3).map(([subject, perf]) => (
                          <Badge key={subject} variant="outline" className="text-xs">
                            {subject}: {perf.percentage}%
                          </Badge>
                        ))}
                        {Object.keys(studentPerf.subjectPerformance).length > 3 && (
                          <Badge variant="outline" className="text-xs">
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