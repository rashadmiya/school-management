// components/results/ResultsList.jsx
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Edit, Trash2, Plus, Search, Filter, Download, BarChart3 } from "lucide-react";
import { useGetResultsQuery, useDeleteResultMutation } from "@/features/apis/resultsApi";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { toast } from "react-toastify";

const TERMS = ["Term 1", "Term 2", "Final"];
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - i);

export default function ResultsList({ 
  classes = [], 
  subjects = [], 
  exams = [],
  showFilters = true 
}) {
  const [filters, setFilters] = useState({});
  const [searchQuery, setSearchQuery] = useState("");

  const { data, isLoading, refetch } = useGetResultsQuery(filters);
  const [deleteResult] = useDeleteResultMutation();

  const results = data?.results || [];

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this result?")) return;
    try {
      await deleteResult(id).unwrap();
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || "Failed to delete result");
    }
  };

  const updateFilter = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined
    }));
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

  // Filter results by search query
  const filteredResults = results.filter(result =>
    result.student?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    result.student?.rollNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    result.exam?.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    result.subject?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
      {/* Header and Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className="text-2xl">Results</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                Export
              </Button>
              <Button variant="outline" className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Analytics
              </Button>
            </div>
          </div>
        </CardHeader>
        
        {showFilters && (
          <CardContent className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search results..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filters */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <Select 
              // onValueChange={(value) => updateFilter("class", value)}
                onValueChange={(value) => updateFilter("class", value === "all" ? undefined : value)}
                >
                <SelectTrigger>
                  <SelectValue placeholder="Class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {classes?.map((classItem) => (
                    <SelectItem key={classItem._id} value={classItem._id}>
                      {classItem.name} ({classItem?.section?.name || ""})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select 
              // onValueChange={(value) => updateFilter("subject", value)}
              onValueChange={(value) => updateFilter("subject", value === "all" ? undefined : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Subject" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  {subjects.map((subject) => (
                    <SelectItem key={subject._id} value={subject._id}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select 
              // onValueChange={(value) => updateFilter("exam", value)}
                onValueChange={(value) => updateFilter("exam", value === "all" ? undefined : value)}
                >
                <SelectTrigger>
                  <SelectValue placeholder="Exam" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Exams</SelectItem>
                  {exams.map((exam) => (
                    <SelectItem key={exam._id} value={exam._id}>
                      {exam.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select 
              // onValueChange={(value) => updateFilter("term", value)}
                onValueChange={(value) => updateFilter("term", value === "all" ? undefined : value)}
                >
                <SelectTrigger>
                  <SelectValue placeholder="Term" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Terms</SelectItem>
                  {TERMS.map((term) => (
                    <SelectItem key={term} value={term}>
                      {term}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select 
              // onValueChange={(value) => updateFilter("year", value)}
                onValueChange={(value) => updateFilter("year", value === "all" ? undefined : value)}
                >
                <SelectTrigger>
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  {YEARS.map((year) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Filter className="w-4 h-4" />
                <span>{filteredResults.length} results</span>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Results Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Exam</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Marks</TableHead>
                <TableHead>Percentage</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead>Term/Year</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredResults.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    {searchQuery || Object.values(filters).some(f => f) ? (
                      "No results found matching your criteria."
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <BarChart3 className="w-12 h-12 text-gray-300" />
                        <p>No results found.</p>
                        <p className="text-sm">Submit your first results to get started.</p>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                filteredResults.map((result) => {
                  const percentage = calculatePercentage(result.marksObtained, result.exam.totalMarks);
                  const grade = getGrade(percentage);
                  
                  return (
                    <TableRow key={result._id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{result.student.name}</div>
                          <div className="text-sm text-gray-500">
                            Roll: {result.student.rollNumber}
                            {result.student.class && ` • ${result.student.class.name}`}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{result.exam.title}</div>
                          <div className="text-sm text-gray-500">
                            {format(new Date(result.exam.date), 'MMM dd, yyyy')}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{result?.subject?.name}</div>
                          <div className="text-sm text-gray-500">{result?.subject?.code}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-mono">
                          {result?.marksObtained} / {result?.exam?.totalMarks}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {percentage.toFixed(1)}%
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={grade?.color}>
                          {grade?.grade}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{result.term}</div>
                          <div className="text-gray-500">{result?.year}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {/* Edit functionality */}}
                            className="flex items-center gap-1"
                          >
                            <Edit className="w-3 h-3" />
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(result._id)}
                            className="flex items-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" />
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}