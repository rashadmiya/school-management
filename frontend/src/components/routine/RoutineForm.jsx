// components/routine/RoutineForm.jsx - Updated for dynamic periods
import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { useCreateRoutineMutation, useUpdateRoutineMutation } from "@/features/apis/routineApi";
import { toast } from "react-toastify";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function RoutineForm({ 
  open, 
  onOpenChange, 
  initialData,
  mode = "create",
  classes = [],
  subjects = [],
  teachers = [],
  nextPeriodNumber = 1
}) {
  const [createRoutine, { isLoading: creating }] = useCreateRoutineMutation();
  const [updateRoutine, { isLoading: updating }] = useUpdateRoutineMutation();
  const [selectedClass, setSelectedClass] = useState(null);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      class: "",
      subject: "",
      teacher: "",
      day: DAYS[1],
      periodNumber: nextPeriodNumber,
      startTime: "08:00",
      endTime: "08:30",
      roomNumber: ""
    }
  });

  useEffect(() => {
    if (open && initialData) {
      const formData = {
        class: initialData.classId || initialData.class?._id || "",
        subject: initialData.subject?._id || "",
        teacher: initialData.teacher?._id || "",
        day: initialData.day || DAYS[1],
        periodNumber: initialData.periodNumber || nextPeriodNumber,
        startTime: initialData.startTime || "08:00",
        endTime: initialData.endTime || "08:30",
        roomNumber: initialData.roomNumber || ""
      };

      if (mode === "create" && formData.class && classes.length > 0) {
        const classObj = classes.find(c => c._id === formData.class);
        setSelectedClass(classObj);
      }

      reset(formData);
    } else if (open) {
      reset({
        class: "",
        subject: "",
        teacher: "",
        day: DAYS[1],
        periodNumber: nextPeriodNumber,
        startTime: "08:00",
        endTime: "08:30",
        roomNumber: ""
      });
      setSelectedClass(null);
    }
  }, [open, initialData, reset, mode, classes, nextPeriodNumber]);

  useEffect(() => {
    const classId = watch("class");
    if (classId && classes.length > 0) {
      const classObj = classes.find(c => c._id === classId);
      setSelectedClass(classObj);
    }
  }, [watch("class"), classes]);

  const onSubmit = async (data) => {
    try {
      if (mode === "edit" && initialData?._id) {
        await updateRoutine({ id: initialData._id, ...data }).unwrap();
        toast.success("Routine updated successfully!");
      } else {
        await createRoutine(data).unwrap();
        toast.success("Routine created successfully!");
      }
      onOpenChange(false);
    } catch (err) {
      toast.error(err?.data?.message || "Error saving routine");
    }
  };

  const calculateDuration = (start, end) => {
    const [startHour, startMinute] = start.split(':').map(Number);
    const [endHour, endMinute] = end.split(':').map(Number);
    
    const startTotal = startHour * 60 + startMinute;
    const endTotal = endHour * 60 + endMinute;
    const duration = endTotal - startTotal;
    
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes > 0 ? `${minutes}m` : ''}`;
    }
    return `${minutes}m`;
  };

  const selectedStartTime = watch("startTime");
  const selectedEndTime = watch("endTime");
  const selectedDay = watch("day");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "edit" ? "Edit Routine" : "Add Subject to Period"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="class">Class *</Label>
              <Select 
                onValueChange={(value) => setValue("class", value)} 
                value={watch("class")}
                disabled={mode === "create" && initialData?.classId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((classItem) => (
                    <SelectItem key={classItem._id} value={classItem._id}>
                      {classItem.name} {classItem.section?.name ? `- ${classItem.section.name}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.class && <p className="text-sm text-red-500">Class is required</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="roomNumber">Room Number</Label>
              <Input
                id="roomNumber"
                {...register("roomNumber")}
                placeholder="e.g., Room 101"
              />
            </div>
          </div>

          {selectedClass && (
            <div className="p-3 bg-gray-50 rounded-md">
              <p className="text-sm text-gray-600">
                Class: <span className="font-medium">{selectedClass.name}</span> | 
                Section: <span className="font-medium">{selectedClass.section?.name}</span>
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="day">Day *</Label>
              <Select 
                onValueChange={(value) => setValue("day", value)} 
                value={selectedDay}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select day" />
                </SelectTrigger>
                <SelectContent>
                  {DAYS.map((day) => (
                    <SelectItem key={day} value={day}>
                      {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="periodNumber">Period Number *</Label>
              <Input
                type="number"
                min="1"
                {...register("periodNumber", { 
                  required: "Period number is required",
                  valueAsNumber: true,
                  min: { value: 1, message: "Minimum period is 1" }
                })}
                disabled={mode === "create" && initialData?.periodNumber}
              />
              {errors.periodNumber && (
                <p className="text-sm text-red-500">{errors.periodNumber.message}</p>
              )}
              <p className="text-xs text-gray-500">
                Next available period: {nextPeriodNumber}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject *</Label>
              <Select 
                onValueChange={(value) => setValue("subject", value)} 
                value={watch("subject")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subject) => (
                    <SelectItem key={subject._id} value={subject._id}>
                      {subject.name} ({subject.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.subject && <p className="text-sm text-red-500">Subject is required</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="teacher">Teacher *</Label>
              <Select 
                onValueChange={(value) => setValue("teacher", value)} 
                value={watch("teacher")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select teacher" />
                </SelectTrigger>
                <SelectContent>
                  {teachers.map((teacher) => (
                    <SelectItem key={teacher._id} value={teacher._id}>
                      {teacher.user?.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.teacher && <p className="text-sm text-red-500">Teacher is required</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time *</Label>
              <Input
                type="time"
                {...register("startTime", { 
                  required: "Start time is required",
                  validate: value => {
                    const end = watch("endTime");
                    return value < end || "Start time must be before end time";
                  }
                })}
              />
              {errors.startTime && (
                <p className="text-sm text-red-500">{errors.startTime.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="endTime">End Time *</Label>
              <Input
                type="time"
                {...register("endTime", { 
                  required: "End time is required",
                  validate: value => {
                    const start = watch("startTime");
                    return value > start || "End time must be after start time";
                  }
                })}
              />
              {errors.endTime && (
                <p className="text-sm text-red-500">{errors.endTime.message}</p>
              )}
            </div>
          </div>

          {selectedStartTime && selectedEndTime && (
            <div className="p-3 bg-blue-50 rounded-md">
              <p className="text-sm text-blue-700">
                Duration: {selectedStartTime} - {selectedEndTime} 
                ({calculateDuration(selectedStartTime, selectedEndTime)})
              </p>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={creating || updating}>
              {(creating || updating) 
                ? "Saving..." 
                : mode === "edit" 
                  ? "Update Routine" 
                  : "Add Subject"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// // components/routines/RoutineForm.jsx
// import React, { useEffect } from "react";
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { useForm } from "react-hook-form";
// import { useCreateRoutineMutation, useUpdateRoutineMutation } from "@/features/apis/routineApi";
// import { toast } from "react-toastify";

// const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
// const TIME_SLOTS = [
//   "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
//   "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
//   "16:00", "16:30", "17:00"
// ];

// export default function RoutineForm({ 
//   open, 
//   onOpenChange, 
//   initialData,
//   classes = [],
//   subjects = [],
//   teachers = [] 
// }) {
//   const [createRoutine, { isLoading: creating }] = useCreateRoutineMutation();
//   const [updateRoutine, { isLoading: updating }] = useUpdateRoutineMutation();

//   const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
//     defaultValues: {
//       class: "",
//       subject: "",
//       teacher: "",
//       day: "Monday",
//       startTime: "08:00",
//       endTime: "08:30",
//       roomNumber: ""
//     }
//   });

//   useEffect(() => {
//     if (open) {
//       if (initialData) {
//         // Edit mode
//         reset({
//           class: initialData.class?._id || initialData.class,
//           subject: initialData.subject?._id || initialData.subject,
//           teacher: initialData.teacher?._id || initialData.teacher,
//           day: initialData.day,
//           startTime: initialData.startTime,
//           endTime: initialData.endTime,
//           roomNumber: initialData.roomNumber || ""
//         });
//       } else {
//         // Create mode
//         reset({
//           class: "",
//           subject: "",
//           teacher: "",
//           day: "Monday",
//           startTime: "08:00",
//           endTime: "08:30",
//           roomNumber: ""
//         });
//       }
//     }
//   }, [open, initialData, reset]);

//   const onSubmit = async (data) => {
//     try {
//       if (initialData) {
//         await updateRoutine({ id: initialData._id, ...data }).unwrap();
//       } else {
//         await createRoutine(data).unwrap();
//       }
//       onOpenChange(false);
//     } catch (err) {
//       console.error("Error saving routine:", err);
//       toast.error(err?.data?.message || "Error saving routine");
//     }
//   };

//   const isLoading = creating || updating;
//   const selectedStartTime = watch("startTime");
//   const selectedEndTime = watch("endTime");

//   // Filter end times to be after start time
//   const availableEndTimes = TIME_SLOTS.filter(time => time > selectedStartTime);

//   return (
//     <Dialog open={open} onOpenChange={onOpenChange}>
//       <DialogContent className="sm:max-w-[500px]">
//         <DialogHeader>
//           <DialogTitle>
//             {initialData ? "Edit Routine" : "Create New Routine"}
//           </DialogTitle>
//         </DialogHeader>

//         <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
//           {/* Class Selection */}
//           <div className="space-y-2">
//             <Label htmlFor="class">Class *</Label>
//             <Select onValueChange={(value) => setValue("class", value)} value={watch("class")}>
//               <SelectTrigger>
//                 <SelectValue placeholder="Select class" />
//               </SelectTrigger>
//               <SelectContent>
//                 {classes.map((classItem) => (
//                   <SelectItem key={classItem._id} value={classItem._id}>
//                     {classItem.name}
//                   </SelectItem>
//                 ))}
//               </SelectContent>
//             </Select>
//             {errors.class && <p className="text-sm text-red-500">Class is required</p>}
//           </div>

//           {/* Subject Selection */}
//           <div className="space-y-2">
//             <Label htmlFor="subject">Subject *</Label>
//             <Select onValueChange={(value) => setValue("subject", value)} value={watch("subject")}>
//               <SelectTrigger>
//                 <SelectValue placeholder="Select subject" />
//               </SelectTrigger>
//               <SelectContent>
//                 {subjects.map((subject) => (
//                   <SelectItem key={subject._id} value={subject._id}>
//                     {subject.name} ({subject.code})
//                   </SelectItem>
//                 ))}
//               </SelectContent>
//             </Select>
//             {errors.subject && <p className="text-sm text-red-500">Subject is required</p>}
//           </div>

//           {/* Teacher Selection */}
//           <div className="space-y-2">
//             <Label htmlFor="teacher">Teacher *</Label>
//             <Select onValueChange={(value) => setValue("teacher", value)} value={watch("teacher")}>
//               <SelectTrigger>
//                 <SelectValue placeholder="Select teacher" />
//               </SelectTrigger>
//               <SelectContent>
//                 {teachers.map((teacher) => (
//                   <SelectItem key={teacher._id} value={teacher._id}>
//                     {teacher.user?.name}
//                   </SelectItem>
//                 ))}
//               </SelectContent>
//             </Select>
//             {errors.teacher && <p className="text-sm text-red-500">Teacher is required</p>}
//           </div>

//           {/* Day Selection */}
//           <div className="space-y-2">
//             <Label htmlFor="day">Day *</Label>
//             <Select onValueChange={(value) => setValue("day", value)} value={watch("day")}>
//               <SelectTrigger>
//                 <SelectValue placeholder="Select day" />
//               </SelectTrigger>
//               <SelectContent>
//                 {DAYS.map((day) => (
//                   <SelectItem key={day} value={day}>
//                     {day}
//                   </SelectItem>
//                 ))}
//               </SelectContent>
//             </Select>
//           </div>

//           {/* Time Selection */}
//           <div className="grid grid-cols-2 gap-4">
//             <div className="space-y-2">
//               <Label htmlFor="startTime">Start Time *</Label>
//               <Select onValueChange={(value) => setValue("startTime", value)} value={watch("startTime")}>
//                 <SelectTrigger>
//                   <SelectValue placeholder="Start time" />
//                 </SelectTrigger>
//                 <SelectContent>
//                   {TIME_SLOTS.map((time) => (
//                     <SelectItem key={time} value={time}>
//                       {time}
//                     </SelectItem>
//                   ))}
//                 </SelectContent>
//               </Select>
//             </div>

//             <div className="space-y-2">
//               <Label htmlFor="endTime">End Time *</Label>
//               <Select onValueChange={(value) => setValue("endTime", value)} value={watch("endTime")}>
//                 <SelectTrigger>
//                   <SelectValue placeholder="End time" />
//                 </SelectTrigger>
//                 <SelectContent>
//                   {availableEndTimes.map((time) => (
//                     <SelectItem key={time} value={time}>
//                       {time}
//                     </SelectItem>
//                   ))}
//                 </SelectContent>
//               </Select>
//             </div>
//           </div>

//           {/* Room Number */}
//           <div className="space-y-2">
//             <Label htmlFor="roomNumber">Room Number</Label>
//             <Input
//               id="roomNumber"
//               {...register("roomNumber")}
//               placeholder="e.g., Room 101"
//             />
//           </div>

//           {/* Duration Display */}
//           {selectedStartTime && selectedEndTime && (
//             <div className="p-3 bg-blue-50 rounded-md">
//               <p className="text-sm text-blue-700">
//                 Duration: {selectedStartTime} - {selectedEndTime} 
//                 ({calculateDuration(selectedStartTime, selectedEndTime)})
//               </p>
//             </div>
//           )}

//           <DialogFooter>
//             <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
//               Cancel
//             </Button>
//             <Button type="submit" disabled={isLoading}>
//               {isLoading ? "Saving..." : initialData ? "Update Routine" : "Create Routine"}
//             </Button>
//           </DialogFooter>
//         </form>
//       </DialogContent>
//     </Dialog>
//   );
// }

// // Helper function to calculate duration
// function calculateDuration(startTime, endTime) {
//   const [startHour, startMinute] = startTime.split(':').map(Number);
//   const [endHour, endMinute] = endTime.split(':').map(Number);
  
//   const startTotal = startHour * 60 + startMinute;
//   const endTotal = endHour * 60 + endMinute;
//   const duration = endTotal - startTotal;
  
//   const hours = Math.floor(duration / 60);
//   const minutes = duration % 60;
  
//   if (hours > 0) {
//     return `${hours}h ${minutes > 0 ? `${minutes}m` : ''}`;
//   }
//   return `${minutes}m`;
// }