// components/admin/directory/forms/SectionForm.jsx
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useCreateSectionMutation, useUpdateSectionMutation } from "@/features/apis/sectionsApi";
import { useAppSelector } from "@/features/store";
import { AlertCircle, Check, LayoutGrid, Users } from "lucide-react";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "react-toastify";

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
        button: {
            primary: isDarkMode ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-blue-600 hover:bg-blue-700 text-white",
            outline: isDarkMode ? "border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white" : "border-gray-300 text-gray-700 hover:bg-gray-50",
        },
        switch: isDarkMode ? "data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-gray-700" : "",
        divider: isDarkMode ? "border-gray-700" : "border-gray-200",
        alert: isDarkMode ? "bg-red-900/20 border-red-800 text-red-400" : "bg-red-50 border-red-200 text-red-800",
        statusBox: isDarkMode ? "bg-gray-800/50 border-gray-700" : "bg-white border-gray-200",
        previewBox: isDarkMode ? "bg-blue-500/10 border-blue-500/20" : "bg-blue-50 border-blue-200",
        previewText: isDarkMode ? "text-blue-400" : "text-blue-800",
        previewSubtext: isDarkMode ? "text-blue-400/80" : "text-blue-700",
        previewMuted: isDarkMode ? "text-blue-400/60" : "text-blue-600",
        previewProgress: isDarkMode ? "bg-blue-500/20" : "bg-blue-100",
        previewProgressBar: isDarkMode ? "bg-blue-400" : "bg-blue-500",
        icon: isDarkMode ? "text-gray-400" : "text-gray-500",
    };
};

export default function SectionForm({ open, onOpenChange, initialData }) {
    const theme = useTheme();

    const [createSection, { isLoading: isCreating }] = useCreateSectionMutation();
    const [updateSection, { isLoading: isUpdating }] = useUpdateSectionMutation();

    const {
        register,
        handleSubmit,
        reset,
        watch,
        control,
        formState: { errors },
    } = useForm({
        defaultValues: {
            name: "",
            capacity: 40,
            isActive: true
        }
    });

    // Watch form values
    const watchedName = watch("name");
    const watchedCapacity = watch("capacity");

    // Input base class
    const inputClass = `${theme.bgInput} ${theme.borderInput} ${theme.focusRing} text-gray-900 dark:text-white ${theme.placeholder}`;

    useEffect(() => {
        if (open) {
            if (initialData) {
                const editData = {
                    name: initialData.name || "",
                    capacity: initialData.capacity || 40,
                    isActive: initialData.isActive !== false
                };
                reset(editData);
            } else {
                reset({
                    name: "",
                    capacity: 40,
                    isActive: true
                });
            }
        }
    }, [open, initialData, reset]);

    const onSubmit = async (data) => {
        try {
            if (initialData) {
                await updateSection({ id: initialData._id, ...data }).unwrap();
                toast.success("Section updated");
            } else {
                await createSection(data).unwrap();
                toast.success("Section added");
            }
            onOpenChange(false);
        } catch (err) {
            toast.error(err?.data?.message || "Error saving section");
        }
    };

    const isLoading = isCreating || isUpdating;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className={`sm:max-w-[500px] max-h-[90vh] overflow-y-auto ${theme.dialog}`}>
                <DialogHeader>
                    <DialogTitle className={`flex items-center gap-2 ${theme.text}`}>
                        <LayoutGrid className="w-5 h-5" />
                        {initialData ? `Edit Section: ${initialData.name}` : "Create New Section"}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {/* Section Information */}
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 gap-4">
                            {/* Section Name */}
                            <div className="space-y-2">
                                <Label className={theme.textSecondary}>
                                    Section Name *
                                    {watchedName && !errors.name && (
                                        <span className="ml-2 text-xs text-green-600 dark:text-green-400">
                                            <Check className="w-3 h-3 inline" /> Valid
                                        </span>
                                    )}
                                </Label>
                                <Input
                                    {...register("name", {
                                        required: "Section name is required",
                                        minLength: { value: 1, message: "Section name is required" },
                                        maxLength: { value: 10, message: "Section name is too long" },
                                        pattern: {
                                            value: /^[A-Z0-9]+$/,
                                            message: "Only uppercase letters and numbers allowed"
                                        }
                                    })}
                                    placeholder="e.g., A, B, C, 1, 2"
                                    className={`${inputClass} uppercase ${errors.name ? "border-red-500" : ""}`}
                                    disabled={isLoading}
                                />
                                {errors.name && (
                                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3" />
                                        {errors.name.message}
                                    </p>
                                )}
                                <p className={`text-xs ${theme.textMuted}`}>
                                    Single character or number (e.g., A, B, 1, 2)
                                </p>
                            </div>

                            {/* Capacity */}
                            <div className="space-y-2">
                                <Label className={theme.textSecondary}>
                                    Capacity *
                                    <span className={`ml-2 text-xs ${theme.textMuted}`}>
                                        Max students
                                    </span>
                                </Label>
                                <div className="flex items-center gap-2">
                                    <Users className={`w-4 h-4 ${theme.icon}`} />
                                    <Input
                                        type="number"
                                        min="1"
                                        max="100"
                                        {...register("capacity", {
                                            required: "Capacity is required",
                                            min: { value: 1, message: "Capacity must be at least 1" },
                                            max: { value: 100, message: "Capacity cannot exceed 100" },
                                            valueAsNumber: true
                                        })}
                                        placeholder="Enter capacity"
                                        className={`${inputClass} ${errors.capacity ? "border-red-500" : ""}`}
                                        disabled={isLoading}
                                    />
                                </div>
                                {errors.capacity && (
                                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3" />
                                        {errors.capacity.message}
                                    </p>
                                )}
                                <div className={`flex justify-between text-xs ${theme.textMuted}`}>
                                    <span>Small: 20-30</span>
                                    <span>Medium: 30-40</span>
                                    <span>Large: 40+</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Status */}
                    <div className={`flex items-center justify-between p-4 border rounded-lg ${theme.statusBox}`}>
                        <div>
                            <Label className={`text-base ${theme.text}`}>Active Status</Label>
                            <p className={`text-sm ${theme.textMuted}`}>
                                {watch("isActive") ? "Section is available for use" : "Section is inactive and hidden"}
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

                    {/* Capacity Preview */}
                    {watchedCapacity > 0 && (
                        <div className={`border rounded-lg p-4 ${theme.previewBox}`}>
                            <h4 className={`font-medium ${theme.previewText} mb-2`}>Capacity Preview</h4>
                            <div className="space-y-2">
                                <div className={`flex justify-between text-sm ${theme.previewSubtext}`}>
                                    <span>Seats Available:</span>
                                    <span className="font-medium">{watchedCapacity} students</span>
                                </div>
                                <div className={`w-full ${theme.previewProgress} rounded-full h-2`}>
                                    <div
                                        className={`h-2 ${theme.previewProgressBar} rounded-full`}
                                        style={{ width: '100%' }}
                                    ></div>
                                </div>
                                <p className={`text-xs ${theme.previewMuted}`}>
                                    This section can accommodate {watchedCapacity} students maximum.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Validation Alert */}
                    {(errors.name || errors.capacity) && (
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
                                "Update Section"
                            ) : (
                                "Create Section"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}