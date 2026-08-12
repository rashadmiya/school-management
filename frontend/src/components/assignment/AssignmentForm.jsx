// components/assignment/AssignmentForm.jsx
import React, { useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { useCreateAssignmentMutation, useUpdateAssignmentMutation } from "@/features/apis/assignmentsApi";
import { useAppSelector } from "@/features/store";
import { handleApiError } from "@/utils/handleApiErrors";
import { AlertCircle, Check } from "lucide-react";

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
            primary: isDarkMode ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-blue-600 hover:bg-blue-700 text-white",
            outline: isDarkMode ? "border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white" : "border-gray-300 text-gray-700 hover:bg-gray-50",
        },
        divider: isDarkMode ? "border-gray-700" : "border-gray-200",
        errorText: "text-red-500",
        helperText: isDarkMode ? "text-gray-400" : "text-gray-500",
    };
};

export default function AssignmentForm({
    open,
    onOpenChange,
    initialData,
    classes = [],
    subjects = []
}) {
    const theme = useTheme();

    const [createAssignment, { isLoading: creating }] = useCreateAssignmentMutation();
    const [updateAssignment, { isLoading: updating }] = useUpdateAssignmentMutation();

    const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
        defaultValues: {
            title: "",
            description: "",
            class: "",
            subject: "",
            dueDate: "",
            mark: ""
        }
    });

    // Watch form values
    const watchedTitle = watch("title");
    const watchedMark = watch("mark");

    // Input base class
    const inputClass = `${theme.bgInput} ${theme.borderInput} ${theme.focusRing} text-gray-900 dark:text-white ${theme.placeholder}`;

    useEffect(() => {
        if (open) {
            if (initialData) {
                const dueDate = initialData.dueDate ? new Date(initialData.dueDate).toISOString().split('T')[0] : "";

                reset({
                    title: initialData.title || "",
                    description: initialData.description || "",
                    class: initialData.class?._id || initialData.class || "",
                    subject: initialData.subject?._id || initialData.subject || "",
                    dueDate: dueDate,
                    mark: initialData.mark || "",
                });
            } else {
                reset({
                    title: "",
                    description: "",
                    class: "",
                    subject: "",
                    dueDate: "",
                    mark: "",
                });
            }
        }
    }, [open, initialData, reset]);

    const onSubmit = async (data) => {
        try {
            if (initialData) {
                await updateAssignment({ id: initialData._id, ...data }).unwrap();
            } else {
                await createAssignment(data).unwrap();
            }
            onOpenChange(false);
        } catch (err) {
            console.error("Error saving assignment:", err);
            handleApiError(err || "Error saving assignment");
        }
    };

    const isLoading = creating || updating;

    // Get subjects filtered by selected class
    const selectedClass = watch("class");
    const filteredSubjects = selectedClass
        ? subjects.filter(subject => true)
        : subjects;

    // Calculate minimum date (today)
    const today = new Date().toISOString().split('T')[0];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className={`sm:max-w-[550px] max-h-[90vh] overflow-y-auto ${theme.dialog}`}>
                <DialogHeader>
                    <DialogTitle className={theme.text}>
                        {initialData ? "Edit Assignment" : "Create New Assignment"}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {/* Assignment Title */}
                    <div className="space-y-2">
                        <Label className={theme.textSecondary}>
                            Assignment Title *
                            {watchedTitle && !errors.title && (
                                <span className="ml-2 text-xs text-green-600 dark:text-green-400">
                                    <Check className="w-3 h-3 inline" /> Valid
                                </span>
                            )}
                        </Label>
                        <Input
                            {...register("title", {
                                required: "Assignment title is required",
                                minLength: {
                                    value: 3,
                                    message: "Title must be at least 3 characters"
                                }
                            })}
                            placeholder="e.g., Chapter 5 Exercises, Research Paper, etc."
                            className={`${inputClass} ${errors.title ? "border-red-500" : ""}`}
                        />
                        {errors.title && (
                            <p className={`text-sm ${theme.errorText}`}>{errors.title.message}</p>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Class Selection */}
                        <div className="space-y-2">
                            <Label className={theme.textSecondary}>Class *</Label>
                            <Select 
                                onValueChange={(value) => setValue("class", value)} 
                                value={watch("class")}
                            >
                                <SelectTrigger className={`${theme.select.trigger} ${errors.class ? "border-red-500" : ""}`}>
                                    <SelectValue placeholder="Select class" />
                                </SelectTrigger>
                                <SelectContent className={theme.select.content}>
                                    {classes.map((classItem) => (
                                        <SelectItem key={classItem._id} value={classItem._id} className={theme.select.item}>
                                            {classItem.name} {classItem.section ? `(${classItem.section})` : ''}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.class && (
                                <p className={`text-sm ${theme.errorText}`}>Class is required</p>
                            )}
                        </div>

                        {/* Subject Selection */}
                        <div className="space-y-2">
                            <Label className={theme.textSecondary}>Subject *</Label>
                            <Select 
                                onValueChange={(value) => setValue("subject", value)} 
                                value={watch("subject")}
                            >
                                <SelectTrigger className={`${theme.select.trigger} ${errors.subject ? "border-red-500" : ""}`}>
                                    <SelectValue placeholder="Select subject" />
                                </SelectTrigger>
                                <SelectContent className={theme.select.content}>
                                    {filteredSubjects.map((subject) => (
                                        <SelectItem key={subject._id} value={subject._id} className={theme.select.item}>
                                            {subject.name} ({subject.code})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.subject && (
                                <p className={`text-sm ${theme.errorText}`}>Subject is required</p>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Assignment Marks */}
                        <div className="space-y-2">
                            <Label className={theme.textSecondary}>
                                Assignment Marks *
                                {watchedMark && !errors.mark && (
                                    <span className="ml-2 text-xs text-green-600 dark:text-green-400">
                                        <Check className="w-3 h-3 inline" /> Valid
                                    </span>
                                )}
                            </Label>
                            <Input
                                {...register("mark", {
                                    required: "Assignment mark is required",
                                    minLength: {
                                        value: 1,
                                        message: "Mark must be at least 1"
                                    }
                                })}
                                placeholder="e.g., 10"
                                className={`${inputClass} ${errors.mark ? "border-red-500" : ""}`}
                            />
                            {errors.mark && (
                                <p className={`text-sm ${theme.errorText}`}>{errors.mark.message}</p>
                            )}
                        </div>

                        {/* Due Date */}
                        <div className="space-y-2">
                            <Label className={theme.textSecondary}>Due Date *</Label>
                            <Input
                                type="date"
                                min={today}
                                {...register("dueDate", {
                                    required: "Due date is required",
                                    validate: {
                                        futureDate: (value) => {
                                            const selectedDate = new Date(value);
                                            const today = new Date();
                                            today.setHours(0, 0, 0, 0);
                                            return selectedDate >= today || "Due date must be in the future";
                                        }
                                    }
                                })}
                                className={`${inputClass} ${errors.dueDate ? "border-red-500" : ""}`}
                            />
                            {errors.dueDate && (
                                <p className={`text-sm ${theme.errorText}`}>{errors.dueDate.message}</p>
                            )}
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label className={theme.textSecondary}>Description</Label>
                        <Textarea
                            {...register("description")}
                            placeholder="Provide detailed instructions for the assignment..."
                            rows={4}
                            className={`${inputClass} resize-none`}
                        />
                        <p className={`text-xs ${theme.helperText}`}>
                            Optional. Include any specific requirements, guidelines, or resources.
                        </p>
                    </div>

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
                            disabled={isLoading}
                            className={theme.button.primary}
                        >
                            {isLoading ? "Saving..." : initialData ? "Update Assignment" : "Create Assignment"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}