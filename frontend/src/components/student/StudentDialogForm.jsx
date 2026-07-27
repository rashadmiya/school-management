import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { 
  useCreateStudentMutation,
  useCreateStudentWithPhotoMutation 
} from "@/features/apis/api";
import { toast } from "react-toastify";
import ParentSearchSelector from "../common/ParentSearchSelector";
import { 
  User, 
  Camera, 
  Calendar, 
  GraduationCap, 
  Phone,
  BookOpen,
  UserCog
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUpdateStudentMutation, } from "@/features/apis/studentsApi";

export default function StudentDialogForm({
    open,
    onOpenChange,
    initialData = null,
    onSaved,
    classes = [],
    // grades = [],
}) {
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

    // Watch for disability status
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
            // Prepare the data
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
                // Set default password for new student if not provided
                if (!submitData.password) {
                    submitData.password = "123456";
                }

                if (photo) {
                    // Use create-with-photo endpoint
                    const formDataWithPhoto = new FormData();
                    
                    // Append all fields to form data
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
                    // Use simple create endpoint
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

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-auto flex flex-col p-0">
                {/* Header */}
                <div className="sticky top-0 z-10 bg-white px-6 py-4 border-b">
                    <DialogHeader>
                        <DialogTitle className="text-xl">
                            {initialData ? "Edit Student" : "Create New Student"}
                        </DialogTitle>
                    </DialogHeader>
                    
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2">
                        <TabsList className="grid grid-cols-4">
                            <TabsTrigger value="basic">Basic Info</TabsTrigger>
                            <TabsTrigger value="family">Family Info</TabsTrigger>
                            <TabsTrigger value="academic">Academic</TabsTrigger>
                            <TabsTrigger value="personal">Personal</TabsTrigger>
                        </TabsList>


                {/* Scrollable form body */}
                        <div className="overflow-y-auto px-6 py-4 flex-1">
                            <form id="studentForm" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                                
                                {/* Tab 1: Basic Information */}
                                <TabsContent value="basic" className="space-y-4 mt-0">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Name */}
                                        <div className="space-y-2">
                                            <Label htmlFor="name" className="text-sm font-medium">
                                                Full Name *
                                            </Label>
                                            <Input
                                                id="name"
                                                {...register("name", { required: "Name is required" })}
                                                placeholder="Enter full name"
                                                className={errors.name ? "border-red-500" : ""}
                                            />
                                            {errors.name && (
                                                <p className="text-sm text-red-500">{errors.name.message}</p>
                                            )}
                                        </div>

                                        {/* Roll Number */}
                                        <div className="space-y-2">
                                            <Label htmlFor="rollNumber" className="text-sm font-medium">
                                                Roll Number *
                                            </Label>
                                            <Input
                                                id="rollNumber"
                                                {...register("rollNumber", { required: "Roll number is required" })}
                                                placeholder="Enter roll number"
                                                className={errors.rollNumber ? "border-red-500" : ""}
                                            />
                                            {errors.rollNumber && (
                                                <p className="text-sm text-red-500">{errors.rollNumber.message}</p>
                                            )}
                                        </div>

                                        {/* Session */}
                                        <div className="space-y-2">
                                            <Label htmlFor="session" className="text-sm font-medium">
                                                Session *
                                            </Label>
                                            <Input
                                                id="session"
                                                {...register("session", { required: "Session is required" })}
                                                placeholder="e.g., 2024-2025"
                                                className={errors.session ? "border-red-500" : ""}
                                            />
                                            {errors.session && (
                                                <p className="text-sm text-red-500">{errors.session.message}</p>
                                            )}
                                        </div>

                                        {/* Birth Registration No */}
                                        <div className="space-y-2">
                                            <Label htmlFor="birthRegNo" className="text-sm font-medium">
                                                Birth Registration No
                                            </Label>
                                            <Input
                                                id="birthRegNo"
                                                {...register("birthRegNo")}
                                                placeholder="Enter birth registration number"
                                            />
                                        </div>
                                    </div>

                                    {/* Photo Upload */}
                                    <div className="space-y-3 border rounded-lg p-4">
                                        <Label>Student Photo</Label>
                                        <div className="flex items-center gap-4">
                                            <div className="relative">
                                                {photoPreview ? (
                                                    <img
                                                        src={photoPreview}
                                                        alt="Preview"
                                                        className="w-24 h-24 rounded-full object-cover border"
                                                    />
                                                ) : (
                                                    <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center">
                                                        <User className="w-8 h-8 text-gray-400" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <Input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handlePhotoChange}
                                                    className="mb-2"
                                                />
                                                <p className="text-xs text-gray-500">
                                                    {initialData && initialData.photo 
                                                        ? "Upload new photo to replace existing one" 
                                                        : "Upload a student photo (optional)"}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    Supported formats: JPG, PNG, WebP. Max size: 5MB
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Password Field (only for new student) */}
                                    {!initialData && (
                                        <div className="space-y-2">
                                            <Label htmlFor="password" className="text-sm font-medium">
                                                Password
                                            </Label>
                                            <Input
                                                id="password"
                                                type="password"
                                                {...register("password")}
                                                placeholder="Enter password (default: 123456)"
                                                className={errors.password ? "border-red-500" : ""}
                                            />
                                            <p className="text-xs text-gray-500">
                                                Leave blank to use default password: 123456
                                            </p>
                                        </div>
                                    )}
                                </TabsContent>

                                {/* Tab 2: Family Information */}
                                <TabsContent value="family" className="space-y-4 mt-0">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Father's Name */}
                                        <div className="space-y-2">
                                            <Label htmlFor="fathersName" className="text-sm font-medium">
                                                Father's Name
                                            </Label>
                                            <Input
                                                id="fathersName"
                                                {...register("fathersName")}
                                                placeholder="Enter father's name"
                                            />
                                        </div>

                                        {/* Mother's Name */}
                                        <div className="space-y-2">
                                            <Label htmlFor="mothersName" className="text-sm font-medium">
                                                Mother's Name
                                            </Label>
                                            <Input
                                                id="mothersName"
                                                {...register("mothersName")}
                                                placeholder="Enter mother's name"
                                            />
                                        </div>

                                        {/* Guardian Contact */}
                                        <div className="space-y-2">
                                            <Label htmlFor="guardianContact" className="text-sm font-medium">
                                                Guardian Contact *
                                            </Label>
                                            <div className="relative">
                                                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                                <Input
                                                    id="guardianContact"
                                                    {...register("guardianContact", { required: "Guardian contact is required" })}
                                                    placeholder="Enter guardian contact number"
                                                    className={errors.guardianContact ? "border-red-500 pl-10" : "pl-10"}
                                                />
                                            </div>
                                            {errors.guardianContact && (
                                                <p className="text-sm text-red-500">{errors.guardianContact.message}</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Parent Search Selector */}
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium">Parent / Guardian</Label>
                                        <ParentSearchSelector
                                            selectedParent={selectedParent}
                                            onParentSelect={handleParentSelect}
                                            onParentClear={handleParentClear}
                                        />
                                        <p className="text-xs text-gray-500">
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
                                                <Label htmlFor="classId" className="text-sm font-medium">
                                                    Class
                                                </Label>
                                                <Select 
                                                    onValueChange={(value) => setValue("classId", value)} 
                                                    defaultValue={watch("classId")}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select class" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {classes.map((classItem) => (
                                                            <SelectItem key={classItem._id} value={classItem._id}>
                                                                {classItem.name} {classItem.section ? `- (${classItem.section.name})` : ''}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        )}

                                        {/* Grade Selection */}
                                        {/* {grades.length > 0 && (
                                            <div className="space-y-2">
                                                <Label htmlFor="gradeId" className="text-sm font-medium">
                                                    Grade
                                                </Label>
                                                <Select 
                                                    onValueChange={(value) => setValue("gradeId", value)} 
                                                    defaultValue={watch("gradeId")}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select grade" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {grades.map((grade) => (
                                                            <SelectItem key={grade._id} value={grade._id}>
                                                                {grade.name} {grade.level ? `(Level ${grade.level})` : ''}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        )} */}

                                        {/* Last Exam Result */}
                                        <div className="md:col-span-2 space-y-3">
                                            <Label className="text-sm font-medium flex items-center gap-2">
                                                <GraduationCap className="w-4 h-4" />
                                                Last Exam Result
                                            </Label>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                <Input
                                                    placeholder="Exam Name"
                                                    {...register("lastExamResult.examName")}
                                                />
                                                <Input
                                                    placeholder="Achieved Marks"
                                                    type="number"
                                                    {...register("lastExamResult.achievedMarks")}
                                                />
                                                <Input
                                                    placeholder="Total Marks"
                                                    type="number"
                                                    {...register("lastExamResult.totalMarks")}
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
                                            <Label htmlFor="gender" className="text-sm font-medium">
                                                Gender
                                            </Label>
                                            <Select 
                                                onValueChange={(value) => setValue("gender", value)} 
                                                defaultValue={watch("gender")}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select gender" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="male">Male</SelectItem>
                                                    <SelectItem value="female">Female</SelectItem>
                                                    <SelectItem value="other">Other</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {/* Date of Birth */}
                                        <div className="space-y-2">
                                            <Label htmlFor="dateOfBirth" className="text-sm font-medium">
                                                Date of Birth
                                            </Label>
                                            <div className="relative">
                                                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                                <Input
                                                    id="dateOfBirth"
                                                    type="date"
                                                    {...register("dateOfBirth")}
                                                    max={new Date().toISOString().split('T')[0]}
                                                    className="pl-10"
                                                />
                                            </div>
                                        </div>

                                        {/* Religion */}
                                        <div className="space-y-2">
                                            <Label htmlFor="religion" className="text-sm font-medium">
                                                Religion
                                            </Label>
                                            <Input
                                                id="religion"
                                                {...register("religion")}
                                                placeholder="Enter religion"
                                            />
                                        </div>

                                        {/* Physical Disability Toggle */}
                                        <div className="flex items-center justify-between p-4 border rounded-lg">
                                            <div>
                                                <Label htmlFor="isPhysicallyDisabled" className="text-sm font-medium">
                                                    Physically Disabled
                                                </Label>
                                                <p className="text-xs text-gray-500">
                                                    Check if student has any physical disability
                                                </p>
                                            </div>
                                            <Switch
                                                id="isPhysicallyDisabled"
                                                checked={watch("isPhysicallyDisabled")}
                                                onCheckedChange={(checked) => {
                                                    setValue("isPhysicallyDisabled", checked);
                                                    if (!checked) {
                                                        setValue("disabilityDescription", "");
                                                    }
                                                }}
                                            />
                                        </div>

                                        {/* Disability Description (conditional) */}
                                        {isDisabled && (
                                            <div className="md:col-span-2 space-y-2">
                                                <Label htmlFor="disabilityDescription" className="text-sm font-medium">
                                                    Disability Description
                                                </Label>
                                                <Textarea
                                                    id="disabilityDescription"
                                                    {...register("disabilityDescription")}
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
                <div className="sticky bottom-0 bg-white px-6 py-4 border-t flex justify-between gap-3">
                    <div className="flex gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setActiveTab(activeTab === "basic" ? "personal" : 
                                activeTab === "family" ? "basic" :
                                activeTab === "academic" ? "family" : "academic")}
                        >
                            Previous
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setActiveTab(activeTab === "basic" ? "family" : 
                                activeTab === "family" ? "academic" :
                                activeTab === "academic" ? "personal" : "basic")}
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
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            form="studentForm"
                            disabled={isLoading}
                        >
                            {isLoading ? "Saving..." : initialData ? "Update Student" : "Create Student"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// // components/student/StudentDialogForm.jsx - UPDATED VERSION
// import { Button } from "@/components/ui/button";
// import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
// import { Input } from "@/components/ui/input";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { useUpdateStudentMutation, useUpdateStudentProfileMutation } from "@/features/apis/studentsApi";
// import { studentSchema } from "@/schemas/studentSchema";
// import { zodResolver } from "@hookform/resolvers/zod";
// import { useEffect, useState } from "react";
// import { useForm } from "react-hook-form";
// import ParentSearchSelector from "../common/ParentSearchSelector";
// import { useCreateStudentMutation } from "@/features/apis/api";
// import { toast } from "react-toastify";

// export default function StudentDialogForm({
//     open,
//     onOpenChange,
//     initialData = null,
//     onSaved,
//     classes = [],
//     grades = [],
// }) {
//     const {
//         register,
//         handleSubmit,
//         reset,
//         setValue,
//         watch,
//         formState: { errors, isDirty }
//     } = useForm({
//         resolver: zodResolver(studentSchema),
//         defaultValues: initialData || {
//             name: "",
//             rollNumber: "",
//             password: "",
//             contact: "",
//             gender: "",
//             dateOfBirth: "",
//             classId: "",
//             gradeId: "",
//             parentId: ""
//         }
//     });

//     const [createStudent, { isLoading: creating }] = useCreateStudentMutation();
//     // const [updateStudent, { isLoading: updating }] = useUpdateStudentProfileMutation();
//     const [updateStudent, { isLoading: updating }] = useUpdateStudentMutation();

//     const [selectedParent, setSelectedParent] = useState(null);

//     useEffect(() => {
//         // Map backend field names to form field names
//         const formData = initialData ? {
//             name: initialData.name || "",
//             rollNumber: initialData.rollNumber || "",
//             contact: initialData.contact || "",
//             gender: initialData.gender || "",
//             dateOfBirth: initialData.dateOfBirth ? new Date(initialData.dateOfBirth).toISOString().split('T')[0] : "",
//             classId: initialData.class?._id || "",
//             gradeId: initialData.grade?._id || "",
//             parentId: initialData.parent?._id || "",
//             password: "" // Always empty for updates unless changing
//         } : {
//             name: "",
//             rollNumber: "",
//             password: "",
//             contact: "",
//             gender: "",
//             dateOfBirth: "",
//             classId: "",
//             gradeId: "",
//             parentId: ""
//         };

//         reset(formData);
        
//         // Set selected parent for display
//         if (initialData?.parent) {
//             setSelectedParent(initialData.parent);
//         } else {
//             setSelectedParent(null);
//         }
//     }, [initialData, reset]);

//     const handleParentSelect = (parent) => {
//         setSelectedParent(parent);
//         setValue("parentId", parent._id, { shouldValidate: true });
//     };

//     const handleParentClear = () => {
//         setSelectedParent(null);
//         setValue("parentId", "", { shouldValidate: true });
//     };

//     const onSubmit = async (data) => {
//         try {
//             // For new student, ensure password is provided or use default
//             if (!initialData && !data.password) {
//                 data.password = "123456"; // Use default password if not provided
//             }

//             // Prepare the data for API
//             const submitData = {
//                 name: data.name,
//                 rollNumber: data.rollNumber,
//                 contact: data.contact,
//                 gender: data.gender,
//                 dateOfBirth: data.dateOfBirth,
//                 classId: data.classId,
//                 gradeId: data.gradeId,
//                 parentId: data.parentId || undefined, // Send undefined if empty
//                 ...(data.password && { password: data.password }) // Only include password if provided
//             };

//             if (initialData) {
//                 await updateStudent({ id: initialData._id, ...submitData }).unwrap();
//             } else {
//                 await createStudent(submitData).unwrap();
//             }
            
//             onOpenChange(false);
//             onSaved?.();
//             reset();
//             setSelectedParent(null);

//         } catch (err) {
//             console.error("Error saving student:", err);
//             toast.error(err?.data?.message || "Error saving student");
//         }
//     };

//     const isLoading = creating || updating;

//     return (
//         <Dialog open={open} onOpenChange={onOpenChange}>
//             <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-hidden flex flex-col p-0">
//                 {/* Header */}
//                 <div className="sticky top-0 z-10 bg-white px-6 py-4 border-b">
//                     <DialogHeader>
//                         <DialogTitle>
//                             {initialData ? "Edit Student" : "Create New Student"}
//                         </DialogTitle>
//                         <DialogClose />
//                     </DialogHeader>
//                 </div>

//                 {/* Scrollable form body */}
//                 <div className="overflow-y-auto px-6 py-4 flex-1">
//                     <form id="studentForm" onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
//                         {/* Name Field */}
//                         <div className="space-y-2">
//                             <label htmlFor="name" className="text-sm font-medium">
//                                 Full Name *
//                             </label>
//                             <Input
//                                 id="name"
//                                 {...register("name")}
//                                 placeholder="Enter full name"
//                                 className={errors.name ? "border-red-500" : ""}
//                             />
//                             {errors.name && (
//                                 <p className="text-sm text-red-500">{errors.name.message}</p>
//                             )}
//                         </div>

//                         {/* Roll Number Field */}
//                         <div className="space-y-2">
//                             <label htmlFor="rollNumber" className="text-sm font-medium">
//                                 Roll Number *
//                             </label>
//                             <Input
//                                 id="rollNumber"
//                                 {...register("rollNumber")}
//                                 placeholder="Enter roll number"
//                                 className={errors.rollNumber ? "border-red-500" : ""}
//                             />
//                             {errors.rollNumber && (
//                                 <p className="text-sm text-red-500">{errors.rollNumber.message}</p>
//                             )}
//                         </div>

//                         {/* Contact Field */}
//                         <div className="space-y-2">
//                             <label htmlFor="contact" className="text-sm font-medium">
//                                 Contact Number
//                             </label>
//                             <Input
//                                 id="contact"
//                                 {...register("contact")}
//                                 placeholder="Enter contact number"
//                             />
//                         </div>

//                         {/* Gender Field */}
//                         <div className="space-y-2">
//                             <label htmlFor="gender" className="text-sm font-medium">
//                                 Gender
//                             </label>
//                             <Select onValueChange={(value) => setValue("gender", value)} defaultValue={watch("gender")}>
//                                 <SelectTrigger>
//                                     <SelectValue placeholder="Select gender" />
//                                 </SelectTrigger>
//                                 <SelectContent>
//                                     <SelectItem value="male">Male</SelectItem>
//                                     <SelectItem value="female">Female</SelectItem>
//                                     <SelectItem value="other">Other</SelectItem>
//                                 </SelectContent>
//                             </Select>
//                         </div>

//                         {/* Date of Birth Field */}
//                         <div className="space-y-2">
//                             <label htmlFor="dateOfBirth" className="text-sm font-medium">
//                                 Date of Birth
//                             </label>
//                             <Input
//                                 id="dateOfBirth"
//                                 type="date"
//                                 {...register("dateOfBirth")}
//                                 max={new Date().toISOString().split('T')[0]} // Prevent future dates
//                             />
//                         </div>

//                         {/* Class Selection */}
//                         {classes.length > 0 && (
//                             <div className="space-y-2">
//                                 <label htmlFor="classId" className="text-sm font-medium">
//                                     Class
//                                 </label>
//                                 <Select onValueChange={(value) => setValue("classId", value)} defaultValue={watch("classId")}>
//                                     <SelectTrigger>
//                                         <SelectValue placeholder="Select class" />
//                                     </SelectTrigger>
//                                     <SelectContent>
//                                         {classes.map((classItem) => (
//                                             <SelectItem key={classItem._id} value={classItem._id}>
//                                                 {classItem.name} {classItem.section ? `- ${classItem.section}` : ''}
//                                             </SelectItem>
//                                         ))}
//                                     </SelectContent>
//                                 </Select>
//                             </div>
//                         )}

//                         {/* Grade Selection */}
//                         {grades.length > 0 && (
//                             <div className="space-y-2">
//                                 <label htmlFor="gradeId" className="text-sm font-medium">
//                                     Grade
//                                 </label>
//                                 <Select onValueChange={(value) => setValue("gradeId", value)} defaultValue={watch("gradeId")}>
//                                     <SelectTrigger>
//                                         <SelectValue placeholder="Select grade" />
//                                     </SelectTrigger>
//                                     <SelectContent>
//                                         {grades.map((grade) => (
//                                             <SelectItem key={grade._id} value={grade._id}>
//                                                 {grade.name} {grade.level ? `(Level ${grade.level})` : ''}
//                                             </SelectItem>
//                                         ))}
//                                     </SelectContent>
//                                 </Select>
//                             </div>
//                         )}

//                         {/* Parent Search Selector */}
//                         <ParentSearchSelector
//                             selectedParent={selectedParent}
//                             onParentSelect={handleParentSelect}
//                             onParentClear={handleParentClear}
//                         />

//                         {/* Password Field */}
//                         <div className="space-y-2">
//                             <label htmlFor="password" className="text-sm font-medium">
//                                 {initialData ? "New Password" : "Password *"}
//                             </label>
//                             <Input
//                                 id="password"
//                                 type="password"
//                                 {...register("password")}
//                                 placeholder={initialData ? "Enter new password (optional)" : "Enter password"}
//                                 className={errors.password ? "border-red-500" : ""}
//                             />
//                             {errors.password && (
//                                 <p className="text-sm text-red-500">{errors.password.message}</p>
//                             )}
//                             {!initialData && (
//                                 <p className="text-xs text-gray-500">
//                                     Leave blank to use default password: 123456
//                                 </p>
//                             )}
//                             {initialData && (
//                                 <p className="text-xs text-gray-500">
//                                     Leave blank to keep current password
//                                 </p>
//                             )}
//                         </div>
//                     </form>
//                 </div>

//                 {/* Footer */}
//                 <div className="sticky bottom-0 bg-white px-6 py-4 border-t flex justify-end gap-3">
//                     <Button
//                         type="button"
//                         variant="outline"
//                         onClick={() => onOpenChange(false)}
//                         disabled={isLoading}
//                     >
//                         Cancel
//                     </Button>

//                     <Button
//                         type="submit"
//                         form="studentForm"
//                         disabled={isLoading}
//                     >
//                         {isLoading ? "Saving..." : initialData ? "Save Changes" : "Create Student"}
//                     </Button>
//                 </div>
//             </DialogContent>
//         </Dialog>
//     );
// }