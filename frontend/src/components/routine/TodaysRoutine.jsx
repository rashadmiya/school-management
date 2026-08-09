// components/routines/TodaysRoutine.jsx
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, User, MapPin } from "lucide-react";
import { useGetTodayRoutineQuery } from "@/features/apis/routineApi";
import { useAppSelector } from "@/features/store";

export default function TodaysRoutine({ classId }) {
  const isDarkMode = useAppSelector((state) => state.global.isDarkMode);
  const { data, isLoading } = useGetTodayRoutineQuery(classId);

  // Theme-based classes
  const theme = {
    textPrimary: isDarkMode ? "text-white" : "text-gray-900",
    textSecondary: isDarkMode ? "text-gray-300" : "text-gray-700",
    textMuted: isDarkMode ? "text-gray-400" : "text-gray-500",
    textLight: isDarkMode ? "text-gray-500" : "text-gray-400",
    border: isDarkMode ? "border-gray-700" : "border-gray-200",
    bgCard: isDarkMode ? "bg-gray-900/50" : "bg-white",
    bgHover: isDarkMode ? "hover:bg-gray-800/50" : "hover:bg-gray-50",
    badge: {
      default: isDarkMode 
        ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" 
        : "bg-green-100 text-green-800",
      current: isDarkMode 
        ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" 
        : "bg-green-100 text-green-800",
    },
    currentClass: {
      container: isDarkMode 
        ? "bg-emerald-500/10 border-emerald-500/20" 
        : "bg-green-50 border-green-200",
      title: isDarkMode ? "text-emerald-400" : "text-green-800",
    },
    classItem: {
      container: isDarkMode 
        ? "bg-gray-800/50 border-gray-700" 
        : "bg-white border-gray-200",
      title: isDarkMode ? "text-white" : "text-gray-900",
      subtitle: isDarkMode ? "text-gray-400" : "text-gray-600",
      time: isDarkMode ? "text-gray-300" : "text-gray-600",
    }
  };

  if (isLoading) {
    return (
      <Card className={isDarkMode ? "bg-gray-900/50 border-gray-800" : ""}>
        <CardContent className="p-6">
          <div className={`text-center ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
            Loading today's routine...
          </div>
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
    <Card className={`${isDarkMode ? "bg-gray-900/50 border-gray-800" : "bg-white border-gray-200"} shadow-sm`}>
      <CardHeader>
        <CardTitle className={`flex flex-wrap items-center justify-between gap-2 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
          <span>Today's Schedule ({day})</span>
          {currentClass && (
            <Badge variant="default" className={theme.badge.default}>
              Class in Progress
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {sortedRoutines.length === 0 ? (
          <div className={`text-center py-4 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
            No classes scheduled for today. Enjoy your day!
          </div>
        ) : (
          <>
            {/* Current Class Highlight */}
            {currentClass && (
              <div className={`border rounded-lg p-4 ${theme.currentClass.container}`}>
                <div className="flex items-center gap-2 mb-2">
                  <Clock className={`w-4 h-4 ${isDarkMode ? "text-emerald-400" : "text-green-600"}`} />
                  <span className={`font-medium ${theme.currentClass.title}`}>
                    Current Class
                  </span>
                </div>
                <ClassItem 
                  routine={currentClass} 
                  highlight 
                  isDarkMode={isDarkMode}
                />
              </div>
            )}

            {/* All Today's Classes */}
            <div className="space-y-3">
              {sortedRoutines.map((routine, index) => (
                <ClassItem 
                  key={routine._id} 
                  routine={routine} 
                  isCurrent={routine._id === currentClass?._id}
                  isDarkMode={isDarkMode}
                />
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function ClassItem({ routine, highlight = false, isCurrent = false, isDarkMode = false }) {
  return (
    <div className={`border rounded-lg p-3 ${
      highlight 
        ? isDarkMode 
          ? 'bg-emerald-500/10 border-emerald-500/20' 
          : 'bg-green-50 border-green-200'
        : isDarkMode 
          ? 'bg-gray-800/50 border-gray-700' 
          : 'bg-white border-gray-200'
    }`}>
      <div className="flex flex-wrap justify-between items-start gap-2 mb-2">
        <div className="flex-1">
          <h4 className={`font-medium ${
            highlight 
              ? isDarkMode ? 'text-emerald-400' : 'text-green-800'
              : isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            {routine.subject?.name}
          </h4>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {routine.subject?.code}
          </p>
        </div>
        <Badge 
          variant={isCurrent ? "default" : "outline"} 
          className={
            isCurrent 
              ? isDarkMode 
                ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" 
                : "bg-green-100 text-green-800"
              : isDarkMode 
                ? "border-gray-700 text-gray-300" 
                : ""
          }
        >
          {routine.startTime} - {routine.endTime}
        </Badge>
      </div>
      
      <div className={`flex flex-wrap items-center gap-4 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
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