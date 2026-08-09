// components/resultSheets/ResultSheetGenerator.jsx
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useGenerateClassResultSheetsMutation } from "@/features/apis/resultSheetsApi";
import { useAppSelector } from "@/features/store";
import { Loader2, FileText, Users, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "react-toastify";

const TERMS = ["Term 1", "Term 2", "Final Term", "Semester 1", "Semester 2"];
const CURRENT_YEAR = new Date().getFullYear();

export default function ResultSheetGenerator({ classes = [], isDarkMode = false }) {
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedTerm, setSelectedTerm] = useState("Term 1");
  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR);
  const [generationResult, setGenerationResult] = useState(null);

  const [generateSheets, { isLoading }] = useGenerateClassResultSheetsMutation();

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
      ready: isDarkMode ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "",
    },
    infoBox: isDarkMode 
      ? "bg-blue-500/10 border-blue-500/20" 
      : "bg-blue-50",
    infoIcon: isDarkMode ? "text-blue-400" : "text-blue-600",
    infoText: isDarkMode ? "text-gray-300" : "text-gray-600",
    successIcon: isDarkMode ? "text-emerald-400" : "text-green-600",
    errorBox: isDarkMode 
      ? "bg-yellow-500/10 border-yellow-500/20" 
      : "bg-yellow-50 border-yellow-200",
    errorText: isDarkMode ? "text-yellow-400" : "text-yellow-800",
    errorSubtext: isDarkMode ? "text-yellow-400/80" : "text-yellow-700",
    button: {
      primary: isDarkMode 
        ? "bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-700 disabled:text-gray-400" 
        : "bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-300 disabled:text-gray-500",
    }
  };

  const handleGenerate = async () => {
    if (!selectedClass) {
      toast.warn("Please select a class");
      return;
    }

    try {
      const result = await generateSheets({
        class: selectedClass,
        term: selectedTerm,
        year: selectedYear
      }).unwrap();

      setGenerationResult(result);
    } catch (error) {
      console.error("Error generating result sheets:", error);
      toast.error(error?.data?.message || "Failed to generate result sheets");
    }
  };

  const selectedClassObj = classes.find(c => c._id === selectedClass);
  const studentCount = selectedClassObj?.students?.length || 0;

  return (
    <div className="space-y-6">
      <Card className={`${isDarkMode ? "bg-gray-900/50 border-gray-800" : "bg-white border-gray-200"} shadow-sm`}>
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
            <FileText className="w-5 h-5" />
            Generate Result Sheets
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Selection Form */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                Class
              </label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className={theme.select}>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent className={theme.selectContent}>
                  {classes.map((classItem) => (
                    <SelectItem key={classItem._id} value={classItem._id} className={theme.selectItem}>
                      {classItem.name} ({classItem.students?.length || 0} students)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                Term
              </label>
              <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                <SelectTrigger className={theme.select}>
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
            </div>

            <div className="space-y-2">
              <label className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                Year
              </label>
              <Select 
                value={selectedYear.toString()} 
                onValueChange={(value) => setSelectedYear(parseInt(value))}
              >
                <SelectTrigger className={theme.select}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className={theme.selectContent}>
                  {[CURRENT_YEAR, CURRENT_YEAR - 1].map((year) => (
                    <SelectItem key={year} value={year.toString()} className={theme.selectItem}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Class Info */}
          {selectedClassObj && (
            <div className={`p-4 rounded-lg border ${theme.infoBox}`}>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <Users className={`w-8 h-8 ${theme.infoIcon}`} />
                  <div>
                    <p className={`font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                      {selectedClassObj.name}
                    </p>
                    <p className={`text-sm ${theme.infoText}`}>
                      {studentCount} students • {selectedTerm} {selectedYear}
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className={theme.badge.ready}>
                  Ready to generate
                </Badge>
              </div>
            </div>
          )}

          {/* Generate Button */}
          <Button 
            onClick={handleGenerate}
            disabled={!selectedClass || isLoading}
            className={`w-full ${theme.button.primary}`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating Result Sheets...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4 mr-2" />
                Generate Result Sheets for Entire Class
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Generation Results */}
      {generationResult && (
        <Card className={`${isDarkMode ? "bg-gray-900/50 border-gray-800" : "bg-white border-gray-200"} shadow-sm`}>
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
              <CheckCircle className={`w-5 h-5 ${theme.successIcon}`} />
              Generation Complete
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className={`flex items-center gap-2 ${theme.successIcon}`}>
                <CheckCircle className="w-4 h-4" />
                <span>Successfully generated {generationResult.generated} result sheets</span>
              </div>

              {generationResult.errors && generationResult.errors.length > 0 && (
                <div className={`p-3 border rounded-lg ${theme.errorBox}`}>
                  <div className={`flex items-center gap-2 ${theme.errorText} mb-2`}>
                    <AlertCircle className="w-4 h-4" />
                    <span className="font-medium">Some issues occurred:</span>
                  </div>
                  <ul className={`text-sm ${theme.errorSubtext} space-y-1`}>
                    {generationResult.errors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className={`pt-3 border-t ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
                <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                  Result sheets have been generated and are ready for review and publication.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}