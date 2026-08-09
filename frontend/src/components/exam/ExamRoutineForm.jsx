// components/exam/ExamRoutineForm.jsx
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useGetClassesQuery } from "@/features/apis/classesApi";
import { useCreateExamRoutineMutation, useUpdateExamRoutineMutation } from "@/features/apis/examRoutineApi";
import { useGetSubjectsQuery } from "@/features/apis/subjectsApi";
import { useGetTeachersQuery } from "@/features/apis/teachersApi";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { MultiSelect } from "../common/MultiSelect";

const EXAM_TYPES = [
    { value: 'midterm', label: 'Mid-Term Exam' },
    { value: 'final', label: 'Final Exam' },
    { value: 'term', label: 'Term Exam' },
    { value: 'weekly', label: 'Weekly Test' },
    { value: 'monthly', label: 'Monthly Test' },
    { value: 'others', label: 'Others' }
];

export default function ExamRoutineForm({ open, onOpenChange, initialData, isDarkMode = false }) {
    const [createExamRoutine, { isLoading: creating }] = useCreateExamRoutineMutation();
    const [updateExamRoutine, { isLoading: updating }] = useUpdateExamRoutineMutation();
    
    const { data: classesData } = useGetClassesQuery();
    const { data: subjectsData } = useGetSubjectsQuery();
    const { data: teachersData } = useGetTeachersQuery();

    const classes = classesData?.classes || [];
    const subjects = subjectsData?.subjects || [];
    const teachers = teachersData?.teachers || [];

    // Theme-based classes
    const theme = {
        textPrimary: isDarkMode ? "text-white" : "text-gray-900",
        textSecondary: isDarkMode ? "text-gray-300" : "text-gray-700",
        textMuted: isDarkMode ? "text-gray-400" : "text-gray-500",
        textLight: isDarkMode ? "text-gray-500" : "text-gray-400",
        border: isDarkMode ? "border-gray-700" : "border-gray-200",
        bgCard: isDarkMode ? "bg-gray-900" : "bg-white",
        bgInput: isDarkMode ? "bg-gray-800" : "bg-white",
        inputBorder: isDarkMode ? "border-gray-700" : "border-gray-200",
        bgSelect: isDarkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-200 text-gray-900",
        bgSelectContent: isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white",
        selectItem: isDarkMode ? "text-gray-300 hover:bg-gray-700" : "text-gray-900 hover:bg-gray-100",
        bgDialog: isDarkMode ? "bg-gray-900 border-gray-800" : "bg-white",
        bgAlert: isDarkMode ? "bg-blue-500/10 border-blue-500/20" : "bg-blue-50",
        textAlert: isDarkMode ? "text-blue-400" : "text-blue-700",
        button: {
            primary: isDarkMode 
                ? "bg-blue-600 hover:bg-blue-700 text-white" 
                : "bg-blue-600 hover:bg-blue-700 text-white",
            outline: isDarkMode 
                ? "border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white" 
                : "border-gray-200 text-gray-700 hover:bg-gray-50",
        },
        input: isDarkMode 
            ? "bg-gray-800 border-gray-700 text-white placeholder:text-gray-500" 
            : "bg-white border-gray-200 text-gray-900",
        label: isDarkMode ? "text-gray-300" : "text-gray-700",
        error: "text-red-500",
        switch: isDarkMode 
            ? "data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-gray-700" 
            : "",
    };

    const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
        defaultValues: {
            examType: 'midterm',
            title: '',
            academicYear: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
            examDate: '',
            startTime: '09:00',
            endTime: '12:00',
            subject: '',
            class: '',
            roomNumber: '',
            monitoringTeachers: [],
            totalMarks: 100,
            passingMarks: 33,
            instructions: '',
            isPublished: false
        }
    });

    useEffect(() => {
        if (open) {
            if (initialData) {
                const formattedDate = initialData.examDate 
                    ? new Date(initialData.examDate).toISOString().split('T')[0]
                    : '';
                
                reset({
                    examType: initialData.examType || 'midterm',
                    title: initialData.title || '',
                    academicYear: initialData.academicYear || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
                    examDate: formattedDate,
                    startTime: initialData.startTime || '09:00',
                    endTime: initialData.endTime || '12:00',
                    subject: initialData.subject?._id || initialData.subject || '',
                    class: initialData.class?._id || initialData.class || '',
                    roomNumber: initialData.roomNumber || '',
                    monitoringTeachers: initialData.monitoringTeachers?.map(t => t._id) || [],
                    totalMarks: initialData.totalMarks || 100,
                    passingMarks: initialData.passingMarks || 33,
                    instructions: initialData.instructions || '',
                    isPublished: initialData.isPublished || false
                });
            } else {
                reset({
                    examType: 'midterm',
                    title: '',
                    academicYear: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
                    examDate: '',
                    startTime: '09:00',
                    endTime: '12:00',
                    subject: '',
                    class: '',
                    roomNumber: '',
                    monitoringTeachers: [],
                    totalMarks: 100,
                    passingMarks: 33,
                    instructions: '',
                    isPublished: false
                });
            }
        }
    }, [open, initialData, reset]);

    const onSubmit = async (data) => {
        try {
            if (initialData) {
                await updateExamRoutine({ id: initialData._id, ...data }).unwrap();
                toast.success("Exam routine updated successfully!");
            } else {
                await createExamRoutine(data).unwrap();
                toast.success("Exam routine created successfully!");
            }
            onOpenChange(false);
        } catch (err) {
            toast.error(err?.data?.message || "Error saving exam routine");
        }
    };

    const isLoading = creating || updating;
    const selectedStartTime = watch("startTime");
    const selectedEndTime = watch("endTime");
    const selectedTeachers = watch("monitoringTeachers") || [];

    const teacherOptions = teachers.map(teacher => ({
        value: teacher._id,
        label: teacher.user?.name || `Teacher ${teacher._id}`
    }));

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className={`sm:max-w-[600px] max-h-[90vh] overflow-y-auto ${theme.bgDialog} ${isDarkMode ? "text-white" : ""}`}>
                <DialogHeader>
                    <DialogTitle className={isDarkMode ? "text-white" : "text-gray-900"}>
                        {initialData ? "Edit Exam Routine" : "Create New Exam Routine"}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className={theme.label}>Exam Type *</Label>
                            <Select 
                                onValueChange={(value) => setValue("examType", value)} 
                                value={watch("examType")}
                            >
                                <SelectTrigger className={theme.bgSelect}>
                                    <SelectValue placeholder="Select exam type" />
                                </SelectTrigger>
                                <SelectContent className={theme.bgSelectContent}>
                                    {EXAM_TYPES.map(type => (
                                        <SelectItem key={type.value} value={type.value} className={theme.selectItem}>
                                            {type.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.examType && <p className={`text-sm ${theme.error}`}>{errors.examType.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label className={theme.label}>Exam Title *</Label>
                            <Input
                                id="title"
                                {...register("title", { required: "Exam title is required" })}
                                placeholder="e.g., Final Examination 2024"
                                className={`${theme.input} ${errors.title ? "border-red-500" : ""}`}
                            />
                            {errors.title && <p className={`text-sm ${theme.error}`}>{errors.title.message}</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className={theme.label}>Academic Year *</Label>
                            <Input
                                id="academicYear"
                                {...register("academicYear", { required: "Academic year is required" })}
                                placeholder="e.g., 2024-2025"
                                className={`${theme.input} ${errors.academicYear ? "border-red-500" : ""}`}
                            />
                            {errors.academicYear && <p className={`text-sm ${theme.error}`}>{errors.academicYear.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label className={theme.label}>Exam Date *</Label>
                            <Input
                                type="date"
                                id="examDate"
                                {...register("examDate", { required: "Exam date is required" })}
                                className={`${theme.input} ${errors.examDate ? "border-red-500" : ""}`}
                            />
                            {errors.examDate && <p className={`text-sm ${theme.error}`}>{errors.examDate.message}</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className={theme.label}>Start Time *</Label>
                            <Input
                                type="time"
                                id="startTime"
                                {...register("startTime", { required: "Start time is required" })}
                                className={`${theme.input} ${errors.startTime ? "border-red-500" : ""}`}
                            />
                            {errors.startTime && <p className={`text-sm ${theme.error}`}>{errors.startTime.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label className={theme.label}>End Time *</Label>
                            <Input
                                type="time"
                                id="endTime"
                                {...register("endTime", { 
                                    required: "End time is required",
                                    validate: value => {
                                        const start = watch("startTime");
                                        return value > start || "End time must be after start time";
                                    }
                                })}
                                className={`${theme.input} ${errors.endTime ? "border-red-500" : ""}`}
                            />
                            {errors.endTime && <p className={`text-sm ${theme.error}`}>{errors.endTime.message}</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className={theme.label}>Class *</Label>
                            <Select 
                                onValueChange={(value) => setValue("class", value)} 
                                value={watch("class")}
                            >
                                <SelectTrigger className={theme.bgSelect}>
                                    <SelectValue placeholder="Select class" />
                                </SelectTrigger>
                                <SelectContent className={theme.bgSelectContent}>
                                    {classes.map(classItem => (
                                        <SelectItem key={classItem._id} value={classItem._id} className={theme.selectItem}>
                                            {classItem.name} {classItem.section?.name && `- ${classItem.section.name}`}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.class && <p className={`text-sm ${theme.error}`}>Class is required</p>}
                        </div>

                        <div className="space-y-2">
                            <Label className={theme.label}>Subject *</Label>
                            <Select 
                                onValueChange={(value) => setValue("subject", value)} 
                                value={watch("subject")}
                            >
                                <SelectTrigger className={theme.bgSelect}>
                                    <SelectValue placeholder="Select subject" />
                                </SelectTrigger>
                                <SelectContent className={theme.bgSelectContent}>
                                    {subjects.map(subject => (
                                        <SelectItem key={subject._id} value={subject._id} className={theme.selectItem}>
                                            {subject.name} ({subject.code})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.subject && <p className={`text-sm ${theme.error}`}>Subject is required</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className={theme.label}>Room Number *</Label>
                            <Input
                                id="roomNumber"
                                {...register("roomNumber", { required: "Room number is required" })}
                                placeholder="e.g., Room 101, Hall A"
                                className={`${theme.input} ${errors.roomNumber ? "border-red-500" : ""}`}
                            />
                            {errors.roomNumber && <p className={`text-sm ${theme.error}`}>{errors.roomNumber.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label className={theme.label}>Monitoring Teachers (Optional)</Label>
                            <MultiSelect
                                options={teacherOptions}
                                selected={selectedTeachers}
                                onChange={(selected) => setValue("monitoringTeachers", selected)}
                                placeholder="Select monitoring teachers..."
                                isDarkMode={isDarkMode}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className={theme.label}>Total Marks *</Label>
                            <Input
                                type="number"
                                id="totalMarks"
                                {...register("totalMarks", { 
                                    required: "Total marks is required",
                                    valueAsNumber: true,
                                    min: { value: 1, message: "Total marks must be at least 1" }
                                })}
                                placeholder="e.g., 100"
                                className={`${theme.input} ${errors.totalMarks ? "border-red-500" : ""}`}
                            />
                            {errors.totalMarks && <p className={`text-sm ${theme.error}`}>{errors.totalMarks.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label className={theme.label}>Passing Marks *</Label>
                            <Input
                                type="number"
                                id="passingMarks"
                                {...register("passingMarks", { 
                                    required: "Passing marks is required",
                                    valueAsNumber: true,
                                    min: { value: 0, message: "Passing marks cannot be negative" }
                                })}
                                placeholder="e.g., 33"
                                className={`${theme.input} ${errors.passingMarks ? "border-red-500" : ""}`}
                            />
                            {errors.passingMarks && <p className={`text-sm ${theme.error}`}>{errors.passingMarks.message}</p>}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className={theme.label}>Instructions (Optional)</Label>
                        <Textarea
                            id="instructions"
                            {...register("instructions")}
                            placeholder="Any special instructions for students..."
                            rows={3}
                            className={theme.input}
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label className={theme.label}>Publish Status</Label>
                            <p className={isDarkMode ? "text-gray-400" : "text-gray-500"}>
                                Published exams are visible to students and teachers
                            </p>
                        </div>
                        <Switch
                            checked={watch("isPublished")}
                            onCheckedChange={(checked) => setValue("isPublished", checked)}
                            className={theme.switch}
                        />
                    </div>

                    {selectedStartTime && selectedEndTime && (
                        <div className={`p-3 rounded-md border ${theme.bgAlert}`}>
                            <p className={`text-sm ${theme.textAlert}`}>
                                Exam Duration: {selectedStartTime} - {selectedEndTime} 
                                ({(new Date(`2000-01-01T${selectedEndTime}`) - new Date(`2000-01-01T${selectedStartTime}`)) / (1000 * 60 * 60)} hours)
                            </p>
                        </div>
                    )}

                    <DialogFooter>
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
                            disabled={isLoading}
                            className={theme.button.primary}
                        >
                            {isLoading ? "Saving..." : initialData ? "Update Exam Routine" : "Create Exam Routine"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}