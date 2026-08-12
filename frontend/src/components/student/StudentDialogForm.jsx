// components/student/StudentDialogForm.jsx
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
    useCreateStudentMutation,
    useCreateStudentWithPhotoMutation
} from "@/features/apis/api";
import { useUpdateStudentMutation } from "@/features/apis/studentsApi";
import { useAppSelector } from "@/features/store";
import {
    Calendar,
    GraduationCap,
    Phone,
    User
} from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import ParentSearchSelector from "../common/ParentSearchSelector";

// Shared theme hook – can be moved to hooks/useTheme.js
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
    switch: isDarkMode ? "data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-gray-700" : "",
    tabs: {
      list: isDarkMode ? "bg-gray-800" : "bg-gray-100",
      trigger: isDarkMode 
        ? "text-gray-400 data-[state=active]:bg-gray-700 data-[state=active]:text-white" 
        : "text-gray-600 data-[state=active]:bg-white data-[state=active]:text-gray-900",
    },
  };
};

export default function StudentDialogForm({
    open,
    onOpenChange,
    initialData = null,
    onSaved,
    classes = [],
}) {
    const theme = useTheme();
    const [activeTab, setActiveTab] = useState("basic");
    const [photo, setPhoto] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);
    const [selectedParent, setSelectedParent] = useState(null);

    const [createStudent, { isLoading: creating }] = useCreateStudentMutation();
    const [createStudentWithPhoto, { isLoading: creatingWithPhoto }] = useCreateStudentWithPhotoMutation();
    const [updateStudent, { isLoading: updating }] = useUpdateStudentMutation();

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        watch,
        formState: { errors, isDirty }
    } = useForm({
        defaultValues: initialData || {
            name: "",
            rollNumber: "",
            password: "",
            guardianContact: "",
            gender: "",
            dateOfBirth: "",
            classId: "",
            gradeId: "",
            parentId: "",
            session: new Date().getFullYear() + "-" + (new Date().getFullYear() + 1),
            birthRegNo: "",
            fathersName: "",
            mothersName: "",
            religion: "",
            isPhysicallyDisabled: false,
            disabilityDescription: "",
            lastExamResult: {
                examName: "",
                achievedMarks: "",
                totalMarks: ""
            }
        }
    });

    const isDisabled = watch("isPhysicallyDisabled");

    useEffect(() => {
        if (initialData) {
            const formData = {
                name: initialData.name || "",
                rollNumber: initialData.rollNumber || "",
                guardianContact: initialData.guardianContact || "",
                gender: initialData.gender || "",
                dateOfBirth: initialData.dateOfBirth ? 
                    new Date(initialData.dateOfBirth).toISOString().split('T')[0] : "",
                classId: initialData.class?._id || "",
                gradeId: initialData.grade?._id || "",
                parentId: initialData.parent?._id || "",
                password: "",
                session: initialData.session || 
                    new Date().getFullYear() + "-" + (new Date().getFullYear() + 1),
                birthRegNo: initialData.birthRegNo || "",
                fathersName: initialData.fathersName || "",
                mothersName: initialData.mothersName || "",
                religion: initialData.religion || "",
                isPhysicallyDisabled: initialData.isPhysicallyDisabled || false,
                disabilityDescription: initialData.disabilityDescription || "",
                lastExamResult: initialData.lastExamResult || {
                    examName: "",
                    achievedMarks: "",
                    totalMarks: ""
                }
            };
            
            reset(formData);
            
            if (initialData?.parent) {
                setSelectedParent(initialData.parent);
            } else {
                setSelectedParent(null);
            }

            if (initialData.photo) {
                setPhotoPreview(initialData.photo);
            }
        } else {
            reset({
                name: "",
                rollNumber: "",
                password: "",
                guardianContact: "",
                gender: "",
                dateOfBirth: "",
                classId: "",
                gradeId: "",
                parentId: "",
                session: new Date().getFullYear() + "-" + (new Date().getFullYear() + 1),
                birthRegNo: "",
                fathersName: "",
                mothersName: "",
                religion: "",
                isPhysicallyDisabled: false,
                disabilityDescription: "",
                lastExamResult: {
                    examName: "",
                    achievedMarks: "",
                    totalMarks: ""
                }
            });
            setSelectedParent(null);
            setPhoto(null);
            setPhotoPreview(null);
        }
    }, [initialData, reset]);

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setPhoto(file);
            setPhotoPreview(URL.createObjectURL(file));
        }
    };

    const handleParentSelect = (parent) => {
        setSelectedParent(parent);
        setValue("parentId", parent._id, { shouldValidate: true });
    };

    const handleParentClear = () => {
        setSelectedParent(null);
        setValue("parentId", "", { shouldValidate: true });
    };

    const onSubmit = async (formData) => {
        try {
            const submitData = {
                name: formData.name,
                rollNumber: formData.rollNumber,
                guardianContact: formData.guardianContact,
                gender: formData.gender,
                dateOfBirth: formData.dateOfBirth,
                classId: formData.classId,
                gradeId: formData.gradeId,
                parentId: formData.parentId || undefined,
                session: formData.session,
                birthRegNo: formData.birthRegNo,
                fathersName: formData.fathersName,
                mothersName: formData.mothersName,
                religion: formData.religion,
                isPhysicallyDisabled: formData.isPhysicallyDisabled,
                disabilityDescription: formData.disabilityDescription,
                lastExamResult: formData.lastExamResult,
                ...(formData.password && { password: formData.password })
            };

            if (initialData) {
                await updateStudent({ id: initialData._id, ...submitData }).unwrap();
                toast.success("Student updated successfully");
            } else {
                if (!submitData.password) {
                    submitData.password = "123456";
                }

                if (photo) {
                    const formDataWithPhoto = new FormData();
                    Object.keys(submitData).forEach(key => {
                        if (key === 'lastExamResult') {
                            formDataWithPhoto.append(key, JSON.stringify(submitData[key]));
                        } else if (Array.isArray(submitData[key])) {
                            formDataWithPhoto.append(key, JSON.stringify(submitData[key]));
                        } else {
                            formDataWithPhoto.append(key, submitData[key]);
                        }
                    });
                    formDataWithPhoto.append('photo', photo);
                    await createStudentWithPhoto(formDataWithPhoto).unwrap();
                } else {
                    await createStudent(submitData).unwrap();
                }
                toast.success("Student created successfully");
            }
            
            onOpenChange(false);
            onSaved?.();
            reset();
            setSelectedParent(null);
            setPhoto(null);
            setPhotoPreview(null);
        } catch (err) {
            console.error("Error saving student:", err);
            toast.error(err?.data?.message || "Error saving student");
        }
    };

    const isLoading = creating || updating || creatingWithPhoto;

    // Input base class
    const inputClass = `${theme.bgInput} ${theme.borderInput} ${theme.focusRing} text-gray-900 dark:text-white ${theme.placeholder}`;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className={`sm:max-w-[700px] max-h-[90vh] overflow-auto flex flex-col p-0 ${theme.bg} ${theme.text}`}>
                {/* Header */}
                <div className={`sticky top-0 z-10 px-6 py-4 border-b ${theme.border} ${theme.bg}`}>
                    <DialogHeader>
                        <DialogTitle className={`text-xl ${theme.text}`}>
                            {initialData ? "Edit Student" : "Create New Student"}
                        </DialogTitle>
                    </DialogHeader>
                    
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2">
                        <TabsList className={theme.tabs.list}>
                            <TabsTrigger value="basic" className={theme.tabs.trigger}>Basic Info</TabsTrigger>
                            <TabsTrigger value="family" className={theme.tabs.trigger}>Family</TabsTrigger>
                            <TabsTrigger value="academic" className={theme.tabs.trigger}>Academic</TabsTrigger>
                            <TabsTrigger value="personal" className={theme.tabs.trigger}>Personal</TabsTrigger>
                        </TabsList>

                        <div className="overflow-y-auto px-6 py-4 flex-1">
                            <form id="studentForm" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                                
                                {/* Tab 1: Basic Information */}
                                <TabsContent value="basic" className="space-y-4 mt-0">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Name */}
                                        <div className="space-y-2">
                                            <Label className={theme.textSecondary}>Full Name *</Label>
                                            <Input
                                                {...register("name", { required: "Name is required" })}
                                                className={`${inputClass} ${errors.name ? "border-red-500" : ""}`}
                                                placeholder="Enter full name"
                                            />
                                            {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
                                        </div>

                                        {/* Roll Number */}
                                        <div className="space-y-2">
                                            <Label className={theme.textSecondary}>Roll Number *</Label>
                                            <Input
                                                {...register("rollNumber", { required: "Roll number is required" })}
                                                className={`${inputClass} ${errors.rollNumber ? "border-red-500" : ""}`}
                                                placeholder="Enter roll number"
                                            />
                                            {errors.rollNumber && <p className="text-sm text-red-500">{errors.rollNumber.message}</p>}
                                        </div>

                                        {/* Session */}
                                        <div className="space-y-2">
                                            <Label className={theme.textSecondary}>Session *</Label>
                                            <Input
                                                {...register("session", { required: "Session is required" })}
                                                className={`${inputClass} ${errors.session ? "border-red-500" : ""}`}
                                                placeholder="e.g., 2024-2025"
                                            />
                                            {errors.session && <p className="text-sm text-red-500">{errors.session.message}</p>}
                                        </div>

                                        {/* Birth Registration No */}
                                        <div className="space-y-2">
                                            <Label className={theme.textSecondary}>Birth Registration No</Label>
                                            <Input
                                                {...register("birthRegNo")}
                                                className={inputClass}
                                                placeholder="Enter birth registration number"
                                            />
                                        </div>
                                    </div>

                                    {/* Photo Upload */}
                                    <div className={`space-y-3 border rounded-lg p-4 ${theme.border} ${theme.bgSubtle}`}>
                                        <Label className={theme.textSecondary}>Student Photo</Label>
                                        <div className="flex items-center gap-4">
                                            <div className="relative">
                                                {photoPreview ? (
                                                    <img
                                                        src={photoPreview}
                                                        alt="Preview"
                                                        className="w-24 h-24 rounded-full object-cover border border-gray-300 dark:border-gray-600"
                                                    />
                                                ) : (
                                                    <div className={`w-24 h-24 rounded-full ${theme.bgSubtle} flex items-center justify-center border ${theme.border}`}>
                                                        <User className="w-8 h-8 text-gray-400" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <Input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handlePhotoChange}
                                                    className={`${inputClass} mb-2`}
                                                />
                                                <p className={`text-xs ${theme.textMuted}`}>
                                                    {initialData && initialData.photo 
                                                        ? "Upload new photo to replace existing one" 
                                                        : "Upload a student photo (optional)"}
                                                </p>
                                                <p className={`text-xs ${theme.textMuted}`}>
                                                    Supported formats: JPG, PNG, WebP. Max size: 5MB
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Password Field (only for new student) */}
                                    {!initialData && (
                                        <div className="space-y-2">
                                            <Label className={theme.textSecondary}>Password</Label>
                                            <Input
                                                type="password"
                                                {...register("password")}
                                                className={`${inputClass} ${errors.password ? "border-red-500" : ""}`}
                                                placeholder="Enter password (default: 123456)"
                                            />
                                            <p className={`text-xs ${theme.textMuted}`}>Leave blank to use default password: 123456</p>
                                        </div>
                                    )}
                                </TabsContent>

                                {/* Tab 2: Family Information */}
                                <TabsContent value="family" className="space-y-4 mt-0">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Father's Name */}
                                        <div className="space-y-2">
                                            <Label className={theme.textSecondary}>Father's Name</Label>
                                            <Input
                                                {...register("fathersName")}
                                                className={inputClass}
                                                placeholder="Enter father's name"
                                            />
                                        </div>

                                        {/* Mother's Name */}
                                        <div className="space-y-2">
                                            <Label className={theme.textSecondary}>Mother's Name</Label>
                                            <Input
                                                {...register("mothersName")}
                                                className={inputClass}
                                                placeholder="Enter mother's name"
                                            />
                                        </div>

                                        {/* Guardian Contact */}
                                        <div className="space-y-2">
                                            <Label className={theme.textSecondary}>Guardian Contact *</Label>
                                            <div className="relative">
                                                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                                <Input
                                                    {...register("guardianContact", { required: "Guardian contact is required" })}
                                                    className={`${inputClass} pl-10 ${errors.guardianContact ? "border-red-500" : ""}`}
                                                    placeholder="Enter guardian contact number"
                                                />
                                            </div>
                                            {errors.guardianContact && <p className="text-sm text-red-500">{errors.guardianContact.message}</p>}
                                        </div>
                                    </div>

                                    {/* Parent Search Selector - Optional */}
                                    <div className="space-y-2">
                                        <Label className={theme.textSecondary}>Parent / Guardian</Label>
                                        <ParentSearchSelector
                                            selectedParent={selectedParent}
                                            onParentSelect={handleParentSelect}
                                            onParentClear={handleParentClear}
                                        />
                                        <p className={`text-xs ${theme.textMuted}`}>
                                            Select an existing parent or leave empty to create parent separately
                                        </p>
                                    </div>
                                </TabsContent>

                                {/* Tab 3: Academic Information */}
                                <TabsContent value="academic" className="space-y-4 mt-0">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Class Selection */}
                                        {classes.length > 0 && (
                                            <div className="space-y-2">
                                                <Label className={theme.textSecondary}>Class</Label>
                                                <Select 
                                                    onValueChange={(value) => setValue("classId", value)} 
                                                    value={watch("classId")}
                                                >
                                                    <SelectTrigger className={`${theme.bgInput} ${theme.borderInput} ${theme.text} focus:ring-blue-500`}>
                                                        <SelectValue placeholder="Select class" />
                                                    </SelectTrigger>
                                                    <SelectContent className={theme.bg}>
                                                        {classes.map((classItem) => (
                                                            <SelectItem key={classItem._id} value={classItem._id}>
                                                                {classItem.name} {classItem.section ? `- (${classItem.section.name})` : ''}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        )}

                                        {/* Last Exam Result */}
                                        <div className="md:col-span-2 space-y-3">
                                            <Label className={`${theme.textSecondary} flex items-center gap-2`}>
                                                <GraduationCap className="w-4 h-4" />
                                                Last Exam Result
                                            </Label>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                <Input
                                                    placeholder="Exam Name"
                                                    {...register("lastExamResult.examName")}
                                                    className={inputClass}
                                                />
                                                <Input
                                                    placeholder="Achieved Marks"
                                                    type="number"
                                                    {...register("lastExamResult.achievedMarks")}
                                                    className={inputClass}
                                                />
                                                <Input
                                                    placeholder="Total Marks"
                                                    type="number"
                                                    {...register("lastExamResult.totalMarks")}
                                                    className={inputClass}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </TabsContent>

                                {/* Tab 4: Personal Details */}
                                <TabsContent value="personal" className="space-y-4 mt-0">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Gender */}
                                        <div className="space-y-2">
                                            <Label className={theme.textSecondary}>Gender</Label>
                                            <Select 
                                                onValueChange={(value) => setValue("gender", value)} 
                                                value={watch("gender")}
                                            >
                                                <SelectTrigger className={`${theme.bgInput} ${theme.borderInput} ${theme.text} focus:ring-blue-500`}>
                                                    <SelectValue placeholder="Select gender" />
                                                </SelectTrigger>
                                                <SelectContent className={theme.bg}>
                                                    <SelectItem value="male">Male</SelectItem>
                                                    <SelectItem value="female">Female</SelectItem>
                                                    <SelectItem value="other">Other</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {/* Date of Birth */}
                                        <div className="space-y-2">
                                            <Label className={theme.textSecondary}>Date of Birth</Label>
                                            <div className="relative">
                                                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                                <Input
                                                    type="date"
                                                    {...register("dateOfBirth")}
                                                    className={`${inputClass} pl-10`}
                                                    max={new Date().toISOString().split('T')[0]}
                                                />
                                            </div>
                                        </div>

                                        {/* Religion */}
                                        <div className="space-y-2">
                                            <Label className={theme.textSecondary}>Religion</Label>
                                            <Input
                                                {...register("religion")}
                                                className={inputClass}
                                                placeholder="Enter religion"
                                            />
                                        </div>

                                        {/* Physical Disability Toggle */}
                                        <div className={`flex items-center justify-between p-4 border rounded-lg ${theme.border}`}>
                                            <div>
                                                <Label className={theme.textSecondary}>Physically Disabled</Label>
                                                <p className={`text-xs ${theme.textMuted}`}>
                                                    Check if student has any physical disability
                                                </p>
                                            </div>
                                            <Switch
                                                checked={watch("isPhysicallyDisabled")}
                                                onCheckedChange={(checked) => {
                                                    setValue("isPhysicallyDisabled", checked);
                                                    if (!checked) setValue("disabilityDescription", "");
                                                }}
                                                className={theme.switch}
                                            />
                                        </div>

                                        {/* Disability Description (conditional) */}
                                        {isDisabled && (
                                            <div className="md:col-span-2 space-y-2">
                                                <Label className={theme.textSecondary}>Disability Description</Label>
                                                <Textarea
                                                    {...register("disabilityDescription")}
                                                    className={`${inputClass} min-h-[80px]`}
                                                    placeholder="Describe the disability..."
                                                    rows={3}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </TabsContent>
                            </form>
                        </div>
                    </Tabs>
                </div>

                {/* Footer */}
                <div className={`sticky bottom-0 px-6 py-4 border-t ${theme.border} ${theme.bg} flex justify-between gap-3`}>
                    <div className="flex gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                const tabs = ["basic", "family", "academic", "personal"];
                                const idx = tabs.indexOf(activeTab);
                                setActiveTab(tabs[(idx - 1 + 4) % 4]);
                            }}
                            className={`${theme.border} ${theme.textSecondary} ${theme.bgHover}`}
                        >
                            Previous
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                const tabs = ["basic", "family", "academic", "personal"];
                                const idx = tabs.indexOf(activeTab);
                                setActiveTab(tabs[(idx + 1) % 4]);
                            }}
                            className={`${theme.border} ${theme.textSecondary} ${theme.bgHover}`}
                        >
                            Next
                        </Button>
                    </div>
                    
                    <div className="flex gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isLoading}
                            className={`${theme.border} ${theme.textSecondary} ${theme.bgHover}`}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            form="studentForm"
                            disabled={isLoading}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            {isLoading ? "Saving..." : initialData ? "Update Student" : "Create Student"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}