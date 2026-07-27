// components/subject/SubjectForm.jsx
import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm, Controller } from "react-hook-form";
import { useCreateSubjectMutation, useUpdateSubjectMutation } from "@/features/apis/subjectsApi";
import { toast } from "react-toastify";
import { Check, X, AlertCircle, BookOpen, GraduationCap } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function SubjectForm({ open, onOpenChange, initialData, classes = [] }) {
  const [createSubject, { isLoading: creating }] = useCreateSubjectMutation();
  const [updateSubject, { isLoading: updating }] = useUpdateSubjectMutation();

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
      code: "", 
      description: "", 
      classes: [],
    }
  });

  // Watch form values
  const watchedName = watch("name");
  const watchedCode = watch("code");
  const selectedClasses = watch("classes") || [];

  useEffect(() => {
    if (open) {
      if (initialData) {
        // Format data for editing
        const editData = {
          name: initialData.name || "",
          code: initialData.code || "",
          description: initialData.description || "",
          classes: initialData.classes?.map(c => c._id) || [],
        };
        reset(editData);
      } else {
        reset({
          name: "",
          code: "",
          description: "",
          classes: [],
        });
      }
    }
  }, [open, initialData, reset]);

  const onSubmit = async (data) => {
    try {
      // Ensure classes is an array
      const formData = {
        ...data,
        classes: Array.isArray(data.classes) ? data.classes : []
      };

      if (initialData) {
        await updateSubject({ id: initialData._id, ...formData }).unwrap();
        toast.success("Subject updated successfully");
      } else {
        await createSubject(formData).unwrap();
        toast.success("Subject created successfully");
      }
      onOpenChange(false);
    } catch (err) {
      toast.error(err?.data?.message || "Error saving subject");
    }
  };

  const isLoading = creating || updating;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            {initialData ? (
              `Edit Subject: ${initialData.name}`
            ) : (
              "Create New Subject"
            )}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Subject Name and Code Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Subject Name */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Subject Name *
                {watchedName && !errors.name && (
                  <span className="ml-2 text-xs text-green-600">
                    <Check className="w-3 h-3 inline" /> Valid
                  </span>
                )}
              </Label>
              <Input
                id="name"
                {...register("name", { 
                  required: "Subject name is required",
                  minLength: { value: 2, message: "Subject name is too short" },
                  maxLength: { value: 50, message: "Subject name is too long" }
                })}
                placeholder="e.g., Mathematics, Physics, English"
                className={errors.name ? "border-red-500" : ""}
                disabled={isLoading}
              />
              {errors.name ? (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.name.message}
                </p>
              ) : (
                <p className="text-xs text-gray-500 mt-1">Enter the full subject name</p>
              )}
            </div>

            {/* Subject Code */}
            <div className="space-y-2">
              <Label htmlFor="code">
                Subject Code
                {watchedCode && !errors.code && (
                  <span className="ml-2 text-xs text-green-600">
                    <Check className="w-3 h-3 inline" /> Valid
                  </span>
                )}
              </Label>
              <Input
                id="code"
                {...register("code", { 
                  maxLength: { value: 10, message: "Code is too long" },
                  pattern: {
                    value: /^[A-Z0-9-]+$/,
                    message: "Only uppercase letters, numbers, and hyphens allowed"
                  }
                })}
                placeholder="e.g., MATH101, ENG-10"
                className={errors.code ? "border-red-500" : ""}
                disabled={isLoading}
                onInput={(e) => {
                  e.target.value = e.target.value.toUpperCase();
                }}
              />
              {errors.code ? (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.code.message}
                </p>
              ) : (
                <p className="text-xs text-gray-500 mt-1">Optional unique code (uppercase)</p>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register("description", {
                maxLength: { value: 500, message: "Description is too long" }
              })}
              placeholder="Enter subject description, syllabus details, or any notes..."
              rows={3}
              className={errors.description ? "border-red-500" : ""}
              disabled={isLoading}
            />
            {errors.description ? (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.description.message}
              </p>
            ) : (
              <p className="text-xs text-gray-500 mt-1">
                Optional description (max 500 characters)
              </p>
            )}
          </div>

          {/* Classes Assignment */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="classes">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4" />
                  Assign to Classes
                  {selectedClasses.length > 0 && (
                    <span className="ml-2 text-xs text-gray-500">
                      ({selectedClasses.length} selected)
                    </span>
                  )}
                </div>
              </Label>
              {selectedClasses.length > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setValue("classes", [])}
                  className="text-xs h-7"
                  disabled={isLoading}
                >
                  <X className="w-3 h-3 mr-1" />
                  Clear All
                </Button>
              )}
            </div>

            {/* Class Selector */}
            <div className="space-y-2">
              <Select
                value=""
                onValueChange={(value) => {
                  if (!selectedClasses.includes(value)) {
                    setValue("classes", [...selectedClasses, value]);
                  }
                }}
                disabled={isLoading || classes.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder={
                    classes.length === 0 
                      ? "No classes available" 
                      : "Add classes for this subject"
                  } />
                </SelectTrigger>
                {classes.length > 0 && (
                  <SelectContent>
                    {classes
                      .filter(cls => cls.isActive !== false)
                      .map((cls) => (
                        <SelectItem 
                          key={cls._id} 
                          value={cls._id}
                          disabled={selectedClasses.includes(cls._id)}
                          className={selectedClasses.includes(cls._id) ? "opacity-50" : ""}
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <span>{cls.name}</span>
                              {cls.section?.name && (
                                <span className="text-xs text-gray-500 ml-2">
                                  (Section: {cls.section.name})
                                </span>
                              )}
                            </div>
                            {selectedClasses.includes(cls._id) && (
                              <Check className="w-4 h-4 text-green-600" />
                            )}
                          </div>
                        </SelectItem>
                      ))
                    }
                  </SelectContent>
                )}
              </Select>
              
              {/* Selected Classes Display */}
              {selectedClasses.length > 0 ? (
                <div className="pt-2">
                  <div className="flex flex-wrap gap-2 p-3 border rounded-md bg-gray-50 min-h-[60px] max-h-[150px] overflow-y-auto">
                    {selectedClasses.map((classId) => {
                      const cls = classes.find(c => c._id === classId);
                      if (!cls) return null;
                      
                      return (
                        <div
                          key={classId}
                          className="flex items-center gap-1 bg-white border border-gray-200 px-3 py-2 rounded-lg shadow-sm"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{cls.name}</p>
                            {cls.section?.name && (
                              <p className="text-xs text-gray-500">Section: {cls.section.name}</p>
                            )}
                            {cls.academicYear && (
                              <p className="text-xs text-gray-500">Year: {cls.academicYear}</p>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = selectedClasses.filter(id => id !== classId);
                              setValue("classes", updated);
                            }}
                            className="ml-2 text-gray-400 hover:text-red-600 transition-colors"
                            disabled={isLoading}
                            aria-label={`Remove ${cls.name}`}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    This subject will be available in the selected classes
                  </p>
                </div>
              ) : (
                <div className="border rounded-md p-4 text-center text-gray-500 bg-gray-50">
                  <GraduationCap className="w-6 h-6 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Not assigned to any classes yet</p>
                  <p className="text-xs mt-1">
                    {classes.length === 0 
                      ? "Create classes first to assign subjects" 
                      : "Add classes using the dropdown above"}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Validation Alert */}
          {(errors.name || errors.code || errors.description) && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Please fix the errors above before submitting
              </AlertDescription>
            </Alert>
          )}

          <DialogFooter className="pt-4 border-t">
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
              disabled={isLoading || Object.keys(errors).length > 0}
              className="min-w-[120px]"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {initialData ? "Updating..." : "Creating..."}
                </>
              ) : initialData ? (
                "Update Subject"
              ) : (
                "Create Subject"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// // components/subjects/SubjectForm.jsx
// import React, { useEffect } from "react";
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Textarea } from "@/components/ui/textarea";
// import { useForm } from "react-hook-form";
// import { useCreateSubjectMutation, useUpdateSubjectMutation } from "@/features/apis/subjectsApi";
// import { toast } from "react-toastify";

// export default function SubjectForm({ 
//   open, 
//   onOpenChange, 
//   initialData 
// }) {
//   const [createSubject, { isLoading: creating }] = useCreateSubjectMutation();
//   const [updateSubject, { isLoading: updating }] = useUpdateSubjectMutation();

//   const { register, handleSubmit, reset, formState: { errors } } = useForm({
//     defaultValues: {
//       name: "",
//       code: "",
//       description: ""
//     }
//   });

//   useEffect(() => {
//     if (open) {
//       if (initialData) {
//         // Edit mode
//         reset({
//           name: initialData.name || "",
//           code: initialData.code || "",
//           description: initialData.description || ""
//         });
//       } else {
//         // Create mode
//         reset({
//           name: "",
//           code: "",
//           description: ""
//         });
//       }
//     }
//   }, [open, initialData, reset]);

//   const onSubmit = async (data) => {
//     try {
//       // Clean up empty fields
//       const submitData = {
//         name: data.name.trim(),
//         code: data.code?.trim() || undefined,
//         description: data.description?.trim() || undefined
//       };

//       if (initialData) {
//         await updateSubject({ id: initialData._id, ...submitData }).unwrap();
//       } else {
//         await createSubject(submitData).unwrap();
//       }
//       onOpenChange(false);
//     } catch (err) {
//       console.error("Error saving subject:", err);
//       toast.error(err?.data?.message || "Error saving subject");
//     }
//   };

//   const isLoading = creating || updating;

//   return (
//     <Dialog open={open} onOpenChange={onOpenChange}>
//       <DialogContent className="sm:max-w-[500px]">
//         <DialogHeader>
//           <DialogTitle>
//             {initialData ? "Edit Subject" : "Create New Subject"}
//           </DialogTitle>
//         </DialogHeader>

//         <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
//           {/* Subject Name */}
//           <div className="space-y-2">
//             <Label htmlFor="name">Subject Name *</Label>
//             <Input
//               id="name"
//               {...register("name", { 
//                 required: "Subject name is required",
//                 minLength: {
//                   value: 2,
//                   message: "Subject name must be at least 2 characters"
//                 }
//               })}
//               placeholder="e.g., Mathematics, Physics, English"
//               className={errors.name ? "border-red-500" : ""}
//             />
//             {errors.name && (
//               <p className="text-sm text-red-500">{errors.name.message}</p>
//             )}
//           </div>

//           {/* Subject Code */}
//           <div className="space-y-2">
//             <Label htmlFor="code">Subject Code</Label>
//             <Input
//               id="code"
//               {...register("code", {
//                 pattern: {
//                   value: /^[A-Z0-9]+$/,
//                   message: "Subject code should contain only uppercase letters and numbers"
//                 }
//               })}
//               placeholder="e.g., MATH101, PHY201"
//               className={errors.code ? "border-red-500" : ""}
//               style={{ textTransform: 'uppercase' }}
//             />
//             {errors.code && (
//               <p className="text-sm text-red-500">{errors.code.message}</p>
//             )}
//             <p className="text-xs text-gray-500">
//               Optional. Use uppercase letters and numbers only.
//             </p>
//           </div>

//           {/* Description */}
//           <div className="space-y-2">
//             <Label htmlFor="description">Description</Label>
//             <Textarea
//               id="description"
//               {...register("description")}
//               placeholder="Brief description of the subject (optional)"
//               rows={3}
//             />
//             <p className="text-xs text-gray-500">
//               Optional. Provide a brief description of the subject.
//             </p>
//           </div>

//           <DialogFooter>
//             <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
//               Cancel
//             </Button>
//             <Button type="submit" disabled={isLoading}>
//               {isLoading ? "Saving..." : initialData ? "Update Subject" : "Create Subject"}
//             </Button>
//           </DialogFooter>
//         </form>
//       </DialogContent>
//     </Dialog>
//   );
// }