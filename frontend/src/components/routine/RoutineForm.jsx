// components/routine/RoutineForm.jsx - Updated for dynamic periods
import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { useCreateRoutineMutation, useUpdateRoutineMutation } from "@/features/apis/routineApi";
import { useAppSelector } from "@/features/store";
import { toast } from "react-toastify";
import { AlertCircle, Check, Clock, BookOpen, User, Calendar, MapPin } from "lucide-react";

// Theme hook
const useTheme = () => {
    const isDarkMode = useAppSelector((state) => state.global.isDarkMode);
    return {
        isDarkMode,
        bg: isDarkMode ? "bg-gray-900" : "bg-white",
        text: isDarkMode ? "text-white" : "text-gray-900",
        textSecondary: isDarkMode ? "text-gray-300" : "text-gray-700",
        textMuted: isDarkMode ? "text-gray-400" : "text-gray-500",
        border: isDarkMode ? "border-gray-700" : "border-gray-200",
        bgInput: isDarkMode ? "bg-gray-800" : "bg-white",
        borderInput: isDarkMode ? "border-gray-700" : "border-gray-300",
        focusRing: "focus:ring-blue-500 focus:border-blue-500",
        placeholder: isDarkMode ? "placeholder:text-gray-500" : "placeholder:text-gray-400",
        dialog: isDarkMode ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200",
        select: {
            trigger: isDarkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-300 text-gray-900",
            content: isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white",
            item: isDarkMode ? "text-gray-300 hover:bg-gray-700" : "text-gray-900 hover:bg-gray-100",
        },
        button: {
            primary: isDarkMode ? "bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-700 disabled:text-gray-400" : "bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-300 disabled:text-gray-500",
            outline: isDarkMode ? "border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white" : "border-gray-300 text-gray-700 hover:bg-gray-50",
        },
        divider: isDarkMode ? "border-gray-700" : "border-gray-200",
        infoBox: isDarkMode ? "bg-gray-800/50 border-gray-700" : "bg-gray-50 border-gray-200",
        infoText: isDarkMode ? "text-gray-300" : "text-gray-600",
        durationBox: isDarkMode ? "bg-blue-500/10 border-blue-500/20" : "bg-blue-50 border-blue-200",
        durationText: isDarkMode ? "text-blue-400" : "text-blue-700",
        errorText: "text-red-500",
        helperText: isDarkMode ? "text-gray-400" : "text-gray-500",
        icon: isDarkMode ? "text-gray-400" : "text-gray-500",
    };
};

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
    const theme = useTheme();
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

    const watchedClass = watch("class");
    const selectedStartTime = watch("startTime");
    const selectedEndTime = watch("endTime");
    const selectedDay = watch("day");

    // Input base class
    const inputClass = `${theme.bgInput} ${theme.borderInput} ${theme.focusRing} text-gray-900 dark:text-white ${theme.placeholder}`;

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
        if (watchedClass && classes.length > 0) {
            const classObj = classes.find(c => c._id === watchedClass);
            setSelectedClass(classObj);
        }
    }, [watchedClass, classes]);

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

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className={`sm:max-w-[500px] lg:max-w-[700px] max-h-[90vh] overflow-y-auto ${theme.dialog}`}>
                <DialogHeader>
                    <DialogTitle className={`flex items-center gap-2 ${theme.text}`}>
                        <Clock className="w-5 h-5" />
                        {mode === "edit" ? "Edit Routine" : "Add Subject to Period"}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    {/* Class & Room Number */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label className={theme.textSecondary}>Class *</Label>
                            <Select 
                                onValueChange={(value) => setValue("class", value)} 
                                value={watch("class")}
                                disabled={mode === "create" && initialData?.classId}
                            >
                                <SelectTrigger className={`${theme.select.trigger} ${errors.class ? "border-red-500" : ""}`}>
                                    <SelectValue placeholder="Select class" />
                                </SelectTrigger>
                                <SelectContent className={theme.select.content}>
                                    {classes.map((classItem) => (
                                        <SelectItem key={classItem._id} value={classItem._id} className={theme.select.item}>
                                            <div className="flex items-center gap-2">
                                                <BookOpen className="w-3.5 h-3.5" />
                                                <span>{classItem.name}</span>
                                                {classItem.section?.name && (
                                                    <span className={`text-xs ${theme.textMuted}`}>
                                                        ({classItem.section.name})
                                                    </span>
                                                )}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.class && (
                                <p className={`text-xs ${theme.errorText} flex items-center gap-1 mt-1`}>
                                    <AlertCircle className="w-3 h-3" />
                                    {errors.class.message}
                                </p>
                            )}
                        </div>
                        <div className="space-y-1.5">
                            <Label className={theme.textSecondary}>Room Number</Label>
                            <Input
                                {...register("roomNumber")}
                                placeholder="e.g., Room 101"
                                className={inputClass}
                            />
                        </div>
                    </div>

                    {/* Selected Class Info */}
                    {selectedClass && (
                        <div className={`flex items-center gap-2 p-2.5 rounded-md border ${theme.infoBox}`}>
                            <BookOpen className={`w-4 h-4 ${theme.icon}`} />
                            <span className={`text-sm ${theme.infoText}`}>
                                Class: <span className={`font-medium ${theme.text}`}>{selectedClass.name}</span>
                                {selectedClass.section?.name && (
                                    <> | Section: <span className={`font-medium ${theme.text}`}>{selectedClass.section.name}</span></>
                                )}
                            </span>
                        </div>
                    )}

                    {/* Day & Period Number */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label className={theme.textSecondary}>Day *</Label>
                            <Select 
                                onValueChange={(value) => setValue("day", value)} 
                                value={selectedDay}
                            >
                                <SelectTrigger className={`${theme.select.trigger} ${errors.day ? "border-red-500" : ""}`}>
                                    <SelectValue placeholder="Select day" />
                                </SelectTrigger>
                                <SelectContent className={theme.select.content}>
                                    {DAYS.map((day) => (
                                        <SelectItem key={day} value={day} className={theme.select.item}>
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-3.5 h-3.5" />
                                                <span>{day}</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.day && (
                                <p className={`text-xs ${theme.errorText} flex items-center gap-1 mt-1`}>
                                    <AlertCircle className="w-3 h-3" />
                                    {errors.day.message}
                                </p>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <Label className={theme.textSecondary}>Period Number *</Label>
                            <Input
                                type="number"
                                min="1"
                                {...register("periodNumber", { 
                                    required: "Period number is required",
                                    valueAsNumber: true,
                                    min: { value: 1, message: "Minimum period is 1" }
                                })}
                                disabled={mode === "create" && initialData?.periodNumber}
                                className={`${inputClass} ${errors.periodNumber ? "border-red-500" : ""}`}
                            />
                            {errors.periodNumber && (
                                <p className={`text-xs ${theme.errorText} flex items-center gap-1 mt-1`}>
                                    <AlertCircle className="w-3 h-3" />
                                    {errors.periodNumber.message}
                                </p>
                            )}
                            <p className={`text-xs ${theme.helperText}`}>
                                Next available period: <span className="font-medium">{nextPeriodNumber}</span>
                            </p>
                        </div>
                    </div>

                    {/* Subject & Teacher */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label className={theme.textSecondary}>Subject *</Label>
                            <Select 
                                onValueChange={(value) => setValue("subject", value)} 
                                value={watch("subject")}
                            >
                                <SelectTrigger className={`${theme.select.trigger} ${errors.subject ? "border-red-500" : ""}`}>
                                    <SelectValue placeholder="Select subject" />
                                </SelectTrigger>
                                <SelectContent className={theme.select.content}>
                                    {subjects.map((subject) => (
                                        <SelectItem key={subject._id} value={subject._id} className={theme.select.item}>
                                            <div className="flex items-center gap-2">
                                                <BookOpen className="w-3.5 h-3.5" />
                                                <span>{subject.name}</span>
                                                <span className={`text-xs ${theme.textMuted}`}>
                                                    ({subject.code})
                                                </span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.subject && (
                                <p className={`text-xs ${theme.errorText} flex items-center gap-1 mt-1`}>
                                    <AlertCircle className="w-3 h-3" />
                                    {errors.subject.message}
                                </p>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <Label className={theme.textSecondary}>Teacher *</Label>
                            <Select 
                                onValueChange={(value) => setValue("teacher", value)} 
                                value={watch("teacher")}
                            >
                                <SelectTrigger className={`${theme.select.trigger} ${errors.teacher ? "border-red-500" : ""}`}>
                                    <SelectValue placeholder="Select teacher" />
                                </SelectTrigger>
                                <SelectContent className={theme.select.content}>
                                    {teachers.map((teacher) => (
                                        <SelectItem key={teacher._id} value={teacher._id} className={theme.select.item}>
                                            <div className="flex items-center gap-2">
                                                <User className="w-3.5 h-3.5" />
                                                <span>{teacher.user?.name}</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.teacher && (
                                <p className={`text-xs ${theme.errorText} flex items-center gap-1 mt-1`}>
                                    <AlertCircle className="w-3 h-3" />
                                    {errors.teacher.message}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Start & End Time */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label className={theme.textSecondary}>Start Time *</Label>
                            <Input
                                type="time"
                                {...register("startTime", { 
                                    required: "Start time is required",
                                    validate: value => {
                                        const end = watch("endTime");
                                        return value < end || "Start time must be before end time";
                                    }
                                })}
                                className={`${inputClass} ${errors.startTime ? "border-red-500" : ""}`}
                            />
                            {errors.startTime && (
                                <p className={`text-xs ${theme.errorText} flex items-center gap-1 mt-1`}>
                                    <AlertCircle className="w-3 h-3" />
                                    {errors.startTime.message}
                                </p>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <Label className={theme.textSecondary}>End Time *</Label>
                            <Input
                                type="time"
                                {...register("endTime", { 
                                    required: "End time is required",
                                    validate: value => {
                                        const start = watch("startTime");
                                        return value > start || "End time must be after start time";
                                    }
                                })}
                                className={`${inputClass} ${errors.endTime ? "border-red-500" : ""}`}
                            />
                            {errors.endTime && (
                                <p className={`text-xs ${theme.errorText} flex items-center gap-1 mt-1`}>
                                    <AlertCircle className="w-3 h-3" />
                                    {errors.endTime.message}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Duration Display */}
                    {selectedStartTime && selectedEndTime && (
                        <div className={`flex items-center gap-2 p-3 rounded-md border ${theme.durationBox}`}>
                            <Clock className={`w-4 h-4 ${theme.durationText}`} />
                            <p className={`text-sm ${theme.durationText}`}>
                                Duration: {selectedStartTime} - {selectedEndTime} 
                                ({calculateDuration(selectedStartTime, selectedEndTime)})
                            </p>
                        </div>
                    )}

                    <DialogFooter className={`pt-4 border-t ${theme.divider}`}>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            className={theme.button.outline}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={creating || updating}
                            className={theme.button.primary}
                        >
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