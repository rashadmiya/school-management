// components/resultSheets/ResultSheetViewer.jsx
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Eye, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "react-toastify";
import { useAppSelector } from "@/features/store";

export default function ResultSheetViewer({ resultSheet, isDarkMode = false }) {
  // Theme-based classes
  const theme = {
    textPrimary: isDarkMode ? "text-white" : "text-gray-900",
    textSecondary: isDarkMode ? "text-gray-300" : "text-gray-700",
    textMuted: isDarkMode ? "text-gray-400" : "text-gray-500",
    textLight: isDarkMode ? "text-gray-500" : "text-gray-400",
    border: isDarkMode ? "border-gray-700" : "border-gray-200",
    bgCard: isDarkMode ? "bg-gray-900/50" : "bg-white",
    bgHover: isDarkMode ? "hover:bg-gray-800/50" : "hover:bg-gray-50",
    bgCardLight: isDarkMode ? "bg-gray-800/50" : "bg-gray-50",
    badge: {
      default: isDarkMode ? "bg-blue-500/20 text-blue-400 border-blue-500/30" : "",
      secondary: isDarkMode ? "bg-gray-700 text-gray-300 border-gray-600" : "",
      aPlus: isDarkMode ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-green-100 text-green-800",
      a: isDarkMode ? "bg-blue-500/20 text-blue-400 border-blue-500/30" : "bg-blue-100 text-blue-800",
      b: isDarkMode ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" : "bg-yellow-100 text-yellow-800",
      c: isDarkMode ? "bg-orange-500/20 text-orange-400 border-orange-500/30" : "bg-orange-100 text-orange-800",
      d: isDarkMode ? "bg-red-500/20 text-red-400 border-red-500/30" : "bg-red-100 text-red-800",
    },
    stat: {
      blue: isDarkMode 
        ? "text-blue-400" 
        : "text-blue-600",
      green: isDarkMode 
        ? "text-emerald-400" 
        : "text-green-600",
      purple: isDarkMode 
        ? "text-purple-400" 
        : "text-purple-600",
      orange: isDarkMode 
        ? "text-orange-400" 
        : "text-orange-600",
    },
    grading: {
      aPlus: isDarkMode ? "bg-emerald-500/10 border-emerald-500/20" : "bg-green-50",
      a: isDarkMode ? "bg-blue-500/10 border-blue-500/20" : "bg-blue-50",
      b: isDarkMode ? "bg-yellow-500/10 border-yellow-500/20" : "bg-yellow-50",
      c: isDarkMode ? "bg-orange-500/10 border-orange-500/20" : "bg-orange-50",
      d: isDarkMode ? "bg-red-500/10 border-red-500/20" : "bg-red-50",
    },
    button: {
      outline: isDarkMode 
        ? "border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white" 
        : "border-gray-200 text-gray-700 hover:bg-gray-50",
    }
  };

  if (!resultSheet) {
    return (
      <Card className={isDarkMode ? "bg-gray-900/50 border-gray-800" : ""}>
        <CardContent className="p-6">
          <div className={`text-center ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
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
    toast.warn("PDF download functionality would be implemented here");
  };

  const getGradeBadgeClass = (gradeLetter) => {
    const gradeMap = {
      'A+': theme.badge.aPlus,
      'A': theme.badge.a,
      'B': theme.badge.b,
      'C': theme.badge.c,
      'D': theme.badge.d,
      'F': theme.badge.d,
    };
    return gradeMap[gradeLetter] || theme.badge.secondary;
  };

  const getGradingClass = (gradeLetter) => {
    const gradeMap = {
      'A+': theme.grading.aPlus,
      'A': theme.grading.a,
      'B': theme.grading.b,
      'C': theme.grading.c,
      'D': theme.grading.d,
      'F': theme.grading.d,
    };
    return gradeMap[gradeLetter] || theme.grading.d;
  };

  return (
    <Card className={`${isDarkMode ? "bg-gray-900/50 border-gray-800" : "bg-white border-gray-200"} shadow-sm print:shadow-none`}>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle className={isDarkMode ? "text-white" : "text-gray-900"}>
              Result Sheet - {term} {year}
            </CardTitle>
            <div className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"} mt-1`}>
              {student?.name || 'Unknown Student'} • Roll: {student?.rollNumber || 'N/A'} • {classInfo?.name || 'Unknown Class'}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint} className={theme.button.outline}>
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownload} className={theme.button.outline}>
              <Download className="w-4 h-4 mr-2" />
              PDF
            </Button>
            <Badge variant={isPublished ? "default" : "secondary"} className={isPublished ? theme.badge.default : theme.badge.secondary}>
              {isPublished ? "Published" : "Draft"}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Card */}
        <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-lg ${isDarkMode ? "bg-gray-800/50 border border-gray-700" : "bg-gray-50"}`}>
          <div className="text-center">
            <p className={`text-2xl font-bold ${theme.stat.blue}`}>{overallAverage}%</p>
            <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>Overall Average</p>
          </div>
          <div className="text-center">
            <p className={`text-2xl font-bold ${theme.stat.green}`}>{grade?.name || 'N/A'}</p>
            <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>Grade</p>
          </div>
          <div className="text-center">
            <p className={`text-2xl font-bold ${theme.stat.purple}`}>#{position || 'N/A'}</p>
            <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>Class Position</p>
          </div>
          <div className="text-center">
            <p className={`text-2xl font-bold ${theme.stat.orange}`}>{results?.length || 0}</p>
            <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>Subjects</p>
          </div>
        </div>

        {/* Subjects Table */}
        <div className={`border rounded-lg overflow-hidden ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
          <Table>
            <TableHeader className={isDarkMode ? "bg-gray-800" : "bg-gray-50"}>
              <TableRow className={isDarkMode ? "border-gray-700" : "border-gray-200"}>
                <TableHead className={isDarkMode ? "text-gray-300" : "text-gray-700"}>Subject</TableHead>
                <TableHead className={`text-center ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>Exam Score</TableHead>
                <TableHead className={`text-center ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>Assignment Score</TableHead>
                <TableHead className={`text-center ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>Total</TableHead>
                <TableHead className={`text-center ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>Grade</TableHead>
                <TableHead className={isDarkMode ? "text-gray-300" : "text-gray-700"}>Remarks</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results?.map((result, index) => (
                <TableRow 
                  key={result.subject?._id || index} 
                  className={`${isDarkMode ? "border-gray-800 hover:bg-gray-800/50" : "border-gray-200 hover:bg-gray-50"}`}
                >
                  <TableCell>
                    <div>
                      <div className={`font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                        {result.subject?.name || 'Unknown Subject'}
                      </div>
                      <div className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                        {result.subject?.code || ''}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className={`text-center font-mono ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                    {result.totalExamScore}
                  </TableCell>
                  <TableCell className={`text-center font-mono ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                    {result.totalAssignmentScore}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className={`font-mono font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                      {result.total}/100
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge 
                      variant="outline"
                      className={getGradeBadgeClass(result.grade)}
                    >
                      {result.grade || 'N/A'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"} max-w-xs`}>
                      {result.remarks || '-'}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Grading Scale */}
        <Card className={`${isDarkMode ? "bg-gray-800/50 border-gray-700" : "bg-white border-gray-200"}`}>
          <CardHeader>
            <CardTitle className={`text-lg ${isDarkMode ? "text-white" : "text-gray-900"}`}>
              Grading Scale
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm">
              <div className={`text-center p-2 rounded border ${theme.grading.aPlus}`}>
                <div className={`font-semibold ${isDarkMode ? "text-emerald-400" : "text-gray-900"}`}>A+</div>
                <div className={isDarkMode ? "text-gray-400" : "text-gray-600"}>90-100%</div>
              </div>
              <div className={`text-center p-2 rounded border ${theme.grading.a}`}>
                <div className={`font-semibold ${isDarkMode ? "text-blue-400" : "text-gray-900"}`}>A</div>
                <div className={isDarkMode ? "text-gray-400" : "text-gray-600"}>80-89%</div>
              </div>
              <div className={`text-center p-2 rounded border ${theme.grading.b}`}>
                <div className={`font-semibold ${isDarkMode ? "text-yellow-400" : "text-gray-900"}`}>B</div>
                <div className={isDarkMode ? "text-gray-400" : "text-gray-600"}>70-79%</div>
              </div>
              <div className={`text-center p-2 rounded border ${theme.grading.c}`}>
                <div className={`font-semibold ${isDarkMode ? "text-orange-400" : "text-gray-900"}`}>C</div>
                <div className={isDarkMode ? "text-gray-400" : "text-gray-600"}>60-69%</div>
              </div>
              <div className={`text-center p-2 rounded border ${theme.grading.d}`}>
                <div className={`font-semibold ${isDarkMode ? "text-red-400" : "text-gray-900"}`}>D/F</div>
                <div className={isDarkMode ? "text-gray-400" : "text-gray-600"}>Below 60%</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
}