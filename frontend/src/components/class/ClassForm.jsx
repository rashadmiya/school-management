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
import { Check, X, AlertCircle, BookOpen } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAppSelector } from "@/features/store";

export default function ClassForm({ open, onOpenChange, initialData, teachers = [], subjects = [], sections = [] }) {
  const isDarkMode = useAppSelector((state) => state.global.isDarkMode);
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

  // Theme-based classes
  const theme = {
    dialog: isDarkMode ? "bg-gray-900 border-gray-800 text-white" : "bg-white border-gray-200 text-gray-900",
    label: isDarkMode ? "text-gray-300" : "text-gray-700",
    input: isDarkMode 
      ? "bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:ring-blue-500" 
      : "bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:ring-blue-500",
    selectTrigger: isDarkMode 
      ? "bg-gray-800 border-gray-700 text-white" 
      : "bg-white border-gray-300 text-gray-900",
    selectContent: isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200",
    selectItem: isDarkMode ? "text-gray-300 hover:bg-gray-700" : "text-gray-900 hover:bg-gray-100",
    alert: isDarkMode 
      ? "bg-red-900/20 border-red-800 text-red-400" 
      : "bg-red-50 border-red-200 text-red-800",
    button: {
      primary: isDarkMode 
        ? "bg-blue-600 hover:bg-blue-700 text-white disabled:bg-blue-800/50 disabled:text-gray-400" 
        : "bg-blue-600 hover:bg-blue-700 text-white disabled:bg-blue-300",
      outline: isDarkMode 
        ? "border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white" 
        : "border-gray-300 text-gray-700 hover:bg-gray-50",
    },
    subjectTag: isDarkMode 
      ? "bg-gray-800 border-gray-700" 
      : "bg-white border-gray-200",
    subjectTagText: isDarkMode ? "text-white" : "text-gray-900",
    subjectTagSub: isDarkMode ? "text-gray-400" : "text-gray-500",
    emptyState: isDarkMode ? "border-gray-700 bg-gray-800/50 text-gray-400" : "border-gray-200 bg-gray-50 text-gray-500",
    helperText: isDarkMode ? "text-gray-400" : "text-gray-500",
    errorText: "text-red-500",
    divider: isDarkMode ? "border-gray-700" : "border-gray-200",
  };

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
    return false;
  };

  // Filter available sections based on class name and academic year
  useEffect(() => {
    if (initialData) {
      setAvailableSections(sections);
    } else {
      setAvailableSections(sections);
    }
  }, [initialData, sections, watchedName, watchedAcademicYear]);

  useEffect(() => {
    if (open) {
      if (initialData) {
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
      <DialogContent className={`sm:max-w-[700px] max-h-[90vh] overflow-y-auto ${theme.dialog}`}>
        <DialogHeader>
          <DialogTitle className={`flex items-center gap-2 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
            {initialData ? (
              <>
                <span>Edit Class: {initialData.name}</span>
                {initialData.section?.name && (
                  <span className={`text-sm font-normal ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
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
              <Label htmlFor="name" className={theme.label}>
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
                className={`${theme.input} ${errors.name ? "border-red-500" : ""}`}
                disabled={isLoading}
              />
              {errors.name ? (
                <p className={`text-xs ${theme.errorText} mt-1 flex items-center gap-1`}>
                  <AlertCircle className="w-3 h-3" />
                  {errors.name.message}
                </p>
              ) : (
                <p className={`text-xs ${theme.helperText} mt-1`}>Enter class name (e.g., 10, 11A, KG)</p>
              )}
            </div>

            {/* Section */}
            <div className="space-y-2">
              <Label htmlFor="section" className={theme.label}>
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
                    <SelectTrigger className={`${theme.selectTrigger} ${errors.section ? "border-red-500" : ""}`}>
                      <SelectValue placeholder="Select section" />
                    </SelectTrigger>
                    <SelectContent className={theme.selectContent}>
                      {availableSections.map((section) => (
                        <SelectItem key={section._id} value={section._id} className={theme.selectItem}>
                          <div className="flex flex-col">
                            <span>{section.name}</span>
                            <span className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
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
                <p className={`text-xs ${theme.errorText} mt-1 flex items-center gap-1`}>
                  <AlertCircle className="w-3 h-3" />
                  {errors.section.message}
                </p>
              ) : (
                <p className={`text-xs ${theme.helperText} mt-1`}>
                  Select a section for this class
                </p>
              )}
            </div>
          </div>

          {/* Academic Year and Supervisor Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Academic Year */}
            <div className="space-y-2">
              <Label htmlFor="academicYear" className={theme.label}>
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
                className={`${theme.input} ${errors.academicYear ? "border-red-500" : ""}`}
                disabled={isLoading}
              />
              {errors.academicYear ? (
                <p className={`text-xs ${theme.errorText} mt-1 flex items-center gap-1`}>
                  <AlertCircle className="w-3 h-3" />
                  {errors.academicYear.message}
                </p>
              ) : (
                <p className={`text-xs ${theme.helperText} mt-1`}>
                  Format: YYYY-YYYY (e.g., 2024-2025)
                </p>
              )}
            </div>

            {/* Supervisor */}
            <div className="space-y-2">
              <Label htmlFor="supervisor" className={theme.label}>Class Supervisor</Label>
              <Controller
                name="supervisor"
                control={control}
                render={({ field }) => (
                  <Select 
                    value={field.value || "none"} 
                    onValueChange={(value) => field.onChange(value === "none" ? "" : value)}
                    disabled={isLoading}
                  >
                    <SelectTrigger className={theme.selectTrigger}>
                      <SelectValue placeholder="Select supervisor (optional)" />
                    </SelectTrigger>
                    <SelectContent className={theme.selectContent}>
                      <SelectItem value="none" className={theme.selectItem}>
                        <span className={isDarkMode ? "text-gray-400" : "text-gray-500"}>No Supervisor</span>
                      </SelectItem>
                      {teachers
                        .filter(teacher => teacher.isActive !== false)
                        .map((teacher) => (
                          <SelectItem key={teacher._id} value={teacher._id} className={theme.selectItem}>
                            <div className="flex flex-col">
                              <span>{teacher.user?.name || teacher.name}</span>
                              <span className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
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
              <p className={`text-xs ${theme.helperText} mt-1`}>
                Assign a teacher as class supervisor (optional)
              </p>
            </div>
          </div>

          {/* ===== SUBJECTS SECTION COMMENTED OUT =====
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className={theme.label}>
                Subjects
                {selectedSubjects.length > 0 && (
                  <span className={`ml-2 text-xs ${theme.helperText}`}>
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
                  className={`text-xs h-7 ${isDarkMode ? "text-gray-400 hover:text-white hover:bg-gray-800" : ""}`}
                  disabled={isLoading}
                >
                  <X className="w-3 h-3 mr-1" />
                  Clear All
                </Button>
              )}
            </div>

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
                <SelectTrigger className={theme.selectTrigger}>
                  <SelectValue placeholder="Add subjects to this class" />
                </SelectTrigger>
                <SelectContent className={theme.selectContent}>
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
                        className={theme.selectItem}
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

              {selectedSubjects.length > 0 ? (
                <div className="pt-2">
                  <div className={`flex flex-wrap gap-2 p-3 border rounded-md min-h-[60px] max-h-[150px] overflow-y-auto ${theme.emptyState}`}>
                    {selectedSubjects.map((subjectId) => {
                      const subject = subjects.find(s => s._id === subjectId);
                      if (!subject) return null;
                      return (
                        <div
                          key={subjectId}
                          className={`flex items-center gap-1 border px-3 py-2 rounded-lg shadow-sm ${theme.subjectTag}`}
                        >
                          <div className="flex-1 min-w-0">
                            <p className={`font-medium text-sm truncate ${theme.subjectTagText}`}>
                              {subject.name}
                            </p>
                            <p className={`text-xs ${theme.subjectTagSub}`}>{subject.code}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = selectedSubjects.filter(id => id !== subjectId);
                              setValue("subjects", updated);
                            }}
                            className={`ml-2 ${isDarkMode ? "text-gray-400 hover:text-red-400" : "text-gray-400 hover:text-red-600"} transition-colors`}
                            disabled={isLoading}
                            aria-label={`Remove ${subject.name}`}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                  <p className={`text-xs ${theme.helperText} mt-2`}>
                    Click on the X icon to remove a subject
                  </p>
                </div>
              ) : (
                <div className={`border rounded-md p-4 text-center ${theme.emptyState}`}>
                  <BookOpen className="w-6 h-6 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No subjects selected yet</p>
                  <p className="text-xs mt-1">Add subjects using the dropdown above</p>
                </div>
              )}
            </div>
          </div>
          ===== END COMMENTED SUBJECTS SECTION ===== */}

          {/* Validation Alert */}
          {(errors.name || errors.section || errors.academicYear) && (
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