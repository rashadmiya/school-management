// components/student/StudentSchedule.jsx
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, MapPin, Users, BookOpen } from "lucide-react";
import { useGetStudentRoutinesQuery, useGetStudentClassQuery } from "@/features/apis/studentsApi";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function StudentSchedule() {
  const [selectedDay, setSelectedDay] = useState(() => {
    const today = new Date().getDay();
    // Convert Sunday (0) to Monday (0) for our array
    return today === 0 ? "Monday" : DAYS[today - 1];
  });

  const { data: routinesData, isLoading } = useGetStudentRoutinesQuery();
  const { data: classData } = useGetStudentClassQuery();

  const routines = routinesData?.routines || [];
  const studentClass = classData?.class;

  // Filter routines for selected day
  const dayRoutines = routines.filter(routine => routine.day === selectedDay);

  // Group routines by day for the weekly view
  const weeklySchedule = DAYS.reduce((acc, day) => {
    acc[day] = routines.filter(routine => routine.day === day);
    return acc;
  }, {});

  const getCurrentPeriod = () => {
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
    
    return dayRoutines.find(routine => {
      return routine.startTime <= currentTime && routine.endTime > currentTime;
    });
  };

  const currentPeriod = getCurrentPeriod();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading schedule...</div>
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
          <p className="text-gray-600 mt-2">
            Class: {studentClass?.name || 'Not assigned'} • {selectedDay}'s Timetable
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-gray-500" />
          <span className="text-sm text-gray-600">
            {new Date().toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Current Period Alert */}
      {currentPeriod && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
              <div className="flex-1">
                <p className="font-medium text-blue-800">
                  Currently: {currentPeriod.subject?.name} with {currentPeriod.teacher?.user?.name}
                </p>
                <p className="text-sm text-blue-700">
                  {currentPeriod.startTime} - {currentPeriod.endTime} • Room {currentPeriod.roomNumber}
                </p>
              </div>
              <Badge variant="outline" className="bg-white">
                In Progress
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Day Selector */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <Select value={selectedDay} onValueChange={setSelectedDay}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DAYS.map((day) => (
                  <SelectItem key={day} value={day}>
                    {day}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Button 
                variant={selectedDay === "Monday" ? "default" : "outline"}
                onClick={() => setSelectedDay("Monday")}
              >
                Mon
              </Button>
              <Button 
                variant={selectedDay === "Tuesday" ? "default" : "outline"}
                onClick={() => setSelectedDay("Tuesday")}
              >
                Tue
              </Button>
              <Button 
                variant={selectedDay === "Wednesday" ? "default" : "outline"}
                onClick={() => setSelectedDay("Wednesday")}
              >
                Wed
              </Button>
              <Button 
                variant={selectedDay === "Thursday" ? "default" : "outline"}
                onClick={() => setSelectedDay("Thursday")}
              >
                Thu
              </Button>
              <Button 
                variant={selectedDay === "Friday" ? "default" : "outline"}
                onClick={() => setSelectedDay("Friday")}
              >
                Fri
              </Button>
              <Button 
                variant={selectedDay === "Saturday" ? "default" : "outline"}
                onClick={() => setSelectedDay("Saturday")}
              >
                Sat
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Schedule */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                {selectedDay}'s Schedule
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {dayRoutines.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-lg">No classes scheduled for {selectedDay}</p>
                  <p className="text-sm">Enjoy your day off!</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Teacher</TableHead>
                      <TableHead>Room</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dayRoutines
                      .sort((a, b) => a.startTime.localeCompare(b.startTime))
                      .map((routine, index) => {
                        const isCurrent = routine === currentPeriod;
                        const isPast = routine.endTime < new Date().toTimeString().slice(0, 5);
                        
                        return (
                          <TableRow 
                            key={routine._id} 
                            className={isCurrent ? 'bg-blue-50' : ''}
                          >
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-gray-500" />
                                <div>
                                  <p className="font-mono text-sm font-medium">
                                    {routine.startTime} - {routine.endTime}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    Period {index + 1}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <BookOpen className="w-4 h-4 text-blue-500" />
                                <div>
                                  <p className="font-medium">{routine.subject.name}</p>
                                  <p className="text-xs text-gray-500">{routine.subject.code}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-green-500" />
                                <span className="text-sm">{routine.teacher?.user?.name}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-orange-500" />
                                <span className="text-sm">{routine.roomNumber}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {isCurrent ? (
                                <Badge variant="default" className="bg-green-100 text-green-800">
                                  Now
                                </Badge>
                              ) : isPast ? (
                                <Badge variant="secondary">Completed</Badge>
                              ) : (
                                <Badge variant="outline">Upcoming</Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Weekly Overview */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Weekly Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {DAYS.map((day) => {
                  const dayClasses = weeklySchedule[day] || [];
                  const isSelected = day === selectedDay;
                  
                  return (
                    <div
                      key={day}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        isSelected 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedDay(day)}
                    >
                      <div className="flex justify-between items-center">
                        <span className={`font-medium ${
                          isSelected ? 'text-blue-700' : 'text-gray-700'
                        }`}>
                          {day}
                        </span>
                        <Badge 
                          variant={isSelected ? "default" : "outline"}
                          className={isSelected ? "bg-blue-100 text-blue-800" : ""}
                        >
                          {dayClasses.length} classes
                        </Badge>
                      </div>
                      
                      {dayClasses.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {dayClasses.slice(0, 2).map((routine) => (
                            <div key={routine._id} className="flex justify-between text-xs text-gray-600">
                              <span>{routine.subject.name}</span>
                              <span>{routine.startTime}</span>
                            </div>
                          ))}
                          {dayClasses.length > 2 && (
                            <div className="text-xs text-gray-500">
                              +{dayClasses.length - 2} more classes
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Schedule Stats */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold mb-2">This Week</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Total Classes:</span>
                    <span className="font-medium">{routines.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Busiest Day:</span>
                    <span className="font-medium">
                      {Object.entries(weeklySchedule).reduce((busiest, [day, classes]) => {
                        return classes.length > weeklySchedule[busiest]?.length ? day : busiest;
                      }, "Monday")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Free Days:</span>
                    <span className="font-medium">
                      {DAYS.filter(day => !weeklySchedule[day]?.length).length}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}