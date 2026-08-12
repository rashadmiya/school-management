// components/admin/directory/forms/CabinetForm.jsx
import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useForm, Controller } from "react-hook-form";
import { Check, AlertCircle, User, BookOpen, Users, GraduationCap } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useGetStudentsByClassQuery } from "@/features/apis/studentsApi";
import { useCreateCabinetMemberMutation, useUpdateCabinetMemberMutation } from "@/features/apis/directoryApi";
import { useAppSelector } from "@/features/store";
import { handleApiError } from "@/utils/handleApiErrors";
import { toast } from "sonner";

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
        bgSubtle: isDarkMode ? "bg-gray-800/50" : "bg-gray-50",
        bgHover: isDarkMode ? "hover:bg-gray-800" : "hover:bg-gray-50",
        placeholder: isDarkMode ? "placeholder:text-gray-500" : "placeholder:text-gray-400",
        dialog: isDarkMode ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200",
        select: {
            trigger: isDarkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-300 text-gray-900",
            content: isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white",
            item: isDarkMode ? "text-gray-300 hover:bg-gray-700" : "text-gray-900 hover:bg-gray-100",
        },
        button: {
            primary: isDarkMode ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-blue-600 hover:bg-blue-700 text-white",
            outline: isDarkMode ? "border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white" : "border-gray-300 text-gray-700 hover:bg-gray-50",
        },
        switch: isDarkMode ? "data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-gray-700" : "",
        divider: isDarkMode ? "border-gray-700" : "border-gray-200",
        alert: isDarkMode ? "bg-red-900/20 border-red-800 text-red-400" : "bg-red-50 border-red-200 text-red-800",
        statusBox: isDarkMode ? "bg-gray-800/50 border-gray-700" : "bg-white border-gray-200",
        sectionIcon: isDarkMode ? "text-gray-400" : "text-gray-500",
    };
};

export default function CabinetForm({ open, onOpenChange, initialData, classes = [] }) {
    const theme = useTheme();

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        watch,
        control,
        formState: { errors },
    } = useForm({
        defaultValues: {
            name: "",
            class: "",
            rollNumber: "",
            student: "",
            designation: "",
            session: "",
            isActive: true
        }
    });

    // Watch form values
    const watchedName = watch("name");
    const watchedClass = watch("class");
    const currentYear = new Date().getFullYear();

    const sessionOptions = [
        `${currentYear - 2}-${currentYear - 1}`,
        `${currentYear - 1}-${currentYear}`,
        `${currentYear}-${currentYear + 1}`,
        `${currentYear + 1}-${currentYear + 2}`
    ];

    const designationOptions = [
        { value: "president", label: "President" },
        { value: "vice_president", label: "Vice President" },
        { value: "secretary", label: "Secretary" },
        { value: "treasurer", label: "Treasurer" },
        { value: "member", label: "Member" }
    ];

    const {
        data: studentsResponse,
        isLoading: isStudentsLoading,
    } = useGetStudentsByClassQuery(watchedClass, {
        skip: !watchedClass,
    });
    const availableStudents = studentsResponse?.students || [];

    const [createCabinetMember, { isLoading: isMemberCreating }] = useCreateCabinetMemberMutation();
    const [updateCabinetMember, { isLoading: isMemberUpdating }] = useUpdateCabinetMemberMutation();

    // Input base class
    const inputClass = `${theme.bgInput} ${theme.borderInput} ${theme.focusRing} text-gray-900 dark:text-white ${theme.placeholder}`;

    useEffect(() => {
        if (open) {
            if (initialData) {
                const editData = {
                    name: initialData.name || "",
                    class: initialData.class?._id || "",
                    rollNumber: initialData.rollNumber || "",
                    student: initialData.student?._id || "",
                    designation: initialData.designation || "member",
                    session: initialData.session || `${currentYear}-${currentYear + 1}`,
                    isActive: initialData.isActive !== false
                };
                reset(editData);
            } else {
                reset({
                    name: "",
                    class: "",
                    rollNumber: "",
                    student: "",
                    designation: "member",
                    session: `${currentYear}-${currentYear + 1}`,
                    isActive: true
                });
            }
        }
    }, [open, initialData, reset, currentYear]);

    // Auto-fill name when student is selected
    const handleStudentChange = (studentId) => {
        setValue("student", studentId);
        const selectedStudent = availableStudents.find(s => s._id === studentId);
        if (selectedStudent) {
            setValue("name", selectedStudent.name);
            setValue("rollNumber", selectedStudent.rollNumber);
        }
    };

    const onSubmit = async (data) => {
        try {
            if (initialData) {
                await updateCabinetMember({ id: initialData._id, ...data }).unwrap();
                toast.success("Cabinet member updated");
            } else {
                await createCabinetMember(data).unwrap();
                toast.success("Cabinet member added");
            }
            onOpenChange(false);
        } catch (err) {
            handleApiError(err || "Error saving cabinet member");
        }
    };

    const isLoading = isMemberCreating || isMemberUpdating;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className={`sm:max-w-[600px] max-h-[90vh] overflow-y-auto ${theme.dialog}`}>
                <DialogHeader>
                    <DialogTitle className={`flex items-center gap-2 ${theme.text}`}>
                        <GraduationCap className="w-5 h-5" />
                        {initialData ? `Edit Cabinet Member: ${initialData.name}` : "Add Cabinet Member"}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {/* Student Selection */}
                    <div className="space-y-4">
                        <h3 className={`text-lg font-semibold flex items-center gap-2 ${theme.text}`}>
                            <User className="w-4 h-4" />
                            Student Information
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Class */}
                            <div className="space-y-2">
                                <Label className={theme.textSecondary}>Class *</Label>
                                <Controller
                                    name="class"
                                    control={control}
                                    rules={{ required: "Class is required" }}
                                    render={({ field }) => (
                                        <Select
                                            value={field.value}
                                            onValueChange={(value) => {
                                                field.onChange(value);
                                                setValue("student", "");
                                                setValue("name", "");
                                                setValue("rollNumber", "");
                                            }}
                                            disabled={isLoading}
                                        >
                                            <SelectTrigger className={`${theme.select.trigger} ${errors.class ? "border-red-500" : ""}`}>
                                                <SelectValue placeholder="Select class" />
                                            </SelectTrigger>
                                            <SelectContent className={theme.select.content}>
                                                {classes.map(cls => (
                                                    <SelectItem key={cls._id} value={cls._id} className={theme.select.item}>
                                                        {cls.name} {cls.section?.name ? `- ${cls.section.name}` : ''}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                                {errors.class && (
                                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3" />
                                        {errors.class.message}
                                    </p>
                                )}
                            </div>

                            {/* Student */}
                            <div className="space-y-2 md:col-span-2">
                                <Label className={theme.textSecondary}>Select Student *</Label>
                                <Controller
                                    name="student"
                                    control={control}
                                    rules={{ required: "Student is required" }}
                                    render={({ field }) => (
                                        <Select
                                            value={field.value}
                                            onValueChange={handleStudentChange}
                                            disabled={isLoading || !watchedClass || isStudentsLoading}
                                        >
                                            <SelectTrigger className={`${theme.select.trigger} ${errors.student ? "border-red-500" : ""}`}>
                                                <SelectValue
                                                    placeholder={
                                                        !watchedClass
                                                            ? "Select class first"
                                                            : isStudentsLoading
                                                                ? "Loading students..."
                                                                : "Select student"
                                                    }
                                                />
                                            </SelectTrigger>
                                            <SelectContent className={theme.select.content}>
                                                {availableStudents.length === 0 && !isStudentsLoading && (
                                                    <SelectItem value="no-data" disabled>
                                                        No students found
                                                    </SelectItem>
                                                )}
                                                {availableStudents.map((student) => (
                                                    <SelectItem key={student._id} value={student._id} className={theme.select.item}>
                                                        {student.name} (Roll: {student.rollNumber})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                                {errors.student && (
                                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3" />
                                        {errors.student.message}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Member Details */}
                    <div className="space-y-4">
                        <h3 className={`text-lg font-semibold flex items-center gap-2 ${theme.text}`}>
                            <Users className="w-4 h-4" />
                            Cabinet Position
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Name (auto-filled but editable) */}
                            <div className="space-y-2">
                                <Label className={theme.textSecondary}>
                                    Name *
                                    {watchedName && !errors.name && (
                                        <span className="ml-2 text-xs text-green-600 dark:text-green-400">
                                            <Check className="w-3 h-3 inline" /> Valid
                                        </span>
                                    )}
                                </Label>
                                <Input
                                    {...register("name", {
                                        required: "Name is required",
                                        minLength: { value: 3, message: "Name is too short" }
                                    })}
                                    placeholder="Student name"
                                    className={`${inputClass} ${errors.name ? "border-red-500" : ""}`}
                                    disabled={isLoading}
                                />
                                {errors.name && (
                                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3" />
                                        {errors.name.message}
                                    </p>
                                )}
                            </div>

                            {/* Roll Number */}
                            <div className="space-y-2">
                                <Label className={theme.textSecondary}>Roll Number *</Label>
                                <Input
                                    {...register("rollNumber", {
                                        required: "Roll number is required"
                                    })}
                                    placeholder="e.g., 10A001"
                                    className={`${inputClass} ${errors.rollNumber ? "border-red-500" : ""}`}
                                    disabled={isLoading}
                                />
                                {errors.rollNumber && (
                                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3" />
                                        {errors.rollNumber.message}
                                    </p>
                                )}
                            </div>

                            {/* Designation */}
                            <div className="space-y-2">
                                <Label className={theme.textSecondary}>Position *</Label>
                                <Controller
                                    name="designation"
                                    control={control}
                                    rules={{ required: "Position is required" }}
                                    render={({ field }) => (
                                        <Select
                                            value={field.value}
                                            onValueChange={field.onChange}
                                            disabled={isLoading}
                                        >
                                            <SelectTrigger className={`${theme.select.trigger} ${errors.designation ? "border-red-500" : ""}`}>
                                                <SelectValue placeholder="Select position" />
                                            </SelectTrigger>
                                            <SelectContent className={theme.select.content}>
                                                {designationOptions.map((option) => (
                                                    <SelectItem key={option.value} value={option.value} className={theme.select.item}>
                                                        {option.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                                {errors.designation && (
                                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3" />
                                        {errors.designation.message}
                                    </p>
                                )}
                            </div>

                            {/* Session */}
                            <div className="space-y-2">
                                <Label className={theme.textSecondary}>Session *</Label>
                                <Controller
                                    name="session"
                                    control={control}
                                    rules={{ required: "Session is required" }}
                                    render={({ field }) => (
                                        <Select
                                            value={field.value}
                                            onValueChange={field.onChange}
                                            disabled={isLoading}
                                        >
                                            <SelectTrigger className={`${theme.select.trigger} ${errors.session ? "border-red-500" : ""}`}>
                                                <SelectValue placeholder="Select session" />
                                            </SelectTrigger>
                                            <SelectContent className={theme.select.content}>
                                                {sessionOptions.map((session) => (
                                                    <SelectItem key={session} value={session} className={theme.select.item}>
                                                        {session}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                                {errors.session && (
                                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3" />
                                        {errors.session.message}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Status */}
                    <div className={`flex items-center justify-between p-4 border rounded-lg ${theme.statusBox}`}>
                        <div>
                            <Label className={`text-base ${theme.text}`}>Active Status</Label>
                            <p className={`text-sm ${theme.textMuted}`}>
                                {watch("isActive") ? "Member is active in cabinet" : "Member is inactive"}
                            </p>
                        </div>
                        <Controller
                            name="isActive"
                            control={control}
                            render={({ field }) => (
                                <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    disabled={isLoading}
                                    className={theme.switch}
                                />
                            )}
                        />
                    </div>

                    {/* Validation Alert */}
                    {(errors.name || errors.class || errors.student || errors.rollNumber || errors.designation || errors.session) && (
                        <Alert variant="destructive" className={theme.alert}>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                                Please fix the errors above before submitting
                            </AlertDescription>
                        </Alert>
                    )}

                    <DialogFooter className={`pt-4 border-t ${theme.divider}`}>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isLoading}
                            className={theme.button.outline}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isLoading || Object.keys(errors).length > 0}
                            className={`min-w-[120px] ${theme.button.primary}`}
                        >
                            {isLoading ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    {initialData ? "Updating..." : "Creating..."}
                                </>
                            ) : initialData ? (
                                "Update Member"
                            ) : (
                                "Add Member"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}