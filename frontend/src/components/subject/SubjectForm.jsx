// components/subject/SubjectForm.jsx
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCreateSubjectMutation, useUpdateSubjectMutation } from "@/features/apis/subjectsApi";
import { useAppSelector } from "@/features/store";
import { AlertCircle, BookOpen, Check, GraduationCap, X } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
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
    select: {
      trigger: isDarkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-300 text-gray-900",
      content: isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white",
      item: isDarkMode ? "text-gray-300 hover:bg-gray-700" : "text-gray-900 hover:bg-gray-100",
    },
    button: {
      primary: isDarkMode ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-blue-600 hover:bg-blue-700 text-white",
      outline: isDarkMode ? "border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white" : "border-gray-300 text-gray-700 hover:bg-gray-50",
      ghost: isDarkMode ? "text-gray-400 hover:text-white hover:bg-gray-800" : "text-gray-500 hover:text-gray-700 hover:bg-gray-100",
    },
    divider: isDarkMode ? "border-gray-700" : "border-gray-200",
    alert: isDarkMode ? "bg-red-900/20 border-red-800 text-red-400" : "bg-red-50 border-red-200 text-red-800",
    selectedTag: isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200",
    selectedTagText: isDarkMode ? "text-white" : "text-gray-900",
    selectedTagSub: isDarkMode ? "text-gray-400" : "text-gray-500",
    emptyState: isDarkMode ? "border-gray-700 bg-gray-800/50 text-gray-400" : "border-gray-200 bg-gray-50 text-gray-500",
    emptyIcon: isDarkMode ? "text-gray-600" : "text-gray-300",
  };
};

export default function SubjectForm({ open, onOpenChange, initialData, classes = [] }) {
  const theme = useTheme();
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

  // Input base class
  const inputClass = `${theme.bgInput} ${theme.borderInput} ${theme.focusRing} text-gray-900 dark:text-white ${theme.placeholder}`;

  useEffect(() => {
    if (open) {
      if (initialData) {
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
      <DialogContent className={`sm:max-w-[600px] max-h-[90vh] overflow-y-auto ${theme.dialog}`}>
        <DialogHeader>
          <DialogTitle className={`flex items-center gap-2 ${theme.text}`}>
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
              <Label className={theme.textSecondary}>
                Subject Name *
                {watchedName && !errors.name && (
                  <span className="ml-2 text-xs text-green-600 dark:text-green-400">
                    <Check className="w-3 h-3 inline" /> Valid
                  </span>
                )}
              </Label>
              <Input
                {...register("name", {
                  required: "Subject name is required",
                  minLength: { value: 2, message: "Subject name is too short" },
                  maxLength: { value: 50, message: "Subject name is too long" }
                })}
                placeholder="e.g., Mathematics, Physics, English"
                className={`${inputClass} ${errors.name ? "border-red-500" : ""}`}
                disabled={isLoading}
              />
              {errors.name ? (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.name.message}
                </p>
              ) : (
                <p className={`text-xs ${theme.textMuted} mt-1`}>Enter the full subject name</p>
              )}
            </div>

            {/* Subject Code */}
            <div className="space-y-2">
              <Label className={theme.textSecondary}>
                Subject Code
                {watchedCode && !errors.code && (
                  <span className="ml-2 text-xs text-green-600 dark:text-green-400">
                    <Check className="w-3 h-3 inline" /> Valid
                  </span>
                )}
              </Label>
              <Input
                {...register("code", {
                  maxLength: { value: 10, message: "Code is too long" },
                  pattern: {
                    value: /^[A-Z0-9-]+$/,
                    message: "Only uppercase letters, numbers, and hyphens allowed"
                  }
                })}
                placeholder="e.g., MATH101, ENG-10"
                className={`${inputClass} uppercase ${errors.code ? "border-red-500" : ""}`}
                disabled={isLoading}
              />
              {errors.code ? (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.code.message}
                </p>
              ) : (
                <p className={`text-xs ${theme.textMuted} mt-1`}>Optional unique code (uppercase)</p>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label className={theme.textSecondary}>Description</Label>
            <Textarea
              {...register("description", {
                maxLength: { value: 500, message: "Description is too long" }
              })}
              placeholder="Enter subject description, syllabus details, or any notes..."
              rows={3}
              className={`${inputClass} resize-none ${errors.description ? "border-red-500" : ""}`}
              disabled={isLoading}
            />
            {errors.description ? (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.description.message}
              </p>
            ) : (
              <p className={`text-xs ${theme.textMuted} mt-1`}>
                Optional description (max 500 characters)
              </p>
            )}
          </div>

          {/* Classes Assignment */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className={theme.textSecondary}>
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4" />
                  Assign to Classes (Optional)
                  {selectedClasses.length > 0 && (
                    <span className={`ml-2 text-xs ${theme.textMuted}`}>
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
                  className={`text-xs h-7 ${theme.button.ghost}`}
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
                <SelectTrigger className={theme.select.trigger}>
                  <SelectValue placeholder={
                    classes.length === 0
                      ? "No classes available"
                      : "Add classes for this subject"
                  } />
                </SelectTrigger>
                {classes.length > 0 && (
                  <SelectContent className={theme.select.content}>
                    {classes
                      .filter(cls => cls.isActive !== false)
                      .map((cls) => (
                        <SelectItem
                          key={cls._id}
                          value={cls._id}
                          disabled={selectedClasses.includes(cls._id)}
                          className={`${theme.select.item} ${selectedClasses.includes(cls._id) ? "opacity-50" : ""}`}
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <span>{cls.name}</span>
                              {cls.section?.name && (
                                <span className={`text-xs ${theme.textMuted} ml-2`}>
                                  (Section: {cls.section.name})
                                </span>
                              )}
                            </div>
                            {selectedClasses.includes(cls._id) && (
                              <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
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
                  <div className={`flex flex-wrap gap-2 p-3 border rounded-md min-h-[60px] max-h-[150px] overflow-y-auto ${theme.emptyState}`}>
                    {selectedClasses.map((classId) => {
                      const cls = classes.find(c => c._id === classId);
                      if (!cls) return null;

                      return (
                        <div
                          key={classId}
                          className={`flex items-center gap-1 border px-3 py-2 rounded-lg shadow-sm ${theme.selectedTag}`}
                        >
                          <div className="flex-1 min-w-0">
                            <p className={`font-medium text-sm truncate ${theme.selectedTagText}`}>
                              {cls.name}
                            </p>
                            {cls.section?.name && (
                              <p className={`text-xs ${theme.selectedTagSub}`}>Section: {cls.section.name}</p>
                            )}
                            {cls.academicYear && (
                              <p className={`text-xs ${theme.selectedTagSub}`}>Year: {cls.academicYear}</p>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = selectedClasses.filter(id => id !== classId);
                              setValue("classes", updated);
                            }}
                            className={`ml-2 ${theme.textMuted} hover:text-red-600 dark:hover:text-red-400 transition-colors`}
                            disabled={isLoading}
                            aria-label={`Remove ${cls.name}`}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                  <p className={`text-xs ${theme.textMuted} mt-2`}>
                    This subject will be available in the selected classes
                  </p>
                </div>
              ) : (
                <div className={`border rounded-md p-4 text-center ${theme.emptyState}`}>
                  <GraduationCap className={`w-6 h-6 mx-auto mb-2 ${theme.emptyIcon}`} />
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