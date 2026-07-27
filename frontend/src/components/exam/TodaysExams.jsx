// components/exams/TodaysExams.jsx
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, CheckCircle } from "lucide-react";
import { useGetTodayExamsQuery } from "@/features/apis/examsApi";
import { format, isAfter, isBefore } from "date-fns";

export default function TodaysExams() {
  const { data, isLoading } = useGetTodayExamsQuery();

  const exams = data?.exams || [];

  const getExamStatus = (startTime, endTime) => {
    const now = new Date();
    const today = now.toDateString();
    
    const start = new Date(`${today} ${startTime}`);
    const end = new Date(`${today} ${endTime}`);
    
    if (isBefore(now, start)) {
      return { status: 'upcoming', color: 'bg-blue-100 text-blue-800', label: 'Upcoming' };
    } else if (isAfter(now, end)) {
      return { status: 'completed', color: 'bg-gray-100 text-gray-800', label: 'Completed' };
    } else {
      return { status: 'ongoing', color: 'bg-green-100 text-green-800', label: 'Ongoing' };
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading today's exams...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Today's Exams
          <Badge variant="outline" className="ml-2">
            {exams.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {exams.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            <CheckCircle className="w-12 h-12 text-green-300 mx-auto mb-2" />
            <p>No exams scheduled for today</p>
          </div>
        ) : (
          <div className="space-y-3">
            {exams?.map((exam) => {
              const status = getExamStatus(exam.startTime, exam.endTime);
              
              return (
                <div
                  key={exam._id}
                  className="flex items-start justify-between p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="flex items-start gap-2">
                      <Calendar className="w-4 h-4 text-blue-600 mt-1 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <h4 className="font-medium text-sm">{exam.title}</h4>
                        <p className="text-xs text-gray-600">
                          {exam.class?.name} • {exam.subject?.name}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Clock className="w-3 h-3 text-gray-500" />
                          <span className="text-xs font-mono">
                            {exam.startTime} - {exam.endTime}
                          </span>
                        </div>
                        <div className="mt-1">
                          <Badge variant="outline" className="text-xs">
                            {exam.totalMarks} marks
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <Badge variant="outline" className={status.color}>
                    {status.label}
                  </Badge>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}