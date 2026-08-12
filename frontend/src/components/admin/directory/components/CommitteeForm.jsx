// components/admin/directory/forms/CommitteeForm.jsx
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useCreateCommitteeMemberMutation, useUpdateCommitteeMemberMutation } from "@/features/apis/directoryApi";
import { useAppSelector } from "@/features/store";
import { handleApiError } from "@/utils/handleApiErrors";
import { AlertCircle, Award, Check, Phone, Quote } from "lucide-react";
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
        quoteBox: isDarkMode ? "bg-gray-800/50 border-gray-700" : "bg-gray-50 border-gray-200",
        alert: isDarkMode ? "bg-red-900/20 border-red-800 text-red-400" : "bg-red-50 border-red-200 text-red-800",
        divider: isDarkMode ? "border-gray-700" : "border-gray-200",
    };
};

export default function CommitteeForm({ open, onOpenChange, initialData }) {
    const theme = useTheme();

    const [createMember, { isLoading: isCreatingMember }] = useCreateCommitteeMemberMutation();
    const [updateMember, { isLoading: isUpdating }] = useUpdateCommitteeMemberMutation();

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
            phoneNumber: "",
            address: "",
            religion: "",
            photo: "",
            quote: "",
            order: 1,
            isActive: true
        }
    });

    // Watch form values
    const watchedName = watch("name");
    const watchedDesignation = watch("designation");

    // Check if quote should be shown
    const quoteAllowedDesignations = ['chairman', 'secretary', 'principal'];
    const showQuoteField = quoteAllowedDesignations.includes(watchedDesignation);

    const currentYear = new Date().getFullYear();
    const sessionOptions = [
        `${currentYear - 2}-${currentYear - 1}`,
        `${currentYear - 1}-${currentYear}`,
        `${currentYear}-${currentYear + 1}`,
        `${currentYear + 1}-${currentYear + 2}`
    ];

    const designationOptions = [
        { value: "chairman", label: "Chairman" },
        { value: "secretary", label: "Secretary" },
        { value: "treasurer", label: "Treasurer" },
        { value: "principal", label: "Principal" },
        { value: "member", label: "Member" }
    ];

    const religionOptions = ["Islam", "Hinduism", "Christianity", "Buddhism", "Other"];

    // Input base class
    const inputClass = `${theme.bgInput} ${theme.borderInput} ${theme.focusRing} text-gray-900 dark:text-white ${theme.placeholder}`;

    useEffect(() => {
        if (open) {
            if (initialData) {
                const editData = {
                    name: initialData.name || "",
                    designation: initialData.designation || "member",
                    session: initialData.session || `${currentYear}-${currentYear + 1}`,
                    phoneNumber: initialData.phoneNumber || "",
                    address: initialData.address || "",
                    religion: initialData.religion || "",
                    photo: initialData.photo || "",
                    quote: initialData.quote || "",
                    order: initialData.order || 1,
                    isActive: initialData.isActive !== false
                };
                reset(editData);
            } else {
                reset({
                    name: "",
                    designation: "member",
                    session: `${currentYear}-${currentYear + 1}`,
                    phoneNumber: "",
                    address: "",
                    religion: "",
                    photo: "",
                    quote: "",
                    order: 1,
                    isActive: true
                });
            }
        }
    }, [open, initialData, reset, currentYear]);

    // Clear quote when designation changes to non-allowed role
    useEffect(() => {
        if (watchedDesignation && !quoteAllowedDesignations.includes(watchedDesignation)) {
            setValue("quote", "");
        }
    }, [watchedDesignation, setValue]);

    const onSubmit = async (data) => {
        try {
            const payload = {
                ...data,
                quote: quoteAllowedDesignations.includes(data.designation) ? data.quote : ""
            };

            if (initialData) {
                await updateMember({ id: initialData._id, ...payload }).unwrap();
                toast.success("Committee member updated");
            } else {
                await createMember(payload).unwrap();
                toast.success("Committee member added");
            }
            onOpenChange(false);
        } catch (err) {
            handleApiError(err || "Error saving committee member");
        }
    };

    const isLoading = isCreatingMember || isUpdating;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className={`sm:max-w-[600px] max-h-[90vh] overflow-y-auto ${theme.dialog}`}>
                <DialogHeader>
                    <DialogTitle className={`flex items-center gap-2 ${theme.text}`}>
                        <Award className="w-5 h-5" />
                        {initialData ? `Edit Committee Member: ${initialData.name}` : "Add Committee Member"}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {/* Basic Information */}
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

                        {/* Order */}
                        <div className="space-y-2">
                            <Label className={theme.textSecondary}>Display Order</Label>
                            <Input
                                type="number"
                                min="1"
                                {...register("order", {
                                    min: { value: 1, message: "Order must be at least 1" },
                                    valueAsNumber: true
                                })}
                                placeholder="Display order (1, 2, 3...)"
                                className={`${inputClass} ${errors.order ? "border-red-500" : ""}`}
                                disabled={isLoading}
                            />
                            {errors.order && (
                                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" />
                                    {errors.order.message}
                                </p>
                            )}
                            <p className={`text-xs ${theme.textMuted}`}>Lower numbers appear first</p>
                        </div>
                    </div>

                    {/* Quote Field - Conditionally Rendered */}
                    {showQuoteField && (
                        <div className={`space-y-2 p-4 border rounded-lg ${theme.quoteBox}`}>
                            <Label className={`flex items-center gap-2 ${theme.textSecondary}`}>
                                <Quote className="w-4 h-4" />
                                Inspirational Quote
                                <span className={`text-xs ${theme.textMuted} ml-auto`}>
                                    (Optional for {watchedDesignation})
                                </span>
                            </Label>
                            <Textarea
                                {...register("quote")}
                                placeholder={`Enter inspirational quote for the ${watchedDesignation}`}
                                rows={3}
                                disabled={isLoading}
                                className={`${inputClass} resize-none`}
                            />
                            <p className={`text-xs ${theme.textMuted}`}>
                                This quote will be displayed prominently on the committee page.
                            </p>
                        </div>
                    )}

                    {/* Contact Information */}
                    <div className="space-y-4">
                        <h3 className={`text-lg font-semibold flex items-center gap-2 ${theme.text}`}>
                            <Phone className="w-4 h-4" />
                            Contact Information
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Phone Number */}
                            <div className="space-y-2">
                                <Label className={theme.textSecondary}>Phone Number</Label>
                                <Input
                                    {...register("phoneNumber")}
                                    placeholder="Enter phone number"
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
                                            value={field.value ?? "none"}
                                            onValueChange={(value) =>
                                                field.onChange(value === "none" ? undefined : value)
                                            }
                                            disabled={isLoading}
                                        >
                                            <SelectTrigger className={theme.select.trigger}>
                                                <SelectValue placeholder="Select religion" />
                                            </SelectTrigger>
                                            <SelectContent className={theme.select.content}>
                                                <SelectItem value="none" className={theme.select.item}>Not specified</SelectItem>
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

                    {/* Photo */}
                    <div className="space-y-2">
                        <Label className={theme.textSecondary}>Photo URL</Label>
                        <Input
                            {...register("photo")}
                            placeholder="Enter photo URL or path"
                            className={inputClass}
                            disabled={isLoading}
                        />
                        <p className={`text-xs ${theme.textMuted}`}>
                            Enter URL of the committee member's photo
                        </p>
                    </div>

                    {/* Status */}
                    <div className={`flex items-center justify-between p-4 border rounded-lg ${theme.quoteBox}`}>
                        <div>
                            <Label className={`text-base ${theme.text}`}>Active Status</Label>
                            <p className={`text-sm ${theme.textMuted}`}>
                                {watch("isActive") ? "Member is active" : "Member is inactive"}
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
                    {(errors.name || errors.designation || errors.session || errors.order) && (
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