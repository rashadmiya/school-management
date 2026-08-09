// components/routine/WeeklyTimetable.jsx
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { useGetClassSlotsQuery, useCreateRoutineMutation } from "@/features/apis/routineApi";
import RoutineForm from "./RoutineForm";
import { toast } from "react-toastify";
import { useAppSelector } from "@/features/store";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function WeeklyTimetable({ classId, className = "", classes = [], subjects = [], teachers = [] }) {
  const isDarkMode = useAppSelector((state) => state.global.isDarkMode);
  const [selectedDay, setSelectedDay] = useState(DAYS[0]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [periods, setPeriods] = useState([]);
  
  const { data: slotsData, isLoading, refetch } = useGetClassSlotsQuery({
    classId,
    day: selectedDay
  });
  
  const [createRoutine] = useCreateRoutineMutation();

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
    button: {
      default: isDarkMode 
        ? "bg-blue-600 hover:bg-blue-700 text-white" 
        : "bg-blue-600 hover:bg-blue-700 text-white",
      outline: isDarkMode 
        ? "border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white" 
        : "border-gray-200 text-gray-700 hover:bg-gray-50",
      ghost: isDarkMode 
        ? "text-gray-400 hover:text-white hover:bg-gray-800" 
        : "text-gray-500 hover:text-gray-700 hover:bg-gray-100",
      danger: isDarkMode
        ? "text-red-400 hover:text-red-300 hover:bg-red-500/10"
        : "text-red-500 hover:text-red-700 hover:bg-red-50",
    },
    slot: {
      occupied: isDarkMode 
        ? "bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/20" 
        : "bg-blue-50 hover:bg-blue-100",
      empty: isDarkMode 
        ? "bg-gray-800/50 hover:bg-gray-800 border-gray-700" 
        : "bg-gray-50 hover:bg-gray-100",
    }
  };

  useEffect(() => {
    if (slotsData?.slots) {
      const existingRoutines = slotsData.slots.filter(slot => slot.isOccupied);
      if (existingRoutines.length > 0) {
        const periodNumbers = existingRoutines.map(r => r.periodNumber);
        const maxPeriod = Math.max(...periodNumbers);
        const newPeriods = Array.from({ length: maxPeriod }, (_, i) => i + 1);
        setPeriods(newPeriods);
      } else {
        setPeriods([1]);
      }
    }
  }, [slotsData]);

  const handleSlotClick = (periodNumber) => {
    const existingSlot = slotsData?.slots?.find(slot => 
      slot.periodNumber === periodNumber && slot.isOccupied
    );
    
    if (existingSlot) {
      setSelectedSlot({
        ...existingSlot.routine,
        periodNumber,
        mode: "edit"
      });
    } else {
      setSelectedSlot({
        classId,
        day: selectedDay,
        periodNumber,
        mode: "create"
      });
    }
    setIsFormOpen(true);
  };

  const handleAddPeriod = () => {
    const newPeriodNumber = periods.length > 0 ? Math.max(...periods) + 1 : 1;
    setPeriods([...periods, newPeriodNumber]);
    
    setSelectedSlot({
      classId,
      day: selectedDay,
      periodNumber: newPeriodNumber,
      mode: "create"
    });
    setIsFormOpen(true);
  };

  const handleRemovePeriod = (periodNumber) => {
    if (periods.length <= 1) {
      toast.error("Cannot remove the last period");
      return;
    }
    
    const slot = slotsData?.slots?.find(s => s.periodNumber === periodNumber);
    if (slot?.isOccupied) {
      toast.error("Cannot remove period with assigned routine");
      return;
    }
    
    setPeriods(periods.filter(p => p !== periodNumber));
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setSelectedSlot(null);
    refetch();
  };

  if (isLoading) {
    return (
      <Card className={isDarkMode ? "bg-gray-900/50 border-gray-800" : ""}>
        <CardContent className="p-6">
          <div className={`text-center ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
            Loading timetable...
          </div>
        </CardContent>
      </Card>
    );
  }

  const getSlotData = (periodNumber) => {
    return slotsData?.slots?.find(slot => slot.periodNumber === periodNumber);
  };

  // Find the current class from classes array
  const currentClass = classes.find(c => c._id === classId);

  return (
    <>
      <Card className={`${isDarkMode ? "bg-gray-900/50 border-gray-800" : "bg-white border-gray-200"} shadow-sm`}>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className={isDarkMode ? "text-white" : "text-gray-900"}>
              Weekly Timetable {className && `- ${className}`}
            </CardTitle>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex flex-wrap gap-2">
                {DAYS.map(day => (
                  <Button
                    key={day}
                    variant={selectedDay === day ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedDay(day)}
                    className={
                      selectedDay === day 
                        ? theme.button.default 
                        : theme.button.outline
                    }
                  >
                    {day.substring(0, 3)}
                  </Button>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddPeriod}
                className={`flex items-center gap-2 ${theme.button.outline}`}
              >
                <Plus className="w-4 h-4" />
                Add Period
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className={`border p-2 font-medium text-center w-32 ${
                    isDarkMode 
                      ? "border-gray-700 bg-gray-800/50 text-gray-300" 
                      : "border-gray-200 bg-gray-50 text-gray-700"
                  }`}>
                    Period
                  </th>
                  <th className={`border p-2 font-medium text-center ${
                    isDarkMode 
                      ? "border-gray-700 bg-gray-800/50 text-gray-300" 
                      : "border-gray-200 bg-gray-50 text-gray-700"
                  }`}>
                    Time & Subject
                  </th>
                  <th className={`border p-2 font-medium text-center w-20 ${
                    isDarkMode 
                      ? "border-gray-700 bg-gray-800/50 text-gray-300" 
                      : "border-gray-200 bg-gray-50 text-gray-700"
                  }`}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {periods.map(periodNumber => {
                  const slot = getSlotData(periodNumber);
                  return (
                    <tr key={periodNumber}>
                      <td className={`border p-2 text-center ${
                        isDarkMode 
                          ? "border-gray-700 bg-gray-800/50 text-gray-300" 
                          : "border-gray-200 bg-gray-50 text-gray-700"
                      }`}>
                        <div className="font-mono text-lg font-bold">
                          {periodNumber}
                        </div>
                      </td>
                      <td 
                        className={`border p-4 min-h-[80px] cursor-pointer transition-colors ${
                          slot?.isOccupied 
                            ? theme.slot.occupied
                            : theme.slot.empty
                        } ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}
                        onClick={() => handleSlotClick(periodNumber)}
                      >
                        {slot?.isOccupied ? (
                          <div className="space-y-2">
                            <div className={`font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                              {slot.routine?.subject?.name}
                            </div>
                            <div className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                              {slot.routine?.teacher?.user?.name}
                              {slot.routine?.roomNumber && ` • ${slot.routine.roomNumber}`}
                            </div>
                            <div className={`text-sm font-mono ${isDarkMode ? "text-blue-400" : "text-blue-600"}`}>
                              {slot.routine?.startTime} - {slot.routine?.endTime}
                            </div>
                          </div>
                        ) : (
                          <div className={`flex items-center justify-center gap-2 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                            <Plus className="w-4 h-4" />
                            <span>Click to add subject</span>
                          </div>
                        )}
                      </td>
                      <td className={`border p-2 text-center ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
                        {!slot?.isOccupied && periods.length > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemovePeriod(periodNumber);
                            }}
                            className={theme.button.danger}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className={`mt-4 text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
            <p>• Click on any period to add or edit routine</p>
            <p>• Add more periods using the "Add Period" button</p>
            <p>• Remove empty periods using the trash icon</p>
          </div>
        </CardContent>
      </Card>

      {isFormOpen && selectedSlot && (
        <RoutineForm
          open={isFormOpen}
          onOpenChange={handleFormClose}
          initialData={selectedSlot}
          mode={selectedSlot.mode}
          classes={classes}
          subjects={subjects}
          teachers={teachers}
          nextPeriodNumber={periods.length + 1}
          isDarkMode={isDarkMode}
        />
      )}
    </>
  );
}