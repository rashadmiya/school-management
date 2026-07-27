// components/class/ClassForm.jsx
import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm, Controller } from "react-hook-form";
import { useCreateClassMutation, useUpdateClassMutation } from "@/features/apis/classesApi";
import { toast } from "react-toastify";
import { Check, X, AlertCircle, BookOpen} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function ClassForm({ open, onOpenChange, initialData, teachers = [], subjects = [], sections = [] }) {
  const [createClass, { isLoading: creating }] = useCreateClassMutation();
  const [updateClass, { isLoading: updating }] = useUpdateClassMutation();
  const [availableSections, setAvailableSections] = useState(sections);

  const { 
    register, 
    handleSubmit, 
    reset, 
    setValue, 
    watch, 
    control,
    formState: { errors },
    trigger
  } = useForm({
    defaultValues: { 
      name: "", 
      supervisor: "", 
      section: "", 
      subjects: [], 
      academicYear: "",
      isActive: true
    }
  });

  // Watch form values
  const watchedName = watch("name");
  const watchedSection = watch("section");
  const watchedAcademicYear = watch("academicYear");
  const selectedSubjects = watch("subjects") || [];

  // Generate current academic year
  const getCurrentAcademicYear = () => {
    const currentYear = new Date().getFullYear();
    return `${currentYear}-${currentYear + 1}`;
  };

  // Validate academic year format
  const validateAcademicYear = (value) => {
    if (!value) return "Academic year is required";
    if (!/^\d{4}-\d{4}$/.test(value)) return "Format must be YYYY-YYYY";
    
    const [start, end] = value.split("-").map(Number);
    if (end !== start + 1) return "End year must be start year + 1";
    if (start < 2000 || start > 2100) return "Invalid year range";
    
    return true;
  };

  // Check for duplicate class
  const checkDuplicateClass = async () => {
    if (!watchedName || !watchedSection || !watchedAcademicYear) return false;
    
    // This would ideally be an API call, but we'll handle it on the backend
    return false;
  };

  // Filter available sections based on class name and academic year
  useEffect(() => {
    if (initialData) {
      // When editing, show all sections
      setAvailableSections(sections);
    } else {
      // When creating, filter sections that don't already have this class name
      // This is a simple client-side check - backend will do proper validation
      setAvailableSections(sections);
    }
  }, [initialData, sections, watchedName, watchedAcademicYear]);

  useEffect(() => {
    if (open) {
      if (initialData) {
        // Format data for editing
        const editData = {
          name: initialData.name || "",
          supervisor: initialData.supervisor ? initialData.supervisor._id : "",
          section: initialData.section ? initialData.section._id : "",
          subjects: initialData.subjects?.map(s => s._id) || [],
          academicYear: initialData.academicYear || getCurrentAcademicYear(),
          isActive: initialData.isActive !== false
        };
        reset(editData);
      } else {
        reset({
          name: "",
          supervisor: "",
          section: "",
          subjects: [],
          academicYear: getCurrentAcademicYear(),
          isActive: true
        });
      }
    }
  }, [open, initialData, reset]);

  const onSubmit = async (data) => {
    try {
      // Ensure subjects is an array (handle undefined case)
      const formData = {
        ...data,
        subjects: Array.isArray(data.subjects) ? data.subjects : []
      };

      if (initialData) {
        await updateClass({ id: initialData._id, ...formData }).unwrap();
        toast.success("Class updated successfully");
      } else {
        await createClass(formData).unwrap();
        toast.success("Class created successfully");
      }
      onOpenChange(false);
    } catch (err) {
      toast.error(err?.data?.message || "Error saving class");
    }
  };

  const isLoading = creating || updating;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {initialData ? (
              <>
                <span>Edit Class: {initialData.name}</span>
                {initialData.section?.name && (
                  <span className="text-sm font-normal text-gray-500">
                    (Section {initialData.section.name})
                  </span>
                )}
              </>
            ) : (
              "Create New Class"
            )}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Class Name and Section Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Class Name */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Class Name *
                {watchedName && (
                  <span className="ml-2 text-xs text-green-600">
                    <Check className="w-3 h-3 inline" /> Valid
                  </span>
                )}
              </Label>
              <Input
                id="name"
                {...register("name", { 
                  required: "Class name is required",
                  minLength: { value: 1, message: "Class name is too short" },
                  maxLength: { value: 20, message: "Class name is too long" }
                })}
                placeholder="e.g., 10, 11, 12, Nursery, KG"
                className={errors.name ? "border-red-500" : ""}
                disabled={isLoading}
              />
              {errors.name ? (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.name.message}
                </p>
              ) : (
                <p className="text-xs text-gray-500 mt-1">Enter class name (e.g., 10, 11A, KG)</p>
              )}
            </div>

            {/* Section */}
            <div className="space-y-2">
              <Label htmlFor="section">
                Section *
                {watchedSection && (
                  <span className="ml-2 text-xs text-green-600">
                    <Check className="w-3 h-3 inline" /> Selected
                  </span>
                )}
              </Label>
              <Controller
                name="section"
                control={control}
                rules={{ required: "Section is required" }}
                render={({ field }) => (
                  <Select 
                    value={field.value} 
                    onValueChange={field.onChange}
                    disabled={isLoading}
                  >
                    <SelectTrigger className={errors.section ? "border-red-500" : ""}>
                      <SelectValue placeholder="Select section" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSections.map((section) => (
                        <SelectItem key={section._id} value={section._id}>
                          <div className="flex flex-col">
                            <span>{section.name}</span>
                            <span className="text-xs text-gray-500">
                              Capacity: {section.currentStrength}/{section.capacity}
                              {section.isActive ? " • Active" : " • Inactive"}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                      {availableSections.length === 0 && (
                        <SelectItem value="none" disabled>
                          No sections available
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.section ? (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.section.message}
                </p>
              ) : (
                <p className="text-xs text-gray-500 mt-1">
                  Select a section for this class
                </p>
              )}
            </div>
          </div>

          {/* Academic Year and Supervisor Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Academic Year */}
            <div className="space-y-2">
              <Label htmlFor="academicYear">
                Academic Year *
                {watchedAcademicYear && !errors.academicYear && (
                  <span className="ml-2 text-xs text-green-600">
                    <Check className="w-3 h-3 inline" /> Valid
                  </span>
                )}
              </Label>
              <Input
                id="academicYear"
                {...register("academicYear", { 
                  required: "Academic year is required",
                  validate: validateAcademicYear
                })}
                placeholder="e.g., 2024-2025"
                className={errors.academicYear ? "border-red-500" : ""}
                disabled={isLoading}
              />
              {errors.academicYear ? (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.academicYear.message}
                </p>
              ) : (
                <p className="text-xs text-gray-500 mt-1">
                  Format: YYYY-YYYY (e.g., 2024-2025)
                </p>
              )}
            </div>

            {/* Supervisor */}
            <div className="space-y-2">
              <Label htmlFor="supervisor">Class Supervisor</Label>
              <Controller
                name="supervisor"
                control={control}
                render={({ field }) => (
                  <Select 
                    value={field.value || "none"} 
                    onValueChange={(value) => field.onChange(value === "none" ? "" : value)}
                    disabled={isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select supervisor (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">
                        <span className="text-gray-500">No Supervisor</span>
                      </SelectItem>
                      {teachers
                        .filter(teacher => teacher.isActive !== false)
                        .map((teacher) => (
                          <SelectItem key={teacher._id} value={teacher._id}>
                            <div className="flex flex-col">
                              <span>{teacher.user?.name || teacher.name}</span>
                              <span className="text-xs text-gray-500">
                                {teacher.designation || "Teacher"}
                                {teacher.user?.email ? ` • ${teacher.user.email}` : ''}
                              </span>
                            </div>
                          </SelectItem>
                        ))
                      }
                    </SelectContent>
                  </Select>
                )}
              />
              <p className="text-xs text-gray-500 mt-1">
                Assign a teacher as class supervisor (optional)
              </p>
            </div>
          </div>

          {/* Subjects Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="subjects">
                Subjects
                {selectedSubjects.length > 0 && (
                  <span className="ml-2 text-xs text-gray-500">
                    ({selectedSubjects.length} selected)
                  </span>
                )}
              </Label>
              {selectedSubjects.length > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setValue("subjects", [])}
                  className="text-xs h-7"
                  disabled={isLoading}
                >
                  <X className="w-3 h-3 mr-1" />
                  Clear All
                </Button>
              )}
            </div>

            {/* Subject Selector */}
            <div className="space-y-2">
              <Select
                value="__select__"
                onValueChange={(value) => {
                   if (value === "__select__") return;
                  if (!selectedSubjects.includes(value)) {
                    setValue("subjects", [...selectedSubjects, value]);
                  }
                }}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Add subjects to this class" />
                </SelectTrigger>
              <SelectContent>
                <SelectItem value="__select__" disabled>
                  Select a subject
                </SelectItem>

                {subjects
                  .filter(subject => subject.isActive !== false)
                  .map(subject => (
                    <SelectItem
                      key={subject._id}
                      value={subject._id}
                      disabled={selectedSubjects.includes(subject._id)}
                    >
                      <div className="flex justify-between items-center">
                        <span>{subject.name} ({subject.code})</span>
                        {selectedSubjects.includes(subject._id) && (
                          <Check className="w-4 h-4 text-green-600" />
                        )}
                      </div>
                    </SelectItem>
                  ))}
              </SelectContent>

              </Select>
              
              {/* Selected Subjects Display */}
              {selectedSubjects.length > 0 ? (
                <div className="pt-2">
                  <div className="flex flex-wrap gap-2 p-3 border rounded-md bg-gray-50 min-h-[60px] max-h-[150px] overflow-y-auto">
                    {selectedSubjects.map((subjectId) => {
                      const subject = subjects.find(s => s._id === subjectId);
                      if (!subject) return null;
                      
                      return (
                        <div
                          key={subjectId}
                          className="flex items-center gap-1 bg-white border border-gray-200 px-3 py-2 rounded-lg shadow-sm"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{subject.name}</p>
                            <p className="text-xs text-gray-500">{subject.code}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = selectedSubjects.filter(id => id !== subjectId);
                              setValue("subjects", updated);
                            }}
                            className="ml-2 text-gray-400 hover:text-red-600 transition-colors"
                            disabled={isLoading}
                            aria-label={`Remove ${subject.name}`}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Click on the X icon to remove a subject
                  </p>
                </div>
              ) : (
                <div className="border rounded-md p-4 text-center text-gray-500 bg-gray-50">
                  <BookOpen className="w-6 h-6 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No subjects selected yet</p>
                  <p className="text-xs mt-1">Add subjects using the dropdown above</p>
                </div>
              )}
            </div>
          </div>

          {/* Validation Alert */}
          {(errors.name || errors.section || errors.academicYear) && (
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
                "Update Class"
              ) : (
                "Create Class"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// // components/classes/ClassForm.jsx (Updated to handle subjects overflow)
// import React, { useEffect } from "react";
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { useForm } from "react-hook-form";
// import { useCreateClassMutation, useUpdateClassMutation } from "@/features/apis/classesApi";
// import { toast } from "react-toastify";

// export default function ClassForm({ open, onOpenChange, initialData, teachers = [], subjects = [], sections = [] }) {
//   const [createClass, { isLoading: creating }] = useCreateClassMutation();
//   const [updateClass, { isLoading: updating }] = useUpdateClassMutation();

//   const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
//     defaultValues: { name: "", supervisor: "", section: "", subjects: [], academicYear: "" }
//   });

//   useEffect(() => {
//     if (open) {
//       if (initialData) {
//         reset({
//           name: initialData.name ?? "",
//           supervisor: initialData.supervisor ? initialData.supervisor._id : "",
//           section: initialData.section ? initialData.section._id : "",
//           subjects: initialData.subjects?.map(s => s._id) ?? [],
//           academicYear: initialData.academicYear || ""
//         });
//       } else {
//         const currentYear = new Date().getFullYear();
//         reset({
//           name: "",
//           supervisor: "",
//           section: "",
//           subjects: [],
//           academicYear: `${currentYear}-${currentYear + 1}`
//         });
//       }
//     }
//   }, [open, initialData, reset]);

//   const onSubmit = async (data) => {
//     try {
//       if (initialData) {
//         await updateClass({ id: initialData._id, ...data }).unwrap();
//       } else {
//         await createClass(data).unwrap();
//       }
//       onOpenChange(false);
//     } catch (err) {
//       toast.error(err?.data?.message || "Error saving class");
//     }
//   };

//   const isLoading = creating || updating;
//   const selectedSubjects = watch("subjects") || [];

//   return (
//     <Dialog open={open} onOpenChange={onOpenChange}>
//       <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto"> {/* Added max-height and overflow-y-auto to the main content */}
//         <DialogHeader>
//           <DialogTitle>{initialData ? "Edit Class" : "Create New Class"}</DialogTitle>
//         </DialogHeader>
//         <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          
//           {/* Grid Layout for Primary Fields */}
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

//             {/* Class Name */}
//             <div className="space-y-2">
//               <Label htmlFor="name">Class Name *</Label>
//               <Input id="name" {...register("name", { required: "Class name is required" })} placeholder="e.g., 10, 11, 12" className={errors.name ? "border-red-500" : ""} />
//               {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
//             </div>

//             {/* Section */}
//             <div className="space-y-2">
//               <Label htmlFor="section">Section *</Label>
//               <Select onValueChange={(value) => setValue("section", value)} value={watch("section")}>
//                 <SelectTrigger className={errors.section ? "border-red-500" : ""}><SelectValue placeholder="Select section" /></SelectTrigger>
//                 <SelectContent>{sections.map((section) => (<SelectItem key={section._id} value={section._id}>{section.name}</SelectItem>))}</SelectContent>
//               </Select>
//               {errors.section && <p className="text-xs text-red-500 mt-1">Section is required</p>}
//             </div>

//             {/* Academic Year */}
//             <div className="space-y-2">
//               <Label htmlFor="academicYear">Academic Year *</Label>
//               <Input id="academicYear" {...register("academicYear", { required: "Academic year is required", pattern: { value: /^\d{4}-\d{4}$/, message: "Format must be YYYY-YYYY" } })} placeholder="e.g., 2024-2025" className={errors.academicYear ? "border-red-500" : ""} />
//               {errors.academicYear && <p className="text-xs text-red-500 mt-1">{errors.academicYear.message}</p>}
//             </div>
//           </div>
//           {/* End Grid Layout */}

//           {/* Supervisor */}
//           <div className="space-y-2">
//             <Label htmlFor="supervisor">Class Supervisor</Label>
//             <Select onValueChange={(value) => setValue("supervisor", value === "none" ? "" : value)} value={watch("supervisor") || "none"}>
//               <SelectTrigger><SelectValue placeholder="Select supervisor (optional)" /></SelectTrigger>
//               <SelectContent>
//                 <SelectItem value="none">No Supervisor</SelectItem>
//                 {teachers.map((teacher) => (<SelectItem key={teacher._id} value={teacher._id}>{teacher.user?.name}</SelectItem>))}
//               </SelectContent>
//             </Select>
//           </div>

//           {/* Subjects (Kept as full width) */}
//           <div className="space-y-2">
//             <Label htmlFor="subjects">Subjects</Label>
//             {/* The Select component for adding subjects */}
//             <Select onValueChange={(value) => { 
//                 const currentSubjects = watch("subjects") || []; 
//                 if (!currentSubjects.includes(value)) { 
//                     setValue("subjects", [...currentSubjects, value]); 
//                 } 
//             }} value=""> 
//               <SelectTrigger><SelectValue placeholder="Add subjects to class" /></SelectTrigger>
//               <SelectContent>
//                 {subjects.map((subject) => (
//                   <SelectItem key={subject._id} value={subject._id} disabled={selectedSubjects.includes(subject._id)}>
//                     {subject.name} ({subject.code})
//                   </SelectItem>
//                 ))}
//               </SelectContent>
//             </Select>
            
//             {/* Selected Subjects Display (Container with fixed height and scroll) */}
//             {selectedSubjects.length > 0 && (
//               <div className="pt-2">
//                 <Label className="block mb-2 text-sm font-medium">Selected Subjects:</Label>
//                 <div className="flex flex-wrap gap-2 p-2 border rounded-md bg-gray-50 min-h-10 max-h-[150px] overflow-y-auto"> 
//                 {/* ^^^ KEY CHANGE: Added max-h-[150px] and overflow-y-auto ^^^ */}
//                   {selectedSubjects.map((subjectId) => {
//                     const subject = subjects.find(s => s._id === subjectId);
//                     // Use a badge or tag style
//                     return (
//                       <div key={subjectId} className="flex items-center gap-1 bg-blue-50 text-blue-800 border border-blue-200 px-3 py-1 rounded-full text-sm font-medium">
//                         {subject?.name || "Unknown Subject"}
//                         <button 
//                           type="button" 
//                           onClick={() => { 
//                             const updated = selectedSubjects.filter(id => id !== subjectId); 
//                             setValue("subjects", updated); 
//                           }} 
//                           className="text-blue-600 hover:text-blue-900 ml-1 leading-none"
//                           aria-label={`Remove ${subject?.name}`}
//                         >
//                           <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
//                             <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
//                           </svg>
//                         </button>
//                       </div>
//                     );
//                   })}
//                 </div>
//               </div>
//             )}
//           </div>
          
//           <DialogFooter className="pt-4">
//             <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>Cancel</Button>
//             <Button type="submit" disabled={isLoading}>{isLoading ? "Saving..." : initialData ? "Update Class" : "Create Class"}</Button>
//           </DialogFooter>
//         </form>
//       </DialogContent>
//     </Dialog>
//   );
// }