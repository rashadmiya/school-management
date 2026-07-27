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

export default function TeacherDialogForm({
  open,
  onOpenChange,
  initialData,
  subjects = [],
  classes = [],
}) {
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
      // Basic Information
      name: "",
      email: "",
      phoneNumber: "",
      password: "",
      confirmPassword: "",
      gender: "",
      dateOfBirth: "",

      // Professional Information
      designation: "",
      joiningDate: "",
      nationalIdNo: "",

      // Qualification
      lastQualification: {
        name: "",
        major: "",
        institute: ""
      },

      // Address & Religion
      address: "",
      religion: "",

      // Assignments
      assignedSubjects: [],
      assignedClasses: [],
    },
  });

  // Load initial data in edit mode
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
            institute: initialData.lastQualification?.institute ?? ""
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

          lastQualification: {
            name: "",
            major: "",
            institute: ""
          },

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
      // For new teacher, validate password
        console.log("updating teacher:", initialData)

      if (!initialData) {
        if (!formData.password) {
          return toast.error("Password is required");
        }
        if (formData.password !== formData.confirmPassword) {
          return toast.error("Passwords do not match");
        }
      }

      // Prepare payload
      const payload = { ...formData };

      // Clean up payload
      delete payload.confirmPassword;

      // Format lastQualification if it exists
      if (payload.lastQualification &&
        (!payload.lastQualification.name ||
          !payload.lastQualification.major ||
          !payload.lastQualification.institute)) {
        // Remove empty qualification
        delete payload.lastQualification;
      }

      // Format arrays
      payload.assignedSubjects = Array.isArray(payload.assignedSubjects)
        ? payload.assignedSubjects
        : [payload.assignedSubjects].filter(Boolean);

      payload.assignedClasses = Array.isArray(payload.assignedClasses)
        ? payload.assignedClasses
        : [payload.assignedClasses].filter(Boolean);

      if (initialData) {
        // Update existing teacher (photo updated separately)
        await updateTeacher({
          id: initialData._id,
          ...payload,
        }).unwrap();

        toast.success("Teacher updated successfully");
      } else {
        // Create new teacher
        if (photo) {
          // Use create-with-photo endpoint
          const formDataWithPhoto = new FormData();

          // Append all fields to form data
          Object.keys(payload).forEach(key => {
            if (key === 'lastQualification') {
              formDataWithPhoto.append(key, JSON.stringify(payload[key]));
            } else if (Array.isArray(payload[key])) {
              formDataWithPhoto.append(key, JSON.stringify(payload[key]));
            } else {
              formDataWithPhoto.append(key, payload[key]);
            }
          });

          formDataWithPhoto.append('photo', photo);

          await createTeacherWithPhoto(formDataWithPhoto).unwrap();
        } else {
          // Use simple create endpoint
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

  const selectedSubjects = watch("assignedSubjects") || [];
  const selectedClasses = watch("assignedClasses") || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-auto flex flex-col p-0">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white px-6 py-4 border-b">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {initialData ? "Edit Teacher" : "Create New Teacher"}
            </DialogTitle>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2">
            <TabsList className="grid grid-cols-4">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="professional">Professional</TabsTrigger>
              <TabsTrigger value="qualification">Qualification</TabsTrigger>
              <TabsTrigger value="assignments">Assignments</TabsTrigger>
            </TabsList>

            {/* Scrollable form body */}
            <div className="overflow-y-auto px-6 py-4 flex-1">
              <form id="teacherForm" onSubmit={handleSubmit(onSubmit)} className="space-y-6">

                {/* Tab 1: Basic Information */}
                <TabsContent value="basic" className="space-y-4 mt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Name */}
                    <div className="space-y-2">
                      <Label>Full Name *</Label>
                      <Input
                        {...register("name", { required: "Name is required" })}
                        className={errors.name ? "border-red-500" : ""}
                        placeholder="Enter full name"
                      />
                      {errors.name && (
                        <p className="text-sm text-red-500">{errors.name.message}</p>
                      )}
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                      <Label>Email *</Label>
                      <Input
                        type="email"
                        {...register("email", {
                          required: "Email is required",
                          pattern: {
                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                            message: "Invalid email address"
                          }
                        })}
                        className={errors.email ? "border-red-500" : ""}
                        placeholder="teacher@school.com"
                      />
                      {errors.email && (
                        <p className="text-sm text-red-500">{errors.email.message}</p>
                      )}
                    </div>

                    {/* Phone Number */}
                    <div className="space-y-2">
                      <Label>Phone Number *</Label>
                      <Input
                        {...register("phoneNumber", { required: "Phone number is required" })}
                        className={errors.phoneNumber ? "border-red-500" : ""}
                        placeholder="+8801234567890"
                      />
                      {errors.phoneNumber && (
                        <p className="text-sm text-red-500">{errors.phoneNumber.message}</p>
                      )}
                    </div>

                    {/* Gender */}
                    <div className="space-y-2">
                      <Label>Gender</Label>
                      <Select
                        value={watch("gender")}
                        onValueChange={(value) => setValue("gender", value)}
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
                      <Label>Date of Birth</Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          type="date"
                          {...register("dateOfBirth")}
                          className="pl-10"
                          max={new Date().toISOString().split('T')[0]}
                        />
                      </div>
                    </div>

                    {/* Religion */}
                    <div className="space-y-2">
                      <Label>Religion</Label>
                      <Input
                        {...register("religion")}
                        placeholder="Religion"
                      />
                    </div>
                  </div>

                  {/* Address */}
                  <div className="space-y-2">
                    <Label>Address</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
                      <Textarea
                        {...register("address")}
                        className="pl-10 min-h-[40px]"
                        placeholder="Enter full address"
                      />
                    </div>
                  </div>

                  {/* Photo Upload */}
                  <div className="space-y-3 border rounded-lg p-4">
                    <Label>Profile Photo</Label>
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
                          {initialData && initialData.photoUrl
                            ? "Upload new photo to replace existing one"
                            : "Upload a profile photo (optional)"}
                        </p>
                        <p className="text-xs text-gray-500">
                          Supported formats: JPG, PNG, WebP. Max size: 5MB
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Password Fields (only for new teacher) */}
                  {!initialData && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
                      <div className="space-y-2">
                        <Label>Password *</Label>
                        <Input
                          type="password"
                          {...register("password", { required: "Password is required" })}
                          className={errors.password ? "border-red-500" : ""}
                          placeholder="Enter password"
                        />
                        {errors.password && (
                          <p className="text-sm text-red-500">{errors.password.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label>Confirm Password *</Label>
                        <Input
                          type="password"
                          {...register("confirmPassword", {
                            required: "Confirm your password",
                          })}
                          className={errors.confirmPassword ? "border-red-500" : ""}
                          placeholder="Confirm password"
                        />
                        {errors.confirmPassword && (
                          <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
                        )}
                      </div>
                    </div>
                  )}
                </TabsContent>

                {/* Tab 2: Professional Information */}
                <TabsContent value="professional" className="space-y-4 mt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Designation */}
                    <div className="space-y-2">
                      <Label>Designation *</Label>
                      <Input
                        {...register("designation", { required: "Designation is required" })}
                        className={errors.designation ? "border-red-500" : ""}
                        placeholder="e.g., Senior Teacher, Head of Department"
                      />
                      {errors.designation && (
                        <p className="text-sm text-red-500">{errors.designation.message}</p>
                      )}
                    </div>

                    {/* Joining Date */}
                    <div className="space-y-2">
                      <Label>Joining Date *</Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          type="date"
                          {...register("joiningDate", { required: "Joining date is required" })}
                          className={errors.joiningDate ? "border-red-500 pl-10" : "pl-10"}
                        />
                      </div>
                      {errors.joiningDate && (
                        <p className="text-sm text-red-500">{errors.joiningDate.message}</p>
                      )}
                    </div>

                    {/* National ID */}
                    <div className="space-y-2">
                      <Label>National ID Number</Label>
                      <Input
                        {...register("nationalIdNo")}
                        placeholder="National ID number"
                      />
                    </div>
                  </div>
                </TabsContent>

                {/* Tab 3: Qualification */}
                <TabsContent value="qualification" className="space-y-4 mt-0">
                  <div className="flex items-center gap-3 mb-4 p-3 bg-blue-50 rounded-lg">
                    <GraduationCap className="w-5 h-5 text-blue-600" />
                    <p className="text-sm text-blue-700">
                      Last or highest qualification information
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Qualification Name */}
                    <div className="space-y-2">
                      <Label>Qualification Name</Label>
                      <Input
                        {...register("lastQualification.name")}
                        placeholder="e.g., Master of Science, Bachelor of Arts"
                      />
                    </div>

                    {/* Major/Subject */}
                    <div className="space-y-2">
                      <Label>Major/Subject</Label>
                      <Input
                        {...register("lastQualification.major")}
                        placeholder="e.g., Computer Science, Mathematics"
                      />
                    </div>

                    {/* Institute */}
                    <div className="md:col-span-2 space-y-2">
                      <Label>Institute/University</Label>
                      <Input
                        {...register("lastQualification.institute")}
                        placeholder="e.g., University of Oxford, Harvard University"
                      />
                    </div>
                  </div>
                </TabsContent>

                {/* Tab 4: Assignments */}
                <TabsContent value="assignments" className="space-y-4 mt-0">
                  {/* Assign Subjects */}
                  <div className="space-y-3">
                    <Label>Assign Subjects</Label>
                    <Select
                      onValueChange={(value) => {
                        const current = watch("assignedSubjects");
                        if (!current.includes(value)) {
                          setValue("assignedSubjects", [...current, value]);
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select subjects to assign" />
                      </SelectTrigger>
                      <SelectContent>
                        {subjects.map((sub) => (
                          <SelectItem key={sub._id} value={sub._id}>
                            {sub.name} ({sub.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* Selected subjects */}
                    {selectedSubjects.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {selectedSubjects.map((id) => {
                          const sub = subjects.find((s) => s._id === id);
                          return (
                            <div
                              key={id}
                              className="flex items-center gap-1 bg-blue-100 text-blue-800 px-3 py-1.5 rounded-md text-sm"
                            >
                              {sub?.name}
                              <button
                                type="button"
                                onClick={() =>
                                  setValue(
                                    "assignedSubjects",
                                    selectedSubjects.filter((x) => x !== id)
                                  )
                                }
                                className="ml-1 text-blue-600 hover:text-blue-800"
                              >
                                ×
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Assign Classes */}
                  <div className="space-y-3">
                    <Label>Assign Classes</Label>
                    <Select
                      onValueChange={(value) => {
                        const current = watch("assignedClasses");
                        if (!current.includes(value)) {
                          setValue("assignedClasses", [...current, value]);
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select classes to assign" />
                      </SelectTrigger>
                      <SelectContent>
                        {classes.map((cls) => (
                          <SelectItem key={cls._id} value={cls._id}>
                            {cls.name} {cls.section ? `- (${cls.section.name})` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* Selected classes */}
                    {selectedClasses.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {selectedClasses.map((id) => {
                          const cls = classes.find((c) => c._id === id);
                          return (
                            <div
                              key={id}
                              className="flex items-center gap-1 bg-green-100 text-green-800 px-3 py-1.5 rounded-md text-sm"
                            >
                              {cls?.name}
                              <button
                                type="button"
                                onClick={() =>
                                  setValue(
                                    "assignedClasses",
                                    selectedClasses.filter((x) => x !== id)
                                  )
                                }
                                className="ml-1 text-green-600 hover:text-green-800"
                              >
                                ×
                              </button>
                            </div>
                          );
                        })}
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
              onClick={() => setActiveTab(activeTab === "basic" ? "assignments" :
                activeTab === "professional" ? "basic" :
                  activeTab === "qualification" ? "professional" : "qualification")}
            >
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setActiveTab(activeTab === "basic" ? "professional" :
                activeTab === "professional" ? "qualification" :
                  activeTab === "qualification" ? "assignments" : "basic")}
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
              form="teacherForm"
              disabled={isLoading}
            >
              {isLoading ? "Saving..." : initialData ? "Update Teacher" : "Create Teacher"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}



// import { Button } from "@/components/ui/button";
// import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
// import { Input } from "@/components/ui/input";
// import { useCreateTeacherMutation } from "@/features/apis/api";
// import { useUpdateTeacherMutation } from "@/features/apis/teachersApi";
// import { teacherSchema } from "@/schemas/teacherSchema";
// import { zodResolver } from "@hookform/resolvers/zod";
// import { useEffect } from "react";
// import { useForm } from "react-hook-form";
// import { toast } from "react-toastify";

// export default function TeacherDialogForm({
//   open,
//   onOpenChange,
//   initialData = null,
//   onSaved
// }) {
//   const {
//     register,
//     handleSubmit,
//     reset,
//     formState: { errors, isDirty }
//   } = useForm({
//     resolver: zodResolver(teacherSchema),
//     defaultValues: initialData || {
//       name: "",
//       email: "",
//       password: "",
//       phone: "",
//       subjectIds: [],
//       classIds: []
//     }
//   });

//   const [createTeacher, { isLoading: creating }] = useCreateTeacherMutation();
//   const [updateTeacher, { isLoading: updating }] = useUpdateTeacherMutation();

//   useEffect(() => {
//     reset(initialData || {
//       name: "",
//       email: "",
//       password: "",
//       phone: "",
//       subjectIds: [],
//       classIds: []
//     });
//   }, [initialData, reset]);

//   const onSubmit = async (data) => {
//     try {
//       // For new teacher, ensure password is provided
//       if (!initialData && !data.password) {
//         toast.warn("Password is required for new teachers");
//         return;
//       }

//       // Prepare the data for API
//       const submitData = {
//         name: data.name,
//         email: data.email,
//         phone: data.phone,
//         subjectIds: data.subjectIds || [],
//         classIds: data.classIds || [],
//         ...(data.password && { password: data.password }) // Only include password if provided
//       };

//       if (initialData) {
//         // For update, only send changed fields
//         const updateData = {};
//         if (data.name !== initialData.name) updateData.name = data.name;
//         if (data.email !== initialData.email) updateData.email = data.email;
//         if (data.phone !== initialData.phone) updateData.phone = data.phone;
//         if (data.password) updateData.password = data.password;

//         await updateTeacher({ id: initialData._id, ...updateData }).unwrap();
//       } else {
//         await createTeacher(submitData).unwrap();
//       }

//       onSaved?.();
//       reset(); // Reset form after successful submission
//     } catch (err) {
//       console.error("Error saving teacher:", err);
//       toast.error(err?.data?.message || "Error saving teacher");
//     }
//   };

//   const isLoading = creating || updating;

//   return (
//     <Dialog open={open} onOpenChange={onOpenChange}>
//       <DialogContent className="sm:max-w-[425px]">
//         <DialogHeader>
//           <DialogTitle>
//             {initialData ? "Edit Teacher" : "Create New Teacher"}
//           </DialogTitle>
//         </DialogHeader>

//         <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
//           {/* Name Field */}
//           <div className="space-y-2">
//             <label htmlFor="name" className="text-sm font-medium">
//               Full Name *
//             </label>
//             <Input
//               id="name"
//               {...register("name")}
//               placeholder="Enter full name"
//               className={errors.name ? "border-red-500" : ""}
//             />
//             {errors.name && (
//               <p className="text-sm text-red-500">{errors.name.message}</p>
//             )}
//           </div>

//           {/* Email Field */}
//           <div className="space-y-2">
//             <label htmlFor="email" className="text-sm font-medium">
//               Email *
//             </label>
//             <Input
//               id="email"
//               type="email"
//               {...register("email")}
//               placeholder="Enter email address"
//               className={errors.email ? "border-red-500" : ""}
//             />
//             {errors.email && (
//               <p className="text-sm text-red-500">{errors.email.message}</p>
//             )}
//           </div>

//           {/* Phone Field */}
//           <div className="space-y-2">
//             <label htmlFor="phone" className="text-sm font-medium">
//               Phone Number
//             </label>
//             <Input
//               id="phone"
//               {...register("phone")}
//               placeholder="Enter phone number"
//             />
//           </div>

//           {/* Password Field - Only show for new teachers or when editing */}
//           {!initialData && (
//             <div className="space-y-2">
//               <label htmlFor="password" className="text-sm font-medium">
//                 Password *
//               </label>
//               <Input
//                 id="password"
//                 type="password"
//                 {...register("password")}
//                 placeholder="Enter password"
//                 className={errors.password ? "border-red-500" : ""}
//               />
//               {errors.password && (
//                 <p className="text-sm text-red-500">{errors.password.message}</p>
//               )}
//               <p className="text-xs text-gray-500">
//                 Password must be at least 6 characters long
//               </p>
//             </div>
//           )}

//           {/* Optional: Password field for existing teachers to change password */}
//           {initialData && (
//             <div className="space-y-2">
//               <label htmlFor="password" className="text-sm font-medium">
//                 New Password (leave blank to keep current)
//               </label>
//               <Input
//                 id="password"
//                 type="password"
//                 {...register("password")}
//                 placeholder="Enter new password"
//               />
//               <p className="text-xs text-gray-500">
//                 Leave blank to keep current password
//               </p>
//             </div>
//           )}

//           <DialogFooter>
//             <Button
//               type="submit"
//               disabled={isLoading || (!initialData && !isDirty)}
//               className="w-full sm:w-auto"
//             >
//               {isLoading ? "Saving..." : initialData ? "Save Changes" : "Create Teacher"}
//             </Button>
//           </DialogFooter>
//         </form>
//       </DialogContent>
//     </Dialog>
//   );
// };