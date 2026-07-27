// components/teacher/MySchedule.jsx
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useGetTeacherRoutinesQuery } from "@/features/apis/teachersApi";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function MySchedule() {
  const [selectedDay, setSelectedDay] = useState("All");
  const { data, isLoading } = useGetTeacherRoutinesQuery();

  const routines = data?.routines || [];

  // Filter routines by selected day
  const filteredRoutines = selectedDay === "All" 
    ? routines 
    : routines.filter(routine => routine.day === selectedDay);

  // Group routines by day
  const routinesByDay = {};
  DAYS.forEach(day => {
    routinesByDay[day] = routines.filter(routine => routine.day === day)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  });

  const getDayColor = (day) => {
    const colors = {
      Monday: "bg-blue-100 text-blue-800",
      Tuesday: "bg-green-100 text-green-800",
      Wednesday: "bg-yellow-100 text-yellow-800",
      Thursday: "bg-purple-100 text-purple-800",
      Friday: "bg-red-100 text-red-800",
      Saturday: "bg-orange-100 text-orange-800",
      Sunday: "bg-gray-100 text-gray-800"
    };
    return colors[day] || "bg-gray-100 text-gray-800";
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading your schedule...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">My Schedule</h1>
          <p className="text-gray-600 mt-2">View your weekly teaching timetable</p>
        </div>
        
        <Select value={selectedDay} onValueChange={setSelectedDay}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter by day" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Days</SelectItem>
            {DAYS.map(day => (
              <SelectItem key={day} value={day}>{day}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Weekly View */}
      {selectedDay === "All" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {DAYS.map(day => {
            const dayRoutines = routinesByDay[day];
            if (dayRoutines.length === 0) return null;

            return (
              <Card key={day}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Badge variant="outline" className={getDayColor(day)}>
                      {day}
                    </Badge>
                    <span className="text-sm text-gray-500">({dayRoutines.length})</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {dayRoutines.map(routine => (
                      <div
                        key={routine._id}
                        className="p-3 border rounded-lg bg-white"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-medium text-sm">{routine.class?.name}</p>
                            <p className="text-xs text-gray-600">{routine.subject?.name}</p>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {routine.startTime} - {routine.endTime}
                          </Badge>
                        </div>
                        {routine.roomNumber && (
                          <p className="text-xs text-gray-500">Room: {routine.roomNumber}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        /* Single Day View */
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Badge variant="outline" className={getDayColor(selectedDay)}>
                {selectedDay}
              </Badge>
              <span>Schedule</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredRoutines.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No classes scheduled for {selectedDay}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredRoutines.map(routine => (
                  <div
                    key={routine._id}
                    className="flex items-center justify-between p-4 border rounded-lg bg-white"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-4">
                        <div className="w-12 text-center">
                          <p className="font-mono font-bold text-lg">{routine.startTime}</p>
                          <p className="text-xs text-gray-500">to</p>
                          <p className="font-mono font-bold text-lg">{routine.endTime}</p>
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold">{routine.class?.name}</p>
                          <p className="text-gray-600">{routine.subject?.name}</p>
                          {routine.roomNumber && (
                            <p className="text-sm text-gray-500">Room {routine.roomNumber}</p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary">
                        {calculateDuration(routine.startTime, routine.endTime)}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Schedule Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Schedule Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            {DAYS.map(day => {
              const count = routinesByDay[day].length;
              return (
                <div key={day} className="text-center p-3 border rounded-lg">
                  <p className="font-medium">{day}</p>
                  <p className={`text-2xl font-bold ${
                    count > 0 ? 'text-green-600' : 'text-gray-400'
                  }`}>
                    {count}
                  </p>
                  <p className="text-xs text-gray-500">classes</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Helper function to calculate duration
function calculateDuration(startTime, endTime) {
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);
  
  const startTotal = startHour * 60 + startMinute;
  const endTotal = endHour * 60 + endMinute;
  const duration = endTotal - startTotal;
  
  const hours = Math.floor(duration / 60);
  const minutes = duration % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes > 0 ? `${minutes}m` : ''}`;
  }
  return `${minutes}m`;
}