// components/resultSheets/ResultSheetGenerator.jsx
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useGenerateClassResultSheetsMutation } from "@/features/apis/resultSheetsApi";
import { Loader2, FileText, Users, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "react-toastify";

const TERMS = ["Term 1", "Term 2", "Final Term", "Semester 1", "Semester 2"];
const CURRENT_YEAR = new Date().getFullYear();

export default function ResultSheetGenerator({ classes = [] }) {
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedTerm, setSelectedTerm] = useState("Term 1");
  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR);
  const [generationResult, setGenerationResult] = useState(null);

  const [generateSheets, { isLoading }] = useGenerateClassResultSheetsMutation();

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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Generate Result Sheets
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Selection Form */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Class</label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((classItem) => (
                    <SelectItem key={classItem._id} value={classItem._id}>
                      {classItem.name} ({classItem.students?.length || 0} students)
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
          </div>

          {/* Class Info */}
          {selectedClassObj && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Users className="w-8 h-8 text-blue-600" />
                  <div>
                    <p className="font-medium">{selectedClassObj.name}</p>
                    <p className="text-sm text-gray-600">
                      {studentCount} students • {selectedTerm} {selectedYear}
                    </p>
                  </div>
                </div>
                <Badge variant="outline">
                  Ready to generate
                </Badge>
              </div>
            </div>
          )}

          {/* Generate Button */}
          <Button 
            onClick={handleGenerate}
            disabled={!selectedClass || isLoading}
            className="w-full"
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
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Generation Complete
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-4 h-4" />
                <span>Successfully generated {generationResult.generated} result sheets</span>
              </div>

              {generationResult.errors && generationResult.errors.length > 0 && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-2 text-yellow-800 mb-2">
                    <AlertCircle className="w-4 h-4" />
                    <span className="font-medium">Some issues occurred:</span>
                  </div>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    {generationResult.errors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="pt-3 border-t">
                <p className="text-sm text-gray-600">
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