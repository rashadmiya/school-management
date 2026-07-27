// components/results/ResultEntryForm.jsx
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { useBulkSubmitResultsMutation, useGetClassExamResultsQuery } from "@/features/apis/resultsApi";
import { toast } from "react-toastify";

const TERMS = ["Term 1", "Term 2", "Final"];
const CURRENT_YEAR = new Date().getFullYear();

export default function ResultEntryForm({ 
  open, 
  onOpenChange, 
  exam,
  class: classData,
  students = []
}) {
  const [results, setResults] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: existingResults, refetch } = useGetClassExamResultsQuery(
    { examId: exam?._id, classId: classData?._id },
    { skip: !exam || !classData }
  );

  const [bulkSubmitResults] = useBulkSubmitResultsMutation();

  const { register, handleSubmit, setValue, watch } = useForm({
    defaultValues: {
      term: "Term 1",
      year: CURRENT_YEAR
    }
  });

  useEffect(() => {
    if (open && exam && classData && students.length > 0) {
      // Initialize results with existing data or empty values
      const initialResults = {};
      
      students.forEach(student => {
        const existingResult = existingResults?.results?.find(
          r => r.student._id === student._id
        );
        
        initialResults[student._id] = existingResult?.result?.marksObtained?.toString() || "";
      });

      setResults(initialResults);
    }
  }, [open, exam, classData, students, existingResults]);

  const onSubmit = async (formData) => {
    if (!exam || !classData) return;

    setIsSubmitting(true);
    try {
      const resultsData = Object.entries(results)
        .filter(([_, marks]) => marks.trim() !== "")
        .map(([studentId, marks]) => ({
          studentId,
          marksObtained: parseFloat(marks)
        }));

      if (resultsData.length === 0) {
        toast.warn("Please enter marks for at least one student");
        return;
      }

      await bulkSubmitResults({
        exam: exam._id,
        subject: exam.subject?._id || exam.subject,
        term: formData.term,
        year: formData.year,
        results: resultsData
      }).unwrap();

      toast.warn('Results submitted successfully!');
      onOpenChange(false);
      refetch();
    } catch (error) {
      console.error('Error submitting results:', error);
      toast.error(error?.data?.message || 'Failed to submit results');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarksChange = (studentId, value) => {
    // Validate numeric input
    if (value === "" || (/^\d*\.?\d*$/.test(value) && parseFloat(value) <= (exam?.totalMarks || 100))) {
      setResults(prev => ({
        ...prev,
        [studentId]: value
      }));
    }
  };

  const calculatePercentage = (marks) => {
    if (!marks || !exam?.totalMarks) return 0;
    return (parseFloat(marks) / exam.totalMarks) * 100;
  };

  const getGrade = (percentage) => {
    if (percentage >= 90) return { grade: 'A+', color: 'bg-green-100 text-green-800' };
    if (percentage >= 80) return { grade: 'A', color: 'bg-green-100 text-green-800' };
    if (percentage >= 70) return { grade: 'B', color: 'bg-blue-100 text-blue-800' };
    if (percentage >= 60) return { grade: 'C', color: 'bg-yellow-100 text-yellow-800' };
    if (percentage >= 50) return { grade: 'D', color: 'bg-orange-100 text-orange-800' };
    return { grade: 'F', color: 'bg-red-100 text-red-800' };
  };

  const submittedCount = existingResults?.submitted || 0;
  const totalCount = existingResults?.total || students.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Enter Results - {exam?.title}
          </DialogTitle>
          <div className="text-sm text-gray-600">
            Class: {classData?.name} • Subject: {exam?.subject?.name} • Total Marks: {exam?.totalMarks}
          </div>
          
          {existingResults && (
            <div className="flex gap-4 text-sm">
              <Badge variant={submittedCount === totalCount ? "default" : "outline"}>
                Submitted: {submittedCount}/{totalCount}
              </Badge>
              {submittedCount === totalCount && (
                <Badge variant="default" className="bg-green-100 text-green-800">
                  Complete
                </Badge>
              )}
            </div>
          )}
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Term and Year Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="term">Term</Label>
              <Select onValueChange={(value) => setValue("term", value)} defaultValue={watch("term")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select term" />
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
              <Label htmlFor="year">Year</Label>
              <Input
                type="number"
                {...register("year", { 
                  required: true,
                  min: 2000,
                  max: 2100
                })}
                defaultValue={CURRENT_YEAR}
              />
            </div>
          </div>

          {/* Students Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Roll No</TableHead>
                  <TableHead className="w-32">Marks</TableHead>
                  <TableHead className="w-24">Percentage</TableHead>
                  <TableHead className="w-20">Grade</TableHead>
                  <TableHead className="w-20">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student, index) => {
                  const marks = results[student._id] || "";
                  const percentage = calculatePercentage(marks);
                  const grade = getGrade(percentage);
                  const hasExistingResult = existingResults?.results?.find(
                    r => r.student._id === student._id && r.hasResult
                  );

                  return (
                    <TableRow key={student._id}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell>
                        <div className="font-medium">{student.name}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-mono text-sm">{student.rollNumber}</div>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="text"
                          value={marks}
                          onChange={(e) => handleMarksChange(student._id, e.target.value)}
                          placeholder="0"
                          className="text-center font-mono"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="text-center text-sm font-medium">
                          {marks ? `${percentage.toFixed(1)}%` : "-"}
                        </div>
                      </TableCell>
                      <TableCell>
                        {marks ? (
                          <Badge variant="outline" className={grade.color}>
                            {grade.grade}
                          </Badge>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {hasExistingResult ? (
                          <Badge variant="outline" className="bg-blue-100 text-blue-800">
                            Saved
                          </Badge>
                        ) : (
                          <Badge variant="outline">New</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                const newResults = {};
                students.forEach(student => {
                  newResults[student._id] = "";
                });
                setResults(newResults);
              }}
            >
              Clear All
            </Button>
            
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                const newResults = { ...results };
                students.forEach(student => {
                  if (!newResults[student._id]) {
                    newResults[student._id] = "0";
                  }
                });
                setResults(newResults);
              }}
            >
              Fill Zeros
            </Button>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit Results"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}