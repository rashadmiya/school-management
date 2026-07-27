// components/routines/TodaysRoutine.jsx
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, User, MapPin } from "lucide-react";
import { useGetTodayRoutineQuery } from "@/features/apis/routineApi";

export default function TodaysRoutine({ classId }) {
  const { data, isLoading } = useGetTodayRoutineQuery(classId);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading today's routine...</div>
        </CardContent>
      </Card>
    );
  }

  const { day, routines = [] } = data || {};

  // Sort routines by start time
  const sortedRoutines = [...routines].sort((a, b) => 
    a.startTime.localeCompare(b.startTime)
  );

  const getCurrentClass = () => {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    return sortedRoutines.find(routine => 
      routine.startTime <= currentTime && routine.endTime > currentTime
    );
  };

  const currentClass = getCurrentClass();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Today's Schedule ({day})</span>
          {currentClass && (
            <Badge variant="default" className="bg-green-100 text-green-800">
              Class in Progress
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {sortedRoutines.length === 0 ? (
          <div className="text-center text-gray-500 py-4">
            No classes scheduled for today. Enjoy your day!
          </div>
        ) : (
          <>
            {/* Current Class Highlight */}
            {currentClass && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-green-600" />
                  <span className="font-medium text-green-800">Current Class</span>
                </div>
                <ClassItem routine={currentClass} highlight />
              </div>
            )}

            {/* All Today's Classes */}
            <div className="space-y-3">
              {sortedRoutines.map((routine, index) => (
                <ClassItem 
                  key={routine._id} 
                  routine={routine} 
                  isCurrent={routine._id === currentClass?._id}
                />
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function ClassItem({ routine, highlight = false, isCurrent = false }) {
  return (
    <div className={`border rounded-lg p-3 ${highlight ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'}`}>
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <h4 className={`font-medium ${highlight ? 'text-green-800' : 'text-gray-900'}`}>
            {routine.subject?.name}
          </h4>
          <p className="text-sm text-gray-600">{routine.subject?.code}</p>
        </div>
        <Badge 
          variant={isCurrent ? "default" : "outline"} 
          className={isCurrent ? "bg-green-100 text-green-800" : ""}
        >
          {routine.startTime} - {routine.endTime}
        </Badge>
      </div>
      
      <div className="flex items-center gap-4 text-sm text-gray-600">
        <div className="flex items-center gap-1">
          <User className="w-3 h-3" />
          <span>{routine.teacher?.user?.name}</span>
        </div>
        {routine.roomNumber && (
          <div className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            <span>{routine.roomNumber}</span>
          </div>
        )}
      </div>
    </div>
  );
}