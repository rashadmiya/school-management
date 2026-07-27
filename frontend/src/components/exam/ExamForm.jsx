// components/exams/ExamForm.jsx
import React, { useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { useCreateExamMutation, useUpdateExamMutation } from "@/features/apis/examsApi";
import { toast } from "react-toastify";

const TIME_SLOTS = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
  "16:00", "16:30", "17:00"
];

export default function ExamForm({
  open,
  onOpenChange,
  initialData,
  classes = [],
  subjects = []
}) {
  const [createExam, { isLoading: creating }] = useCreateExamMutation();
  const [updateExam, { isLoading: updating }] = useUpdateExamMutation();

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      title: "",
      class: "",
      subject: "",
      date: "",
      startTime: "09:00",
      endTime: "10:00",
      totalMarks: ""
    }
  });

  useEffect(() => {
    if (open) {
      if (initialData) {
        // Edit mode
        const examDate = initialData.date ? new Date(initialData.date).toISOString().split('T')[0] : "";

        reset({
          title: initialData.title || "",
          class: initialData.class?._id || initialData.class || "",
          subject: initialData.subject?._id || initialData.subject || "",
          date: examDate,
          startTime: initialData.startTime || "09:00",
          endTime: initialData.endTime || "10:00",
          totalMarks: initialData.totalMarks?.toString() || ""
        });
      } else {
        // Create mode
        reset({
          title: "",
          class: "",
          subject: "",
          date: "",
          startTime: "09:00",
          endTime: "10:00",
          totalMarks: ""
        });
      }
    }
  }, [open, initialData, reset]);

  const onSubmit = async (data) => {
    try {
      const submitData = {
        ...data,
        totalMarks: parseInt(data.totalMarks)
      };

      if (initialData) {
        await updateExam({ id: initialData._id, ...submitData }).unwrap();
      } else {
        await createExam(submitData).unwrap();
      }
      onOpenChange(false);
    } catch (err) {
      console.error("Error saving exam:", err);
      toast.error(err?.data?.message || "Error saving exam");
    }
  };

  const isLoading = creating || updating;

  const selectedStartTime = watch("startTime");
  const selectedEndTime = watch("endTime");

  // Filter end times to be after start time
  const availableEndTimes = TIME_SLOTS.filter(time => time > selectedStartTime);

  // Calculate minimum date (today)
  const today = new Date().toISOString().split('T')[0];

  // Calculate duration
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

  return (

    <Dialog open={open} onOpenChange={onOpenChange}>

      <DialogContent className="sm:max-w-[550px] max-h-[90vh] p-0 flex flex-col rounded-xl">
        <DialogHeader className="px-6 pt-6 pb-2 border-b">
          <DialogTitle>{initialData ? "Edit Exam" : "Schedule New Exam"}</DialogTitle>
        </DialogHeader>

        {/* Scrollable Body */}
        <div className="px-6 py-4 overflow-y-auto flex-1 space-y-4">
          <form id="exam-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Exam Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Exam Title *</Label>
              <Input
                id="title"
                {...register("title", {
                  required: "Exam title is required",
                  minLength: {
                    value: 3,
                    message: "Title must be at least 3 characters"
                  }
                })}
                placeholder="e.g., Mid-Term, Final Exam, Unit Test, etc."
                className={errors.title ? "border-red-500" : ""}
              />
              {errors.title && (
                <p className="text-sm text-red-500">{errors.title.message}</p>
              )}
            </div>

            {/* Class Selection */}
            <div className="space-y-2">
              <Label htmlFor="class">Class *</Label>
              <Select onValueChange={(value) => setValue("class", value)} value={watch("class")}>
                <SelectTrigger className={errors.class ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((classItem) => (
                    <SelectItem key={classItem._id} value={classItem._id}>
                      {classItem.name} ({classItem?.section?.name || ""})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.class && (
                <p className="text-sm text-red-500">Class is required</p>
              )}
            </div>

            {/* Subject Selection */}
            <div className="space-y-2">
              <Label htmlFor="subject">Subject *</Label>
              <Select onValueChange={(value) => setValue("subject", value)} value={watch("subject")}>
                <SelectTrigger className={errors.subject ? "border-red-500" : ""}>
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
              {errors.subject && (
                <p className="text-sm text-red-500">Subject is required</p>
              )}
            </div>

            {/* Exam Date */}
            <div className="space-y-2">
              <Label htmlFor="date">Exam Date *</Label>
              <Input
                id="date"
                type="date"
                min={today}
                {...register("date", {
                  required: "Exam date is required",
                  validate: {
                    futureDate: (value) => {
                      const selectedDate = new Date(value);
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      return selectedDate >= today || "Exam date must be today or in the future";
                    }
                  }
                })}
                className={errors.date ? "border-red-500" : ""}
              />
              {errors.date && (
                <p className="text-sm text-red-500">{errors.date.message}</p>
              )}
            </div>

            {/* Time Selection */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime">Start Time *</Label>
                <Select onValueChange={(value) => setValue("startTime", value)} value={watch("startTime")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Start time" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_SLOTS.map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="endTime">End Time *</Label>
                <Select onValueChange={(value) => setValue("endTime", value)} value={watch("endTime")}>
                  <SelectTrigger>
                    <SelectValue placeholder="End time" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableEndTimes.map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Duration Display */}
            {selectedStartTime && selectedEndTime && (
              <div className="p-3 bg-blue-50 rounded-md">
                <p className="text-sm text-blue-700">
                  Duration: {selectedStartTime} - {selectedEndTime}
                  ({calculateDuration(selectedStartTime, selectedEndTime)})
                </p>
              </div>
            )}

            {/* Total Marks */}
            <div className="space-y-2">
              <Label htmlFor="totalMarks">Total Marks *</Label>
              <Input
                id="totalMarks"
                type="number"
                min="1"
                max="1000"
                {...register("totalMarks", {
                  required: "Total marks is required",
                  min: {
                    value: 1,
                    message: "Marks must be at least 1"
                  },
                  max: {
                    value: 1000,
                    message: "Marks cannot exceed 1000"
                  }
                })}
                placeholder="e.g., 100, 50, 75"
                className={errors.totalMarks ? "border-red-500" : ""}
              />
              {errors.totalMarks && (
                <p className="text-sm text-red-500">{errors.totalMarks.message}</p>
              )}
            </div>
          </form>
        </div>

        {/* Sticky Footer */}
        <DialogFooter className="px-6 py-4 border-t flex justify-end gap-2 bg-white">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="exam-form" disabled={isLoading}>
            {isLoading ? "Saving..." : initialData ? "Update Exam" : "Schedule Exam"}
          </Button>
        </DialogFooter>
      </DialogContent>

    </Dialog>
  );
}