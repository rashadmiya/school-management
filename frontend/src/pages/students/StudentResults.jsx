// components/student/StudentResults.jsx
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, TrendingUp, Award, Download, BarChart3 } from "lucide-react";
import { useGetStudentResultsQuery } from "@/features/apis/studentsApi";
import { format } from "date-fns";

const TERMS = ["Term 1", "Term 2", "Final"];
const CURRENT_YEAR = new Date().getFullYear();

export default function StudentResults() {
  const [selectedTerm, setSelectedTerm] = useState("Term 1");
  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR);
  const [activeTab, setActiveTab] = useState("results");

  const { data, isLoading } = useGetStudentResultsQuery({
    term: selectedTerm,
    year: selectedYear
  });

  const results = data?.results || [];
  const statistics = data?.statistics || {};
  const termResults = data?.termResults || {};

  const calculatePercentage = (marksObtained, totalMarks) => {
    return totalMarks > 0 ? (marksObtained / totalMarks) * 100 : 0;
  };

  const getGrade = (percentage) => {
    if (percentage >= 90) return { grade: 'A+', color: 'bg-green-100 text-green-800', points: 4.0 };
    if (percentage >= 80) return { grade: 'A', color: 'bg-green-100 text-green-800', points: 3.7 };
    if (percentage >= 70) return { grade: 'B', color: 'bg-blue-100 text-blue-800', points: 3.3 };
    if (percentage >= 60) return { grade: 'C', color: 'bg-yellow-100 text-yellow-800', points: 2.7 };
    if (percentage >= 50) return { grade: 'D', color: 'bg-orange-100 text-orange-800', points: 2.0 };
    return { grade: 'F', color: 'bg-red-100 text-red-800', points: 0.0 };
  };

  const getPerformanceStatus = (percentage) => {
    if (percentage >= 80) return { status: 'Excellent', color: 'text-green-600' };
    if (percentage >= 70) return { status: 'Good', color: 'text-blue-600' };
    if (percentage >= 60) return { status: 'Average', color: 'text-yellow-600' };
    if (percentage >= 50) return { status: 'Below Average', color: 'text-orange-600' };
    return { status: 'Needs Improvement', color: 'text-red-600' };
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading results...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">My Results</h1>
          <p className="text-gray-600 mt-2">View your academic performance and progress</p>
        </div>
        <Button className="flex items-center gap-2">
          <Download className="w-4 h-4" />
          Download Report
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{statistics.totalExams || 0}</p>
                <p className="text-sm text-gray-600">Total Exams</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{statistics.averageMarks?.toFixed(1) || 0}</p>
                <p className="text-sm text-gray-600">Average Marks</p>
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
                <p className="text-2xl font-bold">
                  {results.length > 0 
                    ? getGrade(statistics.averageMarks || 0).grade 
                    : '-'
                  }
                </p>
                <p className="text-sm text-gray-600">Current Grade</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 rounded-lg">
                <BarChart3 className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {getPerformanceStatus(statistics.averageMarks || 0).status}
                </p>
                <p className="text-sm text-gray-600">Performance</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
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

              <Select 
                value={selectedYear.toString()} 
                onValueChange={(value) => setSelectedYear(parseInt(value))}
              >
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[CURRENT_YEAR, CURRENT_YEAR - 1].map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="text-sm text-gray-600">
              Showing results for {selectedTerm} {selectedYear}
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="results">Exam Results</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="summary">Term Summary</TabsTrigger>
        </TabsList>

        {/* Exam Results Tab */}
        <TabsContent value="results" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              {results.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-lg">No results found</p>
                  <p className="text-sm">Results will appear here once they are published</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Exam</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Marks</TableHead>
                      <TableHead>Percentage</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.map((result) => {
                      const percentage = calculatePercentage(
                        result.marksObtained, 
                        result.exam.totalMarks
                      );
                      const grade = getGrade(percentage);
                      const performance = getPerformanceStatus(percentage);

                      return (
                        <TableRow key={result._id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{result.exam.title}</p>
                              <p className="text-sm text-gray-500">
                                Total: {result.exam.totalMarks} marks
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {result.subject.name}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {format(new Date(result.exam.date), 'MMM dd, yyyy')}
                          </TableCell>
                          <TableCell>
                            <div className="font-mono font-medium">
                              {result.marksObtained} / {result.exam.totalMarks}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">
                              {percentage.toFixed(1)}%
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={grade.color}>
                              {grade.grade}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={performance.color.replace('text', 'bg')}>
                              {performance.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Subject-wise Performance</CardTitle>
            </CardHeader>
            <CardContent>
              {results.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No performance data available
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Group results by subject */}
                  {Object.entries(
                    results.reduce((acc, result) => {
                      const subjectName = result.subject.name;
                      if (!acc[subjectName]) {
                        acc[subjectName] = [];
                      }
                      acc[subjectName].push(result);
                      return acc;
                    }, {})
                  ).map(([subject, subjectResults]) => {
                    const totalMarks = subjectResults.reduce((sum, result) => 
                      sum + result.marksObtained, 0
                    );
                    const totalPossible = subjectResults.reduce((sum, result) => 
                      sum + result.exam.totalMarks, 0
                    );
                    const averagePercentage = (totalMarks / totalPossible) * 100;
                    const grade = getGrade(averagePercentage);

                    return (
                      <div key={subject} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-semibold">{subject}</h4>
                          <p className="text-sm text-gray-500">
                            {subjectResults.length} exam(s) taken
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <p className="font-mono font-medium">
                                {totalMarks} / {totalPossible}
                              </p>
                              <p className="text-sm text-gray-500">
                                {averagePercentage.toFixed(1)}% average
                              </p>
                            </div>
                            <Badge variant="outline" className={grade.color}>
                              {grade.grade}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Term Summary Tab */}
        <TabsContent value="summary" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Academic Summary - {selectedTerm} {selectedYear}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Overall Performance */}
                <div className="text-center p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                  <h3 className="text-2xl font-bold mb-2">Overall Performance</h3>
                  <div className="text-4xl font-bold text-blue-600 mb-2">
                    {statistics.averageMarks?.toFixed(1) || 0}%
                  </div>
                  <Badge variant="outline" className={
                    getGrade(statistics.averageMarks || 0).color
                  }>
                    {getGrade(statistics.averageMarks || 0).grade}
                  </Badge>
                  <p className="text-sm text-gray-600 mt-2">
                    {getPerformanceStatus(statistics.averageMarks || 0).status}
                  </p>
                </div>

                {/* Progress Chart Placeholder */}
                <div className="p-6 border rounded-lg">
                  <h4 className="font-semibold mb-4">Performance Trend</h4>
                  <div className="text-center py-8 text-gray-500">
                    <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p>Performance chart will be displayed here</p>
                  </div>
                </div>

                {/* Recommendations */}
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h4 className="font-semibold text-yellow-800 mb-2">Study Recommendations</h4>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    <li>• Focus on improving weaker subjects</li>
                    <li>• Practice past exam papers regularly</li>
                    <li>• Seek help from teachers for difficult topics</li>
                    <li>• Maintain consistent study schedule</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}