// components/exams/UpcomingExams.jsx
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, AlertTriangle } from "lucide-react";
import { useGetUpcomingExamsQuery } from "@/features/apis/examsApi";
import { format, isToday, isTomorrow } from "date-fns";

export default function UpcomingExams({ limit = 5 }) {
  const { data, isLoading } = useGetUpcomingExamsQuery();

  const exams = data?.exams?.slice(0, limit) || [];

  const getDueText = (examDate) => {
    const date = new Date(examDate);
    
    if (isToday(date)) {
      return { text: 'Today', color: 'bg-red-100 text-red-800' };
    } else if (isTomorrow(date)) {
      return { text: 'Tomorrow', color: 'bg-orange-100 text-orange-800' };
    } else {
      const daysUntil = Math.ceil((date - new Date()) / (1000 * 60 * 60 * 24));
      return { 
        text: `In ${daysUntil} days`, 
        color: daysUntil <= 3 ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
      };
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading exams...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Upcoming Exams
        </CardTitle>
      </CardHeader>
      <CardContent>
        {exams.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p>No upcoming exams</p>
          </div>
        ) : (
          <div className="space-y-3">
            {exams.map((exam) => {
              const dueInfo = getDueText(exam.date);
              const isSoon = dueInfo.text === 'Today' || dueInfo.text === 'Tomorrow' || dueInfo.text.includes('1 days') || dueInfo.text.includes('2 days');
              
              return (
                <div
                  key={exam._id}
                  className={`flex items-start justify-between p-3 border rounded-lg hover:bg-gray-50 ${
                    isSoon ? 'bg-yellow-50 border-yellow-200' : ''
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-start gap-2">
                      {isSoon && <AlertTriangle className="w-4 h-4 text-yellow-600 mt-1 flex-shrink-0" />}
                      <div className="min-w-0 flex-1">
                        <h4 className="font-medium text-sm truncate">
                          {exam.title}
                        </h4>
                        <p className="text-xs text-gray-600">
                          {exam.class?.name} • {exam.subject?.name}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Clock className="w-3 h-3 text-gray-500" />
                          <span className="text-xs text-gray-600">
                            {format(new Date(exam.date), 'MMM dd')} • {exam.startTime} - {exam.endTime}
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
                  
                  <Badge variant="outline" className={dueInfo.color}>
                    {dueInfo.text}
                  </Badge>
                </div>
              );
            })}
          </div>
        )}
        
        {exams.length > 0 && data?.count > limit && (
          <div className="mt-4 pt-3 border-t">
            <p className="text-sm text-gray-600 text-center">
              +{data.count - limit} more exams
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}