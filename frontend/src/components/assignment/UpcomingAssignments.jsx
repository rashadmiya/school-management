// components/assignments/UpcomingAssignments.jsx
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGetUpcomingAssignmentsQuery } from "@/features/apis/assignmentsApi";
import { format, isToday, isTomorrow } from "date-fns";
import { Calendar, Clock } from "lucide-react";

export default function UpcomingAssignments({ limit = 5 }) {
  const { data, isLoading } = useGetUpcomingAssignmentsQuery();

  const assignments = data?.assignments?.slice(0, limit) || [];

  const getDueText = (dueDate) => {
    const date = new Date(dueDate);
    
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
          <div className="text-center">Loading assignments...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Upcoming Assignments
        </CardTitle>
      </CardHeader>
      <CardContent>
        {assignments.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p>No upcoming assignments</p>
          </div>
        ) : (
          <div className="space-y-3">
            {assignments.map((assignment) => {
              const dueInfo = getDueText(assignment.dueDate);
              
              return (
                <div
                  key={assignment._id}
                  className="flex items-start justify-between p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="flex items-start gap-2">
                      <BookOpen className="w-4 h-4 text-blue-600 mt-1 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <h4 className="font-medium text-sm truncate">
                          {assignment.title}
                        </h4>
                        <p className="text-xs text-gray-600">
                          {assignment.class?.name} • {assignment.subject?.name}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Calendar className="w-3 h-3 text-gray-500" />
                          <span className="text-xs text-gray-600">
                            Due: {format(new Date(assignment.dueDate), 'MMM dd, yyyy')}
                          </span>
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
        
        {assignments.length > 0 && data?.count > limit && (
          <div className="mt-4 pt-3 border-t">
            <p className="text-sm text-gray-600 text-center">
              +{data.count - limit} more assignments
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}