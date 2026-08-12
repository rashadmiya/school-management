// components/admin/directory/forms/StuffForm.jsx
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useCreateStaffMutation, useUpdateStaffMutation } from "@/features/apis/directoryApi";
import { useAppSelector } from "@/features/store";
import { AlertCircle, Calendar, Check, GraduationCap, Phone, User } from "lucide-react";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
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
    };
};

export default function StuffForm({ open, onOpenChange, initialData }) {
    const theme = useTheme();

    const [createStuff, { isLoading: isCreating }] = useCreateStaffMutation();
    const [updateStuff, { isLoading: isUpdating }] = useUpdateStaffMutation();

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
            designation: "",
            session: "",
            dateOfBirth: "",
            nationalIdNo: "",
            lastQualification: {
                name: "",
                major: "",
                institute: ""
            },
            phoneNumber: "",
            address: "",
            religion: "",
            photo: "",
            joiningDate: new Date().toISOString().split('T')[0],
            isActive: true
        }
    });

    // Watch form values
    const watchedName = watch("name");
    const watchedPhone = watch("phoneNumber");
    const currentYear = new Date().getFullYear();

    const sessionOptions = [
        `${currentYear - 2}-${currentYear - 1}`,
        `${currentYear - 1}-${currentYear}`,
        `${currentYear}-${currentYear + 1}`,
        `${currentYear + 1}-${currentYear + 2}`
    ];

    const designationOptions = [
        "Accountant", "Clerk", "Librarian", "Lab Assistant", "Peon",
        "Security Guard", "Cleaner", "Driver", "Office Assistant",
        "IT Support", "Registrar", "Store Keeper", "Sports Coach",
        "Counselor", "Nurse", "Other"
    ];

    const religionOptions = ["Islam", "Hinduism", "Christianity", "Buddhism", "Other"];

    // Input base class
    const inputClass = `${theme.bgInput} ${theme.borderInput} ${theme.focusRing} text-gray-900 dark:text-white ${theme.placeholder}`;

    useEffect(() => {
        if (open) {
            if (initialData) {
                const editData = {
                    name: initialData.name || "",
                    designation: initialData.designation || "",
                    session: initialData.session || `${currentYear}-${currentYear + 1}`,
                    dateOfBirth: initialData.dateOfBirth?.split('T')[0] || "",
                    nationalIdNo: initialData.nationalIdNo || "",
                    lastQualification: initialData.lastQualification || {
                        name: "",
                        major: "",
                        institute: ""
                    },
                    phoneNumber: initialData.phoneNumber || "",
                    address: initialData.address || "",
                    religion: initialData.religion || "",
                    photo: initialData.photo || "",
                    joiningDate: initialData.joiningDate?.split('T')[0] || new Date().toISOString().split('T')[0],
                    isActive: initialData.isActive !== false
                };
                reset(editData);
            } else {
                reset({
                    name: "",
                    designation: "",
                    session: `${currentYear}-${currentYear + 1}`,
                    dateOfBirth: "",
                    nationalIdNo: "",
                    lastQualification: {
                        name: "",
                        major: "",
                        institute: ""
                    },
                    phoneNumber: "",
                    address: "",
                    religion: "",
                    photo: "",
                    joiningDate: new Date().toISOString().split('T')[0],
                    isActive: true
                });
            }
        }
    }, [open, initialData, reset, currentYear]);

    const onSubmit = async (data) => {
        try {
            if (initialData) {
                await updateStuff({ id: initialData._id, ...data }).unwrap();
                toast.success("Staff member updated successfully");
            } else {
                await createStuff(data).unwrap();
                toast.success("Staff member created successfully");
            }
            onOpenChange(false);
        } catch (err) {
            toast.error(err || "Error saving staff member");
        }
    };

    const isLoading = isCreating || isUpdating;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className={`sm:max-w-[700px] max-h-[90vh] overflow-y-auto ${theme.dialog}`}>
                <DialogHeader>
                    <DialogTitle className={`flex items-center gap-2 ${theme.text}`}>
                        <User className="w-5 h-5" />
                        {initialData ? `Edit Staff: ${initialData.name}` : "Add New Staff Member"}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {/* Basic Information */}
                    <div className="space-y-4">
                        <h3 className={`text-lg font-semibold flex items-center gap-2 ${theme.text}`}>
                            <User className="w-4 h-4" />
                            Basic Information
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Name */}
                            <div className="space-y-2">
                                <Label className={theme.textSecondary}>
                                    Full Name *
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
                                    placeholder="Enter full name"
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

                            {/* Designation */}
                            <div className="space-y-2">
                                <Label className={theme.textSecondary}>Designation *</Label>
                                <Controller
                                    name="designation"
                                    control={control}
                                    rules={{ required: "Designation is required" }}
                                    render={({ field }) => (
                                        <Select
                                            value={field.value}
                                            onValueChange={field.onChange}
                                            disabled={isLoading}
                                        >
                                            <SelectTrigger className={`${theme.select.trigger} ${errors.designation ? "border-red-500" : ""}`}>
                                                <SelectValue placeholder="Select designation" />
                                            </SelectTrigger>
                                            <SelectContent className={theme.select.content}>
                                                {designationOptions.map((designation) => (
                                                    <SelectItem key={designation} value={designation} className={theme.select.item}>
                                                        {designation}
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

                            {/* National ID */}
                            <div className="space-y-2">
                                <Label className={theme.textSecondary}>National ID Number</Label>
                                <Input
                                    {...register("nationalIdNo")}
                                    placeholder="Enter national ID"
                                    className={inputClass}
                                    disabled={isLoading}
                                />
                                <p className={`text-xs ${theme.textMuted}`}>Optional unique identification number</p>
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

                    {/* Personal Details */}
                    <div className="space-y-4">
                        <h3 className={`text-lg font-semibold flex items-center gap-2 ${theme.text}`}>
                            <Calendar className="w-4 h-4" />
                            Personal Details
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Date of Birth */}
                            <div className="space-y-2">
                                <Label className={theme.textSecondary}>Date of Birth</Label>
                                <Input
                                    type="date"
                                    {...register("dateOfBirth")}
                                    className={inputClass}
                                    disabled={isLoading}
                                />
                            </div>

                            {/* Joining Date */}
                            <div className="space-y-2">
                                <Label className={theme.textSecondary}>Joining Date</Label>
                                <Input
                                    type="date"
                                    {...register("joiningDate")}
                                    className={inputClass}
                                    disabled={isLoading}
                                />
                            </div>

                            {/* Religion */}
                            <div className="space-y-2">
                                <Label className={theme.textSecondary}>Religion</Label>
                                <Controller
                                    name="religion"
                                    control={control}
                                    render={({ field }) => (
                                        <Select
                                            value={field.value ?? ""}
                                            onValueChange={field.onChange}
                                            disabled={isLoading}
                                        >
                                            <SelectTrigger className={theme.select.trigger}>
                                                <SelectValue placeholder="Select religion" />
                                            </SelectTrigger>
                                            <SelectContent className={theme.select.content}>
                                                <SelectItem value="Not Specified" className={theme.select.item}>Not specified</SelectItem>
                                                {religionOptions.map((religion) => (
                                                    <SelectItem key={religion} value={religion} className={theme.select.item}>
                                                        {religion}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Contact Information */}
                    <div className="space-y-4">
                        <h3 className={`text-lg font-semibold flex items-center gap-2 ${theme.text}`}>
                            <Phone className="w-4 h-4" />
                            Contact Information
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Phone Number */}
                            <div className="space-y-2">
                                <Label className={theme.textSecondary}>
                                    Phone Number *
                                    {watchedPhone && !errors.phoneNumber && (
                                        <span className="ml-2 text-xs text-green-600 dark:text-green-400">
                                            <Check className="w-3 h-3 inline" /> Valid
                                        </span>
                                    )}
                                </Label>
                                <Input
                                    {...register("phoneNumber", {
                                        required: "Phone number is required",
                                        pattern: {
                                            value: /^[0-9+\-\s]+$/,
                                            message: "Enter a valid phone number"
                                        }
                                    })}
                                    placeholder="Enter phone number"
                                    className={`${inputClass} ${errors.phoneNumber ? "border-red-500" : ""}`}
                                    disabled={isLoading}
                                />
                                {errors.phoneNumber && (
                                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3" />
                                        {errors.phoneNumber.message}
                                    </p>
                                )}
                            </div>

                            {/* Address */}
                            <div className="space-y-2 md:col-span-2">
                                <Label className={theme.textSecondary}>Address</Label>
                                <Textarea
                                    {...register("address")}
                                    placeholder="Enter full address"
                                    rows={2}
                                    className={`${inputClass} resize-none`}
                                    disabled={isLoading}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Qualification */}
                    <div className="space-y-4">
                        <h3 className={`text-lg font-semibold flex items-center gap-2 ${theme.text}`}>
                            <GraduationCap className="w-4 h-4" />
                            Educational Qualification
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label className={theme.textSecondary}>Degree/Diploma</Label>
                                <Input
                                    {...register("lastQualification.name")}
                                    placeholder="e.g., B.Sc, M.Com"
                                    className={inputClass}
                                    disabled={isLoading}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className={theme.textSecondary}>Major/Subject</Label>
                                <Input
                                    {...register("lastQualification.major")}
                                    placeholder="e.g., Accounting, Physics"
                                    className={inputClass}
                                    disabled={isLoading}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className={theme.textSecondary}>Institute</Label>
                                <Input
                                    {...register("lastQualification.institute")}
                                    placeholder="University/College name"
                                    className={inputClass}
                                    disabled={isLoading}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Photo */}
                    <div className="space-y-4">
                        <h3 className={`text-lg font-semibold ${theme.text}`}>Photo</h3>
                        <div className="space-y-2">
                            <Label className={theme.textSecondary}>Photo URL</Label>
                            <Input
                                {...register("photo")}
                                placeholder="Enter photo URL or path"
                                className={inputClass}
                                disabled={isLoading}
                            />
                            <p className={`text-xs ${theme.textMuted}`}>
                                Enter URL of the staff photo. Upload functionality coming soon.
                            </p>
                        </div>
                    </div>

                    {/* Status */}
                    <div className={`flex items-center justify-between p-4 border rounded-lg ${theme.statusBox}`}>
                        <div>
                            <Label className={`text-base ${theme.text}`}>Active Status</Label>
                            <p className={`text-sm ${theme.textMuted}`}>
                                {watch("isActive") ? "Staff member is active" : "Staff member is inactive"}
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
                    {(errors.name || errors.designation || errors.session || errors.phoneNumber) && (
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
                                "Update Staff"
                            ) : (
                                "Add Staff"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}