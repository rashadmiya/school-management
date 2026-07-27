// components/admin/directory/forms/CabinetForm.jsx
import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useForm, Controller } from "react-hook-form";
import { Check, AlertCircle, User, BookOpen, Users, GraduationCap } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useGetStudentsByClassQuery } from "@/features/apis/studentsApi";
import { useCreateCabinetMemberMutation, useUpdateCabinetMemberMutation } from "@/features/apis/directoryApi";
import { handleApiError } from "@/utils/handleApiErrors";
import { toast } from "sonner";

export default function CabinetForm({ open, onOpenChange, initialData, classes = [] }) {

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
      class: "",
      rollNumber: "",
      student: "",
      designation: "",
      session: "",
      isActive: true
    }
  });

  // Watch form values
  const watchedName = watch("name");
  const watchedClass = watch("class");
  const currentYear = new Date().getFullYear();
  const sessionOptions = [
    `${currentYear - 2}-${currentYear - 1}`,
    `${currentYear - 1}-${currentYear}`,
    `${currentYear}-${currentYear + 1}`,
    `${currentYear + 1}-${currentYear + 2}`
  ];

  const designationOptions = [
    { value: "president", label: "President" },
    { value: "vice_president", label: "Vice President" },
    { value: "secretary", label: "Secretary" },
    { value: "treasurer", label: "Treasurer" },
    { value: "member", label: "Member" }
  ];

  const {
    data: studentsResponse,
    isLoading: isStudentsLoading,
  } = useGetStudentsByClassQuery(watchedClass, {
    skip: !watchedClass,
  });
  const availableStudents = studentsResponse?.students || [];

  const [createCabinetMember, { isLoading: isMemberCreating }] = useCreateCabinetMemberMutation();
  const [updateCabinetMember, { isLoading: isMemberUpdating }] = useUpdateCabinetMemberMutation();

  useEffect(() => {
    if (open) {
      if (initialData) {
        // Format data for editing
        const editData = {
          name: initialData.name || "",
          class: initialData.class?._id || "",
          // section: initialData.section?._id || "",
          rollNumber: initialData.rollNumber || "",
          student: initialData.student?._id || "",
          designation: initialData.designation || "member",
          session: initialData.session || `${currentYear}-${currentYear + 1}`,
          isActive: initialData.isActive !== false
        };
        reset(editData);
      } else {
        // Default values for new member
        reset({
          name: "",
          class: "",
          // section: "",
          rollNumber: "",
          student: "",
          designation: "member",
          session: `${currentYear}-${currentYear + 1}`,
          isActive: true
        });
      }
    }
  }, [open, initialData, reset, currentYear]);

  // Auto-fill name when student is selected
  const handleStudentChange = (studentId) => {
    setValue("student", studentId);
    const selectedStudent = availableStudents.find(s => s._id === studentId);
    if (selectedStudent) {
      setValue("name", selectedStudent.name);
      setValue("rollNumber", selectedStudent.rollNumber);
    }
  };

  const onSubmit = async (data) => {
    try {
      console.log("Submitting cabinet data:", data);
      if (initialData) {
        await updateCabinetMember({ id: initialData._id, ...data }).unwrap();
        toast.success("Cabinet member updated");
      } else {
        await createCabinetMember(data).unwrap();
        toast.success("Cabinet member added");
      }
      onOpenChange(false);
    } catch (err) {
      handleApiError(err || "Error saving cabinet member");
    }
  };

  const isLoading = false;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5" />
            {initialData ? `Edit Cabinet Member: ${initialData.name}` : "Add Cabinet Member"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Student Selection */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <User className="w-4 h-4" />
              Student Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Class */}
              <div className="space-y-2">
                <Label htmlFor="class">Class *</Label>
                <Controller
                  name="class"
                  control={control}
                  rules={{ required: "Class is required" }}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={(value) => {
                        field.onChange(value);
                        // setValue("section", "");
                        setValue("student", "");
                        setValue("name", "");
                        setValue("rollNumber", "");
                      }}
                      disabled={isLoading}
                    >
                      <SelectTrigger className={errors.class ? "border-red-500" : ""}>
                        <SelectValue placeholder="Select class" />
                      </SelectTrigger>
                      <SelectContent>
                        {classes.map(cls => (
                          <SelectItem key={cls._id} value={cls._id}>
                            {cls.name} {cls.section?.name ? `- ${cls.section.name}` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.class && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.class.message}
                  </p>
                )}
              </div>

              {/* Student */}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="student">Select Student *</Label>
                <Controller
                  name="student"
                  control={control}
                  rules={{ required: "Student is required" }}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={handleStudentChange}
                      disabled={isLoading || !watchedClass || isStudentsLoading}
                    >
                      <SelectTrigger className={errors.student ? "border-red-500" : ""}>
                        <SelectValue
                          placeholder={
                            !watchedClass
                              ? "Select class first"
                              : isStudentsLoading
                                ? "Loading students..."
                                : "Select student"
                          }
                        />
                      </SelectTrigger>

                      <SelectContent>
                        {availableStudents.length === 0 && !isStudentsLoading && (
                          <SelectItem value="no-data" disabled>
                            No students found
                          </SelectItem>
                        )}

                        {availableStudents.map((student) => (
                          <SelectItem key={student._id} value={student._id}>
                            {student.name} (Roll: {student.rollNumber})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.student && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.student.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Member Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Users className="w-4 h-4" />
              Cabinet Position
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Name (auto-filled but editable) */}
              <div className="space-y-2">
                <Label htmlFor="name">
                  Name *
                  {watchedName && !errors.name && (
                    <span className="ml-2 text-xs text-green-600">
                      <Check className="w-3 h-3 inline" /> Valid
                    </span>
                  )}
                </Label>
                <Input
                  id="name"
                  {...register("name", {
                    required: "Name is required",
                    minLength: { value: 3, message: "Name is too short" }
                  })}
                  placeholder="Student name"
                  className={errors.name ? "border-red-500" : ""}
                  disabled={isLoading}
                />
                {errors.name && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.name.message}
                  </p>
                )}
              </div>

              {/* Roll Number */}
              <div className="space-y-2">
                <Label htmlFor="rollNumber">Roll Number *</Label>
                <Input
                  id="rollNumber"
                  {...register("rollNumber", {
                    required: "Roll number is required"
                  })}
                  placeholder="e.g., 10A001"
                  className={errors.rollNumber ? "border-red-500" : ""}
                  disabled={isLoading}
                />
                {errors.rollNumber && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.rollNumber.message}
                  </p>
                )}
              </div>

              {/* Designation */}
              <div className="space-y-2">
                <Label htmlFor="designation">Position *</Label>
                <Controller
                  name="designation"
                  control={control}
                  rules={{ required: "Position is required" }}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={isLoading}
                    >
                      <SelectTrigger className={errors.designation ? "border-red-500" : ""}>
                        <SelectValue placeholder="Select position" />
                      </SelectTrigger>
                      <SelectContent>
                        {designationOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
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
                <Label htmlFor="session">Session *</Label>
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
                      <SelectTrigger className={errors.session ? "border-red-500" : ""}>
                        <SelectValue placeholder="Select session" />
                      </SelectTrigger>
                      <SelectContent>
                        {sessionOptions.map((session) => (
                          <SelectItem key={session} value={session}>
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

          {/* Status */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <Label htmlFor="isActive" className="text-base">Active Status</Label>
              <p className="text-sm text-gray-500">
                {watch("isActive") ? "Member is active in cabinet" : "Member is inactive"}
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
                />
              )}
            />
          </div>

          {/* Validation Alert */}
          {(errors.name || errors.class || errors.student || errors.rollNumber || errors.designation || errors.session) && (
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