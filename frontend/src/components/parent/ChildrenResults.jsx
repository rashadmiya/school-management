// components/parent/ChildrenResults.jsx
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen, TrendingUp, Award, Download, BarChart3 } from "lucide-react";
import { useGetChildrenResultsQuery, useGetParentChildrenQuery } from "@/features/apis/parentsApi";
import { format } from "date-fns";
import { useSearchParams } from "react-router-dom";

const TERMS = ["Term 1", "Term 2", "Final"];
const CURRENT_YEAR = new Date().getFullYear();

export default function ChildrenResults() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedTerm, setSelectedTerm] = useState("Term 1");
  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR);
  const [selectedChild, setSelectedChild] = useState(searchParams.get("child") || "");
  const [activeTab, setActiveTab] = useState("results");

  const { data: childrenData } = useGetParentChildrenQuery();
  const { data: resultsData, isLoading } = useGetChildrenResultsQuery({
    term: selectedTerm,
    year: selectedYear,
    childId: selectedChild || undefined
  });

  const children = childrenData?.children || [];
  const results = resultsData?.results || [];
  const performance = resultsData?.performance || {};

  const handleChildChange = (childId) => {
    setSelectedChild(childId);
    setSearchParams(childId !== "all" ? { child: childId } : {});
  };

  const calculatePercentage = (marksObtained, totalMarks) => {
    return totalMarks > 0 ? (marksObtained / totalMarks) * 100 : 0;
  };

  const getGrade = (percentage) => {
    if (percentage >= 90) return { grade: 'A+', color: 'bg-green-100 text-green-800' };
    if (percentage >= 80) return { grade: 'A', color: 'bg-green-100 text-green-800' };
    if (percentage >= 70) return { grade: 'B', color: 'bg-blue-100 text-blue-800' };
    if (percentage >= 60) return { grade: 'C', color: 'bg-yellow-100 text-yellow-800' };
    if (percentage >= 50) return { grade: 'D', color: 'bg-orange-100 text-orange-800' };
    return { grade: 'F', color: 'bg-red-100 text-red-800' };
  };

  // Group results by child
  const resultsByChild = children.reduce((acc, child) => {
    acc[child._id] = results.filter(r => r.student._id === child._id);
    return acc;
  }, {});

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
          <h1 className="text-3xl font-bold">Children's Results</h1>
          <p className="text-gray-600 mt-2">Monitor your children's academic performance</p>
        </div>
        <Button className="flex items-center gap-2">
          <Download className="w-4 h-4" />
          Download Report
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Child</label>
              <Select value={selectedChild} onValueChange={handleChildChange}>
                <SelectTrigger>
                  <SelectValue placeholder="All Children" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Children</SelectItem>
                  {children.map((child) => (
                    <SelectItem key={child._id} value={child._id}>
                      {child.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Term</label>
              <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                <SelectTrigger>
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
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Year</label>
              <Select 
                value={selectedYear.toString()} 
                onValueChange={(value) => setSelectedYear(parseInt(value))}
              >
                <SelectTrigger>
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

            <div className="space-y-2">
              <label className="text-sm font-medium">Results</label>
              <div className="text-sm text-gray-600 pt-2">
                {results.length} records
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Overview */}
      {children.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {children.map((child) => {
            const childPerformance = performance[child._id] || {};
            const childResults = resultsByChild[child._id] || [];
            const grade = getGrade(childPerformance.averageMarks || 0);
            
            return (
              <Card key={child._id}>
                <CardContent className="p-6">
                  <div className="text-center">
                    <p className="font-medium text-sm mb-2">{child.name}</p>
                    <div className="text-2xl font-bold text-blue-600 mb-1">
                      {childPerformance.averageMarks?.toFixed(1) || 0}%
                    </div>
                    <div className="text-xs text-gray-500 mb-2">
                      {childPerformance.totalExams || 0} exams
                    </div>
                    <Badge className={grade.color}>
                      {grade.grade}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="results">Exam Results</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="summary">Summary</TabsTrigger>
        </TabsList>

        {/* Results Tab */}
        <TabsContent value="results" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              {results.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-lg">No results found</p>
                  <p className="text-sm">No results available for the selected period</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Child</TableHead>
                      <TableHead>Exam</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Marks</TableHead>
                      <TableHead>Percentage</TableHead>
                      <TableHead>Grade</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.map((result) => {
                      const percentage = calculatePercentage(
                        result.marksObtained, 
                        result.exam.totalMarks
                      );
                      const grade = getGrade(percentage);

                      return (
                        <TableRow key={result._id}>
                          <TableCell>
                            <div className="font-medium">{result.student.name}</div>
                            <div className="text-sm text-gray-500">
                              {result.student.class?.name}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{result.exam.title}</div>
                            <div className="text-sm text-gray-500">
                              Total: {result.exam.totalMarks}
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
              {children.map((child) => {
                const childResults = resultsByChild[child._id] || [];
                
                // Group by subject
                const subjectPerformance = childResults.reduce((acc, result) => {
                  const subjectName = result.subject.name;
                  if (!acc[subjectName]) {
                    acc[subjectName] = { totalMarks: 0, totalPossible: 0, count: 0 };
                  }
                  acc[subjectName].totalMarks += result.marksObtained;
                  acc[subjectName].totalPossible += result.exam.totalMarks;
                  acc[subjectName].count += 1;
                  return acc;
                }, {});

                return (
                  <div key={child._id} className="mb-6 last:mb-0">
                    <h4 className="font-semibold mb-3 text-lg">{child.name}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(subjectPerformance).map(([subject, data]) => {
                        const percentage = (data.totalMarks / data.totalPossible) * 100;
                        const grade = getGrade(percentage);

                        return (
                          <div key={subject} className="p-3 border rounded-lg">
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-medium">{subject}</span>
                              <Badge variant="outline" className={grade.color}>
                                {grade.grade}
                              </Badge>
                            </div>
                            <div className="flex justify-between text-sm text-gray-600">
                              <span>Average: {percentage.toFixed(1)}%</span>
                              <span>{data.count} exam(s)</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {Object.keys(subjectPerformance).length === 0 && (
                      <p className="text-gray-500 text-center py-4">No performance data available</p>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Summary Tab */}
        <TabsContent value="summary" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Academic Summary - {selectedTerm} {selectedYear}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {children.map((child) => {
                  const childPerformance = performance[child._id] || {};
                  const grade = getGrade(childPerformance.averageMarks || 0);
                  
                  return (
                    <div key={child._id} className="p-4 border rounded-lg">
                      <h4 className="font-semibold text-lg mb-3">{child.name}</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-3 bg-blue-50 rounded">
                          <p className="text-2xl font-bold text-blue-600">
                            {childPerformance.totalExams || 0}
                          </p>
                          <p className="text-sm text-gray-600">Exams Taken</p>
                        </div>
                        <div className="text-center p-3 bg-green-50 rounded">
                          <p className="text-2xl font-bold text-green-600">
                            {childPerformance.averageMarks?.toFixed(1) || 0}%
                          </p>
                          <p className="text-sm text-gray-600">Average</p>
                        </div>
                        <div className="text-center p-3 bg-purple-50 rounded">
                          <p className="text-2xl font-bold text-purple-600">
                            {grade.grade}
                          </p>
                          <p className="text-sm text-gray-600">Grade</p>
                        </div>
                        <div className="text-center p-3 bg-orange-50 rounded">
                          <p className="text-2xl font-bold text-orange-600">
                            {childPerformance.totalMarks || 0}
                          </p>
                          <p className="text-sm text-gray-600">Total Marks</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}