// Updated WeeklyTimetable.jsx - Pass props to RoutineForm
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { useGetClassSlotsQuery, useCreateRoutineMutation } from "@/features/apis/routineApi";
import RoutineForm from "./RoutineForm";
import { toast } from "react-toastify";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function WeeklyTimetable({ classId, className = "", classes = [], subjects = [], teachers = [] }) {
  const [selectedDay, setSelectedDay] = useState(DAYS[0]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [periods, setPeriods] = useState([]);
  
  const { data: slotsData, isLoading, refetch } = useGetClassSlotsQuery({
    classId,
    day: selectedDay
  });
  
  const [createRoutine] = useCreateRoutineMutation();

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
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading timetable...</div>
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
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle>Weekly Timetable {className && `- ${className}`}</CardTitle>
            <div className="flex items-center gap-4">
              <div className="flex gap-2">
                {DAYS.map(day => (
                  <Button
                    key={day}
                    variant={selectedDay === day ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedDay(day)}
                  >
                    {day.substring(0, 3)}
                  </Button>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddPeriod}
                className="flex items-center gap-2"
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
                  <th className="border p-2 bg-gray-50 font-medium text-center w-32">
                    Period
                  </th>
                  <th className="border p-2 bg-gray-50 font-medium text-center">
                    Time & Subject
                  </th>
                  <th className="border p-2 bg-gray-50 font-medium text-center w-20">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {periods.map(periodNumber => {
                  const slot = getSlotData(periodNumber);
                  return (
                    <tr key={periodNumber}>
                      <td className="border p-2 bg-gray-50 text-center">
                        <div className="font-mono text-lg font-bold">
                          {periodNumber}
                        </div>
                      </td>
                      <td 
                        className={`border p-4 min-h-[80px] cursor-pointer transition-colors ${
                          slot?.isOccupied 
                            ? "bg-blue-50 hover:bg-blue-100" 
                            : "bg-gray-50 hover:bg-gray-100"
                        }`}
                        onClick={() => handleSlotClick(periodNumber)}
                      >
                        {slot?.isOccupied ? (
                          <div className="space-y-2">
                            <div className="font-medium">{slot.routine?.subject?.name}</div>
                            <div className="text-sm text-gray-600">
                              {slot.routine?.teacher?.user?.name}
                              {slot.routine?.roomNumber && ` • ${slot.routine.roomNumber}`}
                            </div>
                            <div className="text-sm font-mono text-blue-600">
                              {slot.routine?.startTime} - {slot.routine?.endTime}
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-2 text-gray-400">
                            <Plus className="w-4 h-4" />
                            <span>Click to add subject</span>
                          </div>
                        )}
                      </td>
                      <td className="border p-2 text-center">
                        {!slot?.isOccupied && periods.length > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemovePeriod(periodNumber);
                            }}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
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
          <div className="mt-4 text-sm text-gray-500">
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
        />
      )}
    </>
  );
}

// // components/routine/WeeklyTimetable.jsx
// import React, { useState, useEffect } from "react";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Plus } from "lucide-react";
// import { useGetClassSlotsQuery, useGetRoutinesQuery } from "@/features/apis/routineApi";
// import RoutineForm from "./RoutineForm";
// import { useGetClassesQuery } from "@/features/apis/classesApi";
// import { useGetSubjectsQuery } from "@/features/apis/subjectsApi";
// import { useGetTeachersQuery } from "@/features/apis/teachersApi";

// const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

// export default function WeeklyTimetable({ classId, className = "" }) {
//   const [selectedDay, setSelectedDay] = useState(DAYS[0]);
//   const [selectedSlot, setSelectedSlot] = useState(null);
//   const [isFormOpen, setIsFormOpen] = useState(false);

//   const { data: classesData } = useGetClassesQuery();
//   const { data: subjectsData } = useGetSubjectsQuery();
//   const { data: teachersData } = useGetTeachersQuery();

//   const classes = classesData?.classes || classesData?.docs || [];
//   const subjects = subjectsData?.subjects || subjectsData?.docs || [];
//   const teachers = teachersData?.teachers || teachersData?.docs || [];

//   // Get slots for selected day
//   const { data: slotsData, isLoading, refetch } = useGetClassSlotsQuery({
//     classId,
//     day: selectedDay
//   });

//   // Get all routines for this class
//   const { data: routinesData } = useGetRoutinesQuery({
//     class: classId
//   });

//   const slots = slotsData?.slots || [];
//   const routines = routinesData?.routines || [];

//   const handleSlotClick = (slot) => {
//     if (slot.isOccupied) {
//       // Show routine details
//       console.log("Occupied slot:", slot.routine);
//     } else {
//       // Open form to add routine
//       setSelectedSlot({
//         classId,
//         day: selectedDay,
//         periodNumber: slot.periodNumber
//       });
//       setIsFormOpen(true);
//     }
//   };

//   const handleFormClose = () => {
//     setIsFormOpen(false);
//     setSelectedSlot(null);
//     refetch();
//   };

//   if (isLoading) {
//     return (
//       <Card>
//         <CardContent className="p-6">
//           <div className="text-center">Loading timetable...</div>
//         </CardContent>
//       </Card>
//     );
//   }

//   return (
//     <>
//       <Card>
//         <CardHeader>
//           <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
//             <CardTitle>Weekly Timetable {className && `- ${className}`}</CardTitle>
//             <div className="flex items-center gap-4">
//               {/* Day Selector */}
//               <div className="flex gap-2">
//                 {DAYS.map(day => (
//                   <Button
//                     key={day}
//                     variant={selectedDay === day ? "default" : "outline"}
//                     size="sm"
//                     onClick={() => setSelectedDay(day)}
//                   >
//                     {day.substring(0, 3)}
//                   </Button>
//                 ))}
//               </div>
//             </div>
//           </div>
//         </CardHeader>
//         <CardContent>
//           <div className="overflow-x-auto">
//             <table className="w-full border-collapse">
//               <thead>
//                 <tr>
//                   <th className="border p-2 bg-gray-50 font-medium text-center w-24">
//                     Period
//                   </th>
//                   <th className="border p-2 bg-gray-50 font-medium text-center">
//                     Time & Subject
//                   </th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {slots.map(slot => (
//                   <tr key={slot.periodNumber}>
//                     <td className="border p-2 bg-gray-50 text-center font-mono">
//                       {slot.periodNumber}
//                     </td>
//                     <td
//                       className={`border p-4 min-h-[80px] cursor-pointer transition-colors ${slot.isOccupied
//                           ? "bg-blue-50 hover:bg-blue-100"
//                           : "bg-gray-50 hover:bg-gray-100"
//                         }`}
//                       onClick={() => handleSlotClick(slot)}
//                     >
//                       {slot.isOccupied ? (
//                         <div className="space-y-2">
//                           <div className="font-medium">{slot.routine?.subject?.name}</div>
//                           <div className="text-sm text-gray-600">
//                             {slot.routine?.teacher?.user?.name}
//                             {slot.routine?.roomNumber && ` • ${slot.routine.roomNumber}`}
//                           </div>
//                           <div className="text-sm font-mono text-blue-600">
//                             {slot.routine?.startTime} - {slot.routine?.endTime}
//                           </div>
//                         </div>
//                       ) : (
//                         <div className="flex items-center justify-center gap-2 text-gray-400">
//                           <Plus className="w-4 h-4" />
//                           <span>Add Subject</span>
//                         </div>
//                       )}
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         </CardContent>
//       </Card>

//       {/* Routine Form */}
//       {isFormOpen && selectedSlot && (
//         <RoutineForm
//           open={isFormOpen}
//           onOpenChange={handleFormClose}
//           initialData={selectedSlot}
//           mode="create"
//           classes={classes}
//           teachers={teachers}
//           subjects={subjects}
//         />
//       )}
//     </>
//   );
// }

// // components/routines/WeeklyTimetable.jsx
// import React from "react";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { useGetRoutinesQuery } from "@/features/apis/routineApi";

// const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
// const TIME_SLOTS = [
//   "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"
// ];

// export default function WeeklyTimetable({ classId, className = "" }) {
//   const { data, isLoading } = useGetRoutinesQuery(classId ? { class: classId } : {});

//   const routines = data?.routines || [];

//   // Group routines by day and time
//   const timetableData = {};
//   DAYS.forEach(day => {
//     timetableData[day] = {};
//     TIME_SLOTS.forEach(time => {
//       timetableData[day][time] = routines.filter(routine =>
//         routine.day === day &&
//         routine.startTime <= time &&
//         routine.endTime > time
//       );
//     });
//   });

//   if (isLoading) {
//     return (
//       <Card>
//         <CardContent className="p-6">
//           <div className="text-center">Loading timetable...</div>
//         </CardContent>
//       </Card>
//     );
//   }

//   return (
//     <Card className={className}>
//       <CardHeader>
//         <CardTitle>Weekly Timetable {className && `- ${className}`}</CardTitle>
//       </CardHeader>
//       <CardContent>
//         <div className="overflow-x-auto">
//           <table className="w-full border-collapse">
//             <thead>
//               <tr>
//                 <th className="border p-2 bg-gray-50 font-medium">Time</th>
//                 {DAYS.map(day => (
//                   <th key={day} className="border p-2 bg-gray-50 font-medium text-center">
//                     {day}
//                   </th>
//                 ))}
//               </tr>
//             </thead>
//             <tbody>
//               {TIME_SLOTS.map(time => (
//                 <tr key={time}>
//                   <td className="border p-2 bg-gray-50 font-mono text-sm text-center">
//                     {time}
//                   </td>
//                   {DAYS.map(day => (
//                     <td key={`${day}-${time}`} className="border p-2 min-w-[150px] h-20 align-top">
//                       {timetableData[day][time]?.map(routine => (
//                         <div
//                           key={routine._id}
//                           className="bg-blue-50 border border-blue-200 rounded p-2 mb-1 text-sm"
//                         >
//                           <div className="font-medium">{routine.subject?.name}</div>
//                           <div className="text-xs text-gray-600">
//                             {routine.teacher?.user?.name}
//                             {routine.roomNumber && ` • ${routine.roomNumber}`}
//                           </div>
//                           <div className="text-xs font-mono">
//                             {routine.startTime} - {routine.endTime}
//                           </div>
//                         </div>
//                       ))}
//                     </td>
//                   ))}
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       </CardContent>
//     </Card>
//   );
// }