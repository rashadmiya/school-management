// components/teacher/TeacherDialogForm.jsx
import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import {
  useCreateTeacherMutation,
  useCreateTeacherWithPhotoMutation,
} from "@/features/apis/api";
import { toast } from "react-toastify";
import { Calendar, GraduationCap, MapPin, User } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUpdateTeacherMutation } from "@/features/apis/teachersApi";
import { useAppSelector } from "@/features/store";

// Shared theme hook (can be moved to a separate file)
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
  };
};

// Religion options
const RELIGIONS = [
  { value: "islam", label: "Islam" },
  { value: "hinduism", label: "Hinduism" },
  { value: "christianity", label: "Christianity" },
  { value: "buddhism", label: "Buddhism" },
  { value: "others", label: "Others" },
];

export default function TeacherDialogForm({
  open,
  onOpenChange,
  initialData,
  subjects = [],
  classes = [],
}) {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState("basic");
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  const [createTeacher, { isLoading: creating }] = useCreateTeacherMutation();
  const [createTeacherWithPhoto, { isLoading: creatingWithPhoto }] = useCreateTeacherWithPhotoMutation();
  const [updateTeacher, { isLoading: updating }] = useUpdateTeacherMutation();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: "",
      email: "",
      phoneNumber: "",
      password: "",
      confirmPassword: "",
      gender: "",
      dateOfBirth: "",
      designation: "",
      joiningDate: "",
      nationalIdNo: "",
      lastQualification: {
        name: "",
        major: "",
        institute: "",
      },
      address: "",
      religion: "",
      assignedSubjects: [],
      assignedClasses: [],
    },
  });

  // Load initial data
  useEffect(() => {
    if (open) {
      if (initialData) {
        reset({
          name: initialData.user?.name ?? "",
          email: initialData.user?.email ?? "",
          phoneNumber: initialData.phoneNumber ?? "",
          gender: initialData.gender ?? "",
          dateOfBirth: initialData.dateOfBirth ? new Date(initialData.dateOfBirth).toISOString().split('T')[0] : "",
          designation: initialData.designation ?? "",
          joiningDate: initialData.joiningDate ? new Date(initialData.joiningDate).toISOString().split('T')[0] : "",
          nationalIdNo: initialData.nationalIdNo ?? "",
          lastQualification: {
            name: initialData.lastQualification?.name ?? "",
            major: initialData.lastQualification?.major ?? "",
            institute: initialData.lastQualification?.institute ?? "",
          },
          address: initialData.address ?? "",
          religion: initialData.religion ?? "",
          assignedSubjects: initialData.subjects?.map((s) => s._id) ?? [],
          assignedClasses: initialData.classes?.map((c) => c._id) ?? [],
        });
        if (initialData.photoUrl) {
          setPhotoPreview(initialData.photoUrl);
        }
      } else {
        reset({
          name: "",
          email: "",
          phoneNumber: "",
          password: "",
          confirmPassword: "",
          gender: "",
          dateOfBirth: "",
          designation: "",
          joiningDate: new Date().toISOString().split('T')[0],
          nationalIdNo: "",
          lastQualification: { name: "", major: "", institute: "" },
          address: "",
          religion: "",
          assignedSubjects: [],
          assignedClasses: [],
        });
        setPhoto(null);
        setPhotoPreview(null);
      }
    }
  }, [open, initialData, reset]);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const onSubmit = async (formData) => {
    try {
      if (!initialData) {
        if (!formData.password) return toast.error("Password is required");
        if (formData.password !== formData.confirmPassword)
          return toast.error("Passwords do not match");
      }

      const payload = { ...formData };
      delete payload.confirmPassword;

      if (
        payload.lastQualification &&
        (!payload.lastQualification.name ||
          !payload.lastQualification.major ||
          !payload.lastQualification.institute)
      ) {
        delete payload.lastQualification;
      }

      payload.assignedSubjects = Array.isArray(payload.assignedSubjects)
        ? payload.assignedSubjects
        : [payload.assignedSubjects].filter(Boolean);
      payload.assignedClasses = Array.isArray(payload.assignedClasses)
        ? payload.assignedClasses
        : [payload.assignedClasses].filter(Boolean);

      if (initialData) {
        await updateTeacher({ id: initialData._id, ...payload }).unwrap();
        toast.success("Teacher updated successfully");
      } else {
        if (photo) {
          const formDataWithPhoto = new FormData();
          Object.keys(payload).forEach((key) => {
            if (key === "lastQualification") {
              formDataWithPhoto.append(key, JSON.stringify(payload[key]));
            } else if (Array.isArray(payload[key])) {
              formDataWithPhoto.append(key, JSON.stringify(payload[key]));
            } else {
              formDataWithPhoto.append(key, payload[key]);
            }
          });
          formDataWithPhoto.append("photo", photo);
          await createTeacherWithPhoto(formDataWithPhoto).unwrap();
        } else {
          await createTeacher(payload).unwrap();
        }
        toast.success("Teacher created successfully");
      }
      onOpenChange(false);
    } catch (err) {
      console.error("Error saving teacher:", err);
      toast.error(err?.data?.message || "Error saving teacher");
    }
  };

  const isLoading = creating || updating || creatingWithPhoto;

  // Base input class
  const inputClass = `${theme.bgInput} ${theme.borderInput} ${theme.focusRing} text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={`sm:max-w-[700px] max-h-[90vh] overflow-auto flex flex-col p-0 ${theme.bg} ${theme.text}`}
      >
        {/* Header */}
        <div className={`sticky top-0 z-10 px-6 py-4 border-b ${theme.border} ${theme.bg}`}>
          <DialogHeader>
            <DialogTitle className={`text-xl ${theme.text}`}>
              {initialData ? "Edit Teacher" : "Create New Teacher"}
            </DialogTitle>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2">
            <TabsList className="grid grid-cols-3 bg-gray-100 dark:bg-gray-800">
              <TabsTrigger
                value="basic"
                className="data-[state=active]:bg-white data-[state=active]:text-gray-900 dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white text-gray-600 dark:text-gray-400"
              >
                Basic Info
              </TabsTrigger>
              <TabsTrigger
                value="professional"
                className="data-[state=active]:bg-white data-[state=active]:text-gray-900 dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white text-gray-600 dark:text-gray-400"
              >
                Professional
              </TabsTrigger>
              <TabsTrigger
                value="qualification"
                className="data-[state=active]:bg-white data-[state=active]:text-gray-900 dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white text-gray-600 dark:text-gray-400"
              >
                Qualification
              </TabsTrigger>
            </TabsList>

            <div className="overflow-y-auto px-6 py-4 flex-1">
              <form id="teacherForm" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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

                    {/* Email */}
                    <div className="space-y-2">
                      <Label className={theme.textSecondary}>Email *</Label>
                      <Input
                        type="email"
                        {...register("email", {
                          required: "Email is required",
                          pattern: {
                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                            message: "Invalid email address",
                          },
                        })}
                        className={`${inputClass} ${errors.email ? "border-red-500" : ""}`}
                        placeholder="teacher@school.com"
                      />
                      {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
                    </div>

                    {/* Phone */}
                    <div className="space-y-2">
                      <Label className={theme.textSecondary}>Phone Number *</Label>
                      <Input
                        {...register("phoneNumber", { required: "Phone number is required" })}
                        className={`${inputClass} ${errors.phoneNumber ? "border-red-500" : ""}`}
                        placeholder="+8801234567890"
                      />
                      {errors.phoneNumber && <p className="text-sm text-red-500">{errors.phoneNumber.message}</p>}
                    </div>

                    {/* Gender */}
                    <div className="space-y-2">
                      <Label className={theme.textSecondary}>Gender</Label>
                      <Select
                        value={watch("gender")}
                        onValueChange={(value) => setValue("gender", value)}
                      >
                        <SelectTrigger className={`${inputClass}`}>
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

                    {/* Religion - Dropdown */}
                    <div className="space-y-2">
                      <Label className={theme.textSecondary}>Religion</Label>
                      <Select
                        value={watch("religion")}
                        onValueChange={(value) => setValue("religion", value)}
                      >
                        <SelectTrigger className={`${inputClass}`}>
                          <SelectValue placeholder="Select religion" />
                        </SelectTrigger>
                        <SelectContent className={theme.bg}>
                          {RELIGIONS.map((rel) => (
                            <SelectItem key={rel.value} value={rel.value}>
                              {rel.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Address */}
                  <div className="space-y-2">
                    <Label className={theme.textSecondary}>Address</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
                      <Textarea
                        {...register("address")}
                        className={`${inputClass} pl-10 min-h-[40px]`}
                        placeholder="Enter full address"
                      />
                    </div>
                  </div>

                  {/* Photo Upload */}
                  <div className={`space-y-3 border rounded-lg p-4 ${theme.border} ${theme.bgSubtle}`}>
                    <Label className={theme.textSecondary}>Profile Photo</Label>
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
                          {initialData && initialData.photoUrl
                            ? "Upload new photo to replace existing one"
                            : "Upload a profile photo (optional)"}
                        </p>
                        <p className={`text-xs ${theme.textMuted}`}>
                          Supported formats: JPG, PNG, WebP. Max size: 5MB
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Password Fields (only for new teacher) */}
                  {!initialData && (
                    <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 border-t ${theme.border} pt-4`}>
                      <div className="space-y-2">
                        <Label className={theme.textSecondary}>Password *</Label>
                        <Input
                          type="password"
                          {...register("password", { required: "Password is required" })}
                          className={`${inputClass} ${errors.password ? "border-red-500" : ""}`}
                          placeholder="Enter password"
                        />
                        {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label className={theme.textSecondary}>Confirm Password *</Label>
                        <Input
                          type="password"
                          {...register("confirmPassword", { required: "Confirm your password" })}
                          className={`${inputClass} ${errors.confirmPassword ? "border-red-500" : ""}`}
                          placeholder="Confirm password"
                        />
                        {errors.confirmPassword && <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>}
                      </div>
                    </div>
                  )}
                </TabsContent>

                {/* Tab 2: Professional Information */}
                <TabsContent value="professional" className="space-y-4 mt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className={theme.textSecondary}>Designation *</Label>
                      <Input
                        {...register("designation", { required: "Designation is required" })}
                        className={`${inputClass} ${errors.designation ? "border-red-500" : ""}`}
                        placeholder="e.g., Senior Teacher, Head of Department"
                      />
                      {errors.designation && <p className="text-sm text-red-500">{errors.designation.message}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label className={theme.textSecondary}>Joining Date *</Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          type="date"
                          {...register("joiningDate", { required: "Joining date is required" })}
                          className={`${inputClass} pl-10 ${errors.joiningDate ? "border-red-500" : ""}`}
                        />
                      </div>
                      {errors.joiningDate && <p className="text-sm text-red-500">{errors.joiningDate.message}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label className={theme.textSecondary}>National ID Number</Label>
                      <Input
                        {...register("nationalIdNo")}
                        className={inputClass}
                        placeholder="National ID number"
                      />
                    </div>
                  </div>
                </TabsContent>

                {/* Tab 3: Qualification */}
                <TabsContent value="qualification" className="space-y-4 mt-0">
                  <div className={`flex items-center gap-3 mb-4 p-3 rounded-lg ${theme.bgSubtle} ${theme.border}`}>
                    <GraduationCap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <p className={`text-sm ${theme.textSecondary}`}>
                      Last or highest qualification information
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className={theme.textSecondary}>Qualification Name</Label>
                      <Input
                        {...register("lastQualification.name")}
                        className={inputClass}
                        placeholder="e.g., Master of Science, Bachelor of Arts"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className={theme.textSecondary}>Major/Subject</Label>
                      <Input
                        {...register("lastQualification.major")}
                        className={inputClass}
                        placeholder="e.g., Computer Science, Mathematics"
                      />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <Label className={theme.textSecondary}>Institute/University</Label>
                      <Input
                        {...register("lastQualification.institute")}
                        className={inputClass}
                        placeholder="e.g., University of Oxford, Harvard University"
                      />
                    </div>
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
              onClick={() =>
                setActiveTab(
                  activeTab === "basic"
                    ? "qualification"
                    : activeTab === "professional"
                    ? "basic"
                    : "professional"
                )
              }
              className={`${theme.border} ${theme.textSecondary} ${theme.bgHover}`}
            >
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setActiveTab(
                  activeTab === "basic"
                    ? "professional"
                    : activeTab === "professional"
                    ? "qualification"
                    : "basic"
                )
              }
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
              form="teacherForm"
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isLoading ? "Saving..." : initialData ? "Update Teacher" : "Create Teacher"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}