// components/admin/directory/forms/StuffForm.jsx
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useCreateStaffMutation, useUpdateStaffMutation } from "@/features/apis/directoryApi";
import { AlertCircle, Calendar, Check, GraduationCap, Phone, User } from "lucide-react";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

export default function StuffForm({ open, onOpenChange, initialData }) {

  const [createStuff, { isLoading: isCreating }] = useCreateStaffMutation();
  const [updateStuff, { isLoading: isUpdating }] = useUpdateStaffMutation();

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
      dateOfBirth: "",
      nationalIdNo: "",
      lastQualification: {
        name: "",
        major: "",
        institute: ""
      },
      phoneNumber: "",
      address: "",
      religion: "",
      photo: "",
      joiningDate: new Date().toISOString().split('T')[0],
      isActive: true
    }
  });

  // Watch form values
  const watchedName = watch("name");
  const watchedPhone = watch("phoneNumber");
  const currentYear = new Date().getFullYear();
  const sessionOptions = [
    `${currentYear - 2}-${currentYear - 1}`,
    `${currentYear - 1}-${currentYear}`,
    `${currentYear}-${currentYear + 1}`,
    `${currentYear + 1}-${currentYear + 2}`
  ];

  // Common designations for staff
  const designationOptions = [
    "Accountant", "Clerk", "Librarian", "Lab Assistant", "Peon",
    "Security Guard", "Cleaner", "Driver", "Office Assistant",
    "IT Support", "Registrar", "Store Keeper", "Sports Coach",
    "Counselor", "Nurse", "Other"
  ];

  const religionOptions = ["Islam", "Hinduism", "Christianity", "Buddhism", "Other"];

  useEffect(() => {
    if (open) {
      if (initialData) {
        // Format data for editing
        const editData = {
          name: initialData.name || "",
          designation: initialData.designation || "",
          session: initialData.session || `${currentYear}-${currentYear + 1}`,
          dateOfBirth: initialData.dateOfBirth?.split('T')[0] || "",
          nationalIdNo: initialData.nationalIdNo || "",
          lastQualification: initialData.lastQualification || {
            name: "",
            major: "",
            institute: ""
          },
          phoneNumber: initialData.phoneNumber || "",
          address: initialData.address || "",
          religion: initialData.religion || "",
          photo: initialData.photo || "",
          joiningDate: initialData.joiningDate?.split('T')[0] || new Date().toISOString().split('T')[0],
          isActive: initialData.isActive !== false
        };
        reset(editData);
      } else {
        // Default values for new staff
        reset({
          name: "",
          designation: "",
          session: `${currentYear}-${currentYear + 1}`,
          dateOfBirth: "",
          nationalIdNo: "",
          lastQualification: {
            name: "",
            major: "",
            institute: ""
          },
          phoneNumber: "",
          address: "",
          religion: "",
          photo: "",
          joiningDate: new Date().toISOString().split('T')[0],
          isActive: true
        });
      }
    }
  }, [open, initialData, reset, currentYear]);

  const onSubmit = async (data) => {
    try {
      console.log("Submitting staff data:", data);
      // TODO: Implement API call
      if (initialData) {
        await updateStuff({ id: initialData._id, ...data }).unwrap();
        toast.success("Staff member updated successfully");
      } else {
        await createStuff(data).unwrap();
        toast.success("Staff member created successfully");
      }
      // toast.success(initialData ? "Staff member updated" : "Staff member created");
      onOpenChange(false);
    } catch (err) {
      toast.error(err || "Error saving staff member");
    }
  };

  const isLoading = false; // Replace with actual loading state

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            {initialData ? `Edit Staff: ${initialData.name}` : "Add New Staff Member"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <User className="w-4 h-4" />
              Basic Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">
                  Full Name *
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
                  placeholder="Enter full name"
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

              {/* Designation */}
              <div className="space-y-2">
                <Label htmlFor="designation">Designation *</Label>
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
                      <SelectTrigger className={errors.designation ? "border-red-500" : ""}>
                        <SelectValue placeholder="Select designation" />
                      </SelectTrigger>
                      <SelectContent>
                        {designationOptions.map((designation) => (
                          <SelectItem key={designation} value={designation}>
                            {designation}
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

              {/* National ID */}
              <div className="space-y-2">
                <Label htmlFor="nationalIdNo">National ID Number</Label>
                <Input
                  id="nationalIdNo"
                  {...register("nationalIdNo")}
                  placeholder="Enter national ID"
                  disabled={isLoading}
                />
                <p className="text-xs text-gray-500">Optional unique identification number</p>
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

          {/* Personal Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Personal Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Date of Birth */}
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  {...register("dateOfBirth")}
                  disabled={isLoading}
                />
              </div>

              {/* Joining Date */}
              <div className="space-y-2">
                <Label htmlFor="joiningDate">Joining Date</Label>
                <Input
                  id="joiningDate"
                  type="date"
                  {...register("joiningDate")}
                  disabled={isLoading}
                />
              </div>

              {/* Religion */}
              <div className="space-y-2">
                <Label htmlFor="religion">Religion</Label>
                <Controller
                  name="religion"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value ?? "all"}
                      onValueChange={field.onChange}
                      disabled={isLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select religion" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Not specified</SelectItem>
                        {religionOptions.map((religion) => (
                          <SelectItem key={religion} value={religion}>
                            {religion}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Phone className="w-4 h-4" />
              Contact Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Phone Number */}
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">
                  Phone Number *
                  {watchedPhone && !errors.phoneNumber && (
                    <span className="ml-2 text-xs text-green-600">
                      <Check className="w-3 h-3 inline" /> Valid
                    </span>
                  )}
                </Label>
                <Input
                  id="phoneNumber"
                  {...register("phoneNumber", {
                    required: "Phone number is required",
                    pattern: {
                      value: /^[0-9+\-\s]+$/,
                      message: "Enter a valid phone number"
                    }
                  })}
                  placeholder="Enter phone number"
                  className={errors.phoneNumber ? "border-red-500" : ""}
                  disabled={isLoading}
                />
                {errors.phoneNumber && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.phoneNumber.message}
                  </p>
                )}
              </div>

              {/* Address */}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  {...register("address")}
                  placeholder="Enter full address"
                  rows={2}
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          {/* Qualification */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <GraduationCap className="w-4 h-4" />
              Educational Qualification
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Degree Name */}
              <div className="space-y-2">
                <Label htmlFor="lastQualification.name">Degree/Diploma</Label>
                <Input
                  id="lastQualification.name"
                  {...register("lastQualification.name")}
                  placeholder="e.g., B.Sc, M.Com"
                  disabled={isLoading}
                />
              </div>

              {/* Major/Subject */}
              <div className="space-y-2">
                <Label htmlFor="lastQualification.major">Major/Subject</Label>
                <Input
                  id="lastQualification.major"
                  {...register("lastQualification.major")}
                  placeholder="e.g., Accounting, Physics"
                  disabled={isLoading}
                />
              </div>

              {/* Institute */}
              <div className="space-y-2">
                <Label htmlFor="lastQualification.institute">Institute</Label>
                <Input
                  id="lastQualification.institute"
                  {...register("lastQualification.institute")}
                  placeholder="University/College name"
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          {/* Photo Upload */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Photo</h3>
            <div className="space-y-2">
              <Label htmlFor="photo">Photo URL</Label>
              <Input
                id="photo"
                {...register("photo")}
                placeholder="Enter photo URL or path"
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500">
                Enter URL of the staff photo. Upload functionality coming soon.
              </p>
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <Label htmlFor="isActive" className="text-base">Active Status</Label>
              <p className="text-sm text-gray-500">
                {watch("isActive") ? "Staff member is active" : "Staff member is inactive"}
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
          {(errors.name || errors.designation || errors.session || errors.phoneNumber) && (
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
              disabled={isCreating || isUpdating || Object.keys(errors).length > 0}
              className="min-w-[120px]"
            >
              {isCreating || isUpdating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {initialData ? "Updating..." : "Creating..."}
                </>
              ) : initialData ? (
                "Update Staff"
              ) : (
                "Add Staff"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}