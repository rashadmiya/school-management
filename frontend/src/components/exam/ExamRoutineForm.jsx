// components/exam/ExamRoutineForm.jsx
import React, { useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { useCreateExamRoutineMutation, useUpdateExamRoutineMutation } from "@/features/apis/examRoutineApi";
import { useGetClassesQuery } from "@/features/apis/classesApi";
import { useGetSubjectsQuery } from "@/features/apis/subjectsApi";
import { useGetTeachersQuery } from "@/features/apis/teachersApi";
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

export default function ExamRoutineForm({ open, onOpenChange, initialData }) {
    const [createExamRoutine, { isLoading: creating }] = useCreateExamRoutineMutation();
    const [updateExamRoutine, { isLoading: updating }] = useUpdateExamRoutineMutation();
    
    const { data: classesData } = useGetClassesQuery();
    const { data: subjectsData } = useGetSubjectsQuery();
    const { data: teachersData } = useGetTeachersQuery();

    const classes = classesData?.classes || [];
    const subjects = subjectsData?.subjects || [];
    const teachers = teachersData?.teachers || [];

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
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {initialData ? "Edit Exam Routine" : "Create New Exam Routine"}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="examType">Exam Type *</Label>
                            <Select 
                                onValueChange={(value) => setValue("examType", value)} 
                                value={watch("examType")}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select exam type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {EXAM_TYPES.map(type => (
                                        <SelectItem key={type.value} value={type.value}>
                                            {type.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.examType && <p className="text-sm text-red-500">{errors.examType.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="title">Exam Title *</Label>
                            <Input
                                id="title"
                                {...register("title", { required: "Exam title is required" })}
                                placeholder="e.g., Final Examination 2024"
                                className={errors.title ? "border-red-500" : ""}
                            />
                            {errors.title && <p className="text-sm text-red-500">{errors.title.message}</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="academicYear">Academic Year *</Label>
                            <Input
                                id="academicYear"
                                {...register("academicYear", { required: "Academic year is required" })}
                                placeholder="e.g., 2024-2025"
                                className={errors.academicYear ? "border-red-500" : ""}
                            />
                            {errors.academicYear && <p className="text-sm text-red-500">{errors.academicYear.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="examDate">Exam Date *</Label>
                            <Input
                                type="date"
                                id="examDate"
                                {...register("examDate", { required: "Exam date is required" })}
                                className={errors.examDate ? "border-red-500" : ""}
                            />
                            {errors.examDate && <p className="text-sm text-red-500">{errors.examDate.message}</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="startTime">Start Time *</Label>
                            <Input
                                type="time"
                                id="startTime"
                                {...register("startTime", { required: "Start time is required" })}
                                className={errors.startTime ? "border-red-500" : ""}
                            />
                            {errors.startTime && <p className="text-sm text-red-500">{errors.startTime.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="endTime">End Time *</Label>
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
                                className={errors.endTime ? "border-red-500" : ""}
                            />
                            {errors.endTime && <p className="text-sm text-red-500">{errors.endTime.message}</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="class">Class *</Label>
                            <Select 
                                onValueChange={(value) => setValue("class", value)} 
                                value={watch("class")}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select class" />
                                </SelectTrigger>
                                <SelectContent>
                                    {classes.map(classItem => (
                                        <SelectItem key={classItem._id} value={classItem._id}>
                                            {classItem.name} {classItem.section?.name && `- ${classItem.section.name}`}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.class && <p className="text-sm text-red-500">Class is required</p>}
                        </div>

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
                                    {subjects.map(subject => (
                                        <SelectItem key={subject._id} value={subject._id}>
                                            {subject.name} ({subject.code})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.subject && <p className="text-sm text-red-500">Subject is required</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="roomNumber">Room Number *</Label>
                            <Input
                                id="roomNumber"
                                {...register("roomNumber", { required: "Room number is required" })}
                                placeholder="e.g., Room 101, Hall A"
                                className={errors.roomNumber ? "border-red-500" : ""}
                            />
                            {errors.roomNumber && <p className="text-sm text-red-500">{errors.roomNumber.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="monitoringTeachers">Monitoring Teachers (Optional)</Label>
                            <MultiSelect
                                options={teacherOptions}
                                selected={selectedTeachers}
                                onChange={(selected) => setValue("monitoringTeachers", selected)}
                                placeholder="Select monitoring teachers..."
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="totalMarks">Total Marks *</Label>
                            <Input
                                type="number"
                                id="totalMarks"
                                {...register("totalMarks", { 
                                    required: "Total marks is required",
                                    valueAsNumber: true,
                                    min: { value: 1, message: "Total marks must be at least 1" }
                                })}
                                placeholder="e.g., 100"
                                className={errors.totalMarks ? "border-red-500" : ""}
                            />
                            {errors.totalMarks && <p className="text-sm text-red-500">{errors.totalMarks.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="passingMarks">Passing Marks *</Label>
                            <Input
                                type="number"
                                id="passingMarks"
                                {...register("passingMarks", { 
                                    required: "Passing marks is required",
                                    valueAsNumber: true,
                                    min: { value: 0, message: "Passing marks cannot be negative" }
                                })}
                                placeholder="e.g., 33"
                                className={errors.passingMarks ? "border-red-500" : ""}
                            />
                            {errors.passingMarks && <p className="text-sm text-red-500">{errors.passingMarks.message}</p>}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="instructions">Instructions (Optional)</Label>
                        <Textarea
                            id="instructions"
                            {...register("instructions")}
                            placeholder="Any special instructions for students..."
                            rows={3}
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label htmlFor="isPublished">Publish Status</Label>
                            <p className="text-sm text-gray-500">
                                Published exams are visible to students and teachers
                            </p>
                        </div>
                        <Switch
                            checked={watch("isPublished")}
                            onCheckedChange={(checked) => setValue("isPublished", checked)}
                        />
                    </div>

                    {selectedStartTime && selectedEndTime && (
                        <div className="p-3 bg-blue-50 rounded-md">
                            <p className="text-sm text-blue-700">
                                Exam Duration: {selectedStartTime} - {selectedEndTime} 
                                ({(new Date(`2000-01-01T${selectedEndTime}`) - new Date(`2000-01-01T${selectedStartTime}`)) / (1000 * 60 * 60)} hours)
                            </p>
                        </div>
                    )}

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? "Saving..." : initialData ? "Update Exam Routine" : "Create Exam Routine"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}