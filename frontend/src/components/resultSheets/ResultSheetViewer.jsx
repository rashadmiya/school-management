// components/resultSheets/ResultSheetViewer.jsx
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Eye, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "react-toastify";

export default function ResultSheetViewer({ resultSheet }) {
  if (!resultSheet) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            Select a result sheet to view details
          </div>
        </CardContent>
      </Card>
    );
  }

  const { student, class: classInfo, term, year, results, overallAverage, position, grade, isPublished } = resultSheet;

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Implement PDF download functionality
    toast.warn("PDF download functionality would be implemented here");
  };

  return (
    <Card className="print:shadow-none">
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle>Result Sheet - {term} {year}</CardTitle>
            <div className="text-sm text-gray-600 mt-1">
              {student.name} • Roll: {student.rollNumber} • {classInfo.name}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="w-4 h-4 mr-2" />
              PDF
            </Button>
            <Badge variant={isPublished ? "default" : "secondary"}>
              {isPublished ? "Published" : "Draft"}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Card */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{overallAverage}%</p>
            <p className="text-sm text-gray-600">Overall Average</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{grade.name}</p>
            <p className="text-sm text-gray-600">Grade</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">#{position}</p>
            <p className="text-sm text-gray-600">Class Position</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-orange-600">{results.length}</p>
            <p className="text-sm text-gray-600">Subjects</p>
          </div>
        </div>

        {/* Subjects Table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subject</TableHead>
                <TableHead className="text-center">Exam Score</TableHead>
                <TableHead className="text-center">Assignment Score</TableHead>
                <TableHead className="text-center">Total</TableHead>
                <TableHead className="text-center">Grade</TableHead>
                <TableHead>Remarks</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((result, index) => (
                <TableRow key={result.subject._id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{result.subject.name}</div>
                      <div className="text-sm text-gray-500">{result.subject.code}</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center font-mono">
                    {result.totalExamScore}
                  </TableCell>
                  <TableCell className="text-center font-mono">
                    {result.totalAssignmentScore}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="font-mono font-semibold">
                      {result.total}/100
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge 
                      variant="outline"
                      className={
                        result.grade === 'A+' ? 'bg-green-100 text-green-800' :
                        result.grade === 'A' ? 'bg-blue-100 text-blue-800' :
                        result.grade === 'B' ? 'bg-yellow-100 text-yellow-800' :
                        result.grade === 'C' ? 'bg-orange-100 text-orange-800' :
                        'bg-red-100 text-red-800'
                      }
                    >
                      {result.grade}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-600 max-w-xs">
                      {result.remarks}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Grading Scale */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Grading Scale</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm">
              <div className="text-center p-2 bg-green-50 rounded">
                <div className="font-semibold">A+</div>
                <div>90-100%</div>
              </div>
              <div className="text-center p-2 bg-blue-50 rounded">
                <div className="font-semibold">A</div>
                <div>80-89%</div>
              </div>
              <div className="text-center p-2 bg-yellow-50 rounded">
                <div className="font-semibold">B</div>
                <div>70-79%</div>
              </div>
              <div className="text-center p-2 bg-orange-50 rounded">
                <div className="font-semibold">C</div>
                <div>60-69%</div>
              </div>
              <div className="text-center p-2 bg-red-50 rounded">
                <div className="font-semibold">D/F</div>
                <div>Below 60%</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
}