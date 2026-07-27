// components/admin/directory/forms/SectionForm.jsx
import React, { useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useForm, Controller } from "react-hook-form";
import { toast } from "react-toastify";
import { Check, AlertCircle, Users, Filter } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useCreateSectionMutation, useUpdateSectionMutation } from "@/features/apis/sectionsApi";

export default function SectionForm({ open, onOpenChange, initialData }) {

  const [createSection, { isLoading: isCreating }] = useCreateSectionMutation();
  const [updateSection, { isLoading: isUpdating }] = useUpdateSectionMutation();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    control,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: "",
      capacity: 40,
      isActive: true
    }
  });

  // Watch form values
  const watchedName = watch("name");
  const watchedCapacity = watch("capacity");

  useEffect(() => {
    if (open) {
      if (initialData) {
        // Format data for editing
        const editData = {
          name: initialData.name || "",
          capacity: initialData.capacity || 40,
          isActive: initialData.isActive !== false
        };
        reset(editData);
      } else {
        // Default values for new section
        reset({
          name: "",
          capacity: 40,
          isActive: true
        });
      }
    }
  }, [open, initialData, reset]);

  const onSubmit = async (data) => {
    try {
      console.log("Submitting section data:", data);
      if (initialData) {
        await updateSection({ id: initialData._id, ...data }).unwrap();
        toast.success("Section updated");
      } else {
        await createSection(data).unwrap();
        toast.success("Section added");
      }
      onOpenChange(false);
    } catch (err) {
      toast.error(err?.data?.message || "Error saving section");
    }
  };

  const isLoading = false;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            {initialData ? `Edit Section: ${initialData.name}` : "Create New Section"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Section Information */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              {/* Section Name */}
              <div className="space-y-2">
                <Label htmlFor="name">
                  Section Name *
                  {watchedName && !errors.name && (
                    <span className="ml-2 text-xs text-green-600">
                      <Check className="w-3 h-3 inline" /> Valid
                    </span>
                  )}
                </Label>
                <Input
                  id="name"
                  {...register("name", {
                    required: "Section name is required",
                    minLength: { value: 1, message: "Section name is required" },
                    maxLength: { value: 10, message: "Section name is too long" },
                    pattern: {
                      value: /^[A-Z0-9]+$/,
                      message: "Only uppercase letters and numbers allowed"
                    }
                  })}
                  placeholder="e.g., A, B, C, 1, 2"
                  className={errors.name ? "border-red-500" : ""}
                  disabled={isLoading}
                  onInput={(e) => {
                    e.target.value = e.target.value.toUpperCase();
                  }}
                />
                {errors.name && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.name.message}
                  </p>
                )}
                <p className="text-xs text-gray-500">
                  Single character or number (e.g., A, B, 1, 2)
                </p>
              </div>

              {/* Capacity */}
              <div className="space-y-2">
                <Label htmlFor="capacity">
                  Capacity *
                  <span className="ml-2 text-xs text-gray-500">
                    Max students
                  </span>
                </Label>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-500" />
                  <Input
                    id="capacity"
                    type="number"
                    min="1"
                    max="100"
                    {...register("capacity", {
                      required: "Capacity is required",
                      min: { value: 1, message: "Capacity must be at least 1" },
                      max: { value: 100, message: "Capacity cannot exceed 100" },
                      valueAsNumber: true
                    })}
                    placeholder="Enter capacity"
                    className={errors.capacity ? "border-red-500" : ""}
                    disabled={isLoading}
                  />
                </div>
                {errors.capacity && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.capacity.message}
                  </p>
                )}
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Small: 20-30</span>
                  <span>Medium: 30-40</span>
                  <span>Large: 40+</span>
                </div>
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <Label htmlFor="isActive" className="text-base">Active Status</Label>
              <p className="text-sm text-gray-500">
                {watch("isActive") ? "Section is available for use" : "Section is inactive and hidden"}
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

          {/* Capacity Preview */}
          {watchedCapacity > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-800 mb-2">Capacity Preview</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-blue-700">Seats Available:</span>
                  <span className="font-medium">{watchedCapacity} students</span>
                </div>
                <div className="w-full bg-blue-100 rounded-full h-2">
                  <div
                    className="h-2 bg-blue-500 rounded-full"
                    style={{ width: '100%' }}
                  ></div>
                </div>
                <p className="text-xs text-blue-600">
                  This section can accommodate {watchedCapacity} students maximum.
                </p>
              </div>
            </div>
          )}

          {/* Validation Alert */}
          {(errors.name || errors.capacity) && (
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
                "Update Section"
              ) : (
                "Create Section"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// // components/sections/SectionForm.jsx
// import React, { useEffect } from "react";
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Switch } from "@/components/ui/switch";
// import { useForm } from "react-hook-form";
// import { useCreateSectionMutation, useUpdateSectionMutation } from "@/features/apis/sectionsApi";
// import { toast } from "react-toastify";

// export default function SectionForm({ open, onOpenChange, initialData }) {
//   const [createSection, { isLoading: creating }] = useCreateSectionMutation();
//   const [updateSection, { isLoading: updating }] = useUpdateSectionMutation();

//   const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
//     defaultValues: { name: "", capacity: 40, isActive: true }
//   });

//   useEffect(() => {
//     if (open) {
//       if (initialData) {
//         reset({
//           name: initialData.name || "",
//           capacity: initialData.capacity || 40,
//           isActive: initialData.isActive !== undefined ? initialData.isActive : true
//         });
//       } else {
//         reset({ name: "", capacity: 40, isActive: true });
//       }
//     }
//   }, [open, initialData, reset]);

//   const onSubmit = async (data) => {
//     try {
//       if (initialData) {
//         await updateSection({ id: initialData._id, ...data }).unwrap();
//         toast.success("Section updated successfully!");
//       } else {
//         await createSection(data).unwrap();
//         toast.success("Section created successfully!");
//       }
//       onOpenChange(false);
//     } catch (err) {
//       toast.error(err?.data?.message || "Error saving section");
//     }
//   };

//   const isLoading = creating || updating;

//   return (
//     <Dialog open={open} onOpenChange={onOpenChange}>
//       <DialogContent className="sm:max-w-[500px]">
//         <DialogHeader><DialogTitle>{initialData ? "Edit Section" : "Create New Section"}</DialogTitle></DialogHeader>
//         <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
//           <div className="space-y-2">
//             <Label htmlFor="name">Section Name *</Label>
//             <Input id="name" {...register("name", { required: "Section name is required" })} placeholder="e.g., A, B, Science, Arts" className={errors.name ? "border-red-500" : ""} />
//             {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
//           </div>
//           <div className="space-y-2">
//             <Label htmlFor="capacity">Capacity</Label>
//             <Input type="number" id="capacity" {...register("capacity", { valueAsNumber: true, min: 1 })} placeholder="e.g., 40" />
//           </div>
//           <div className="flex items-center justify-between">
//             <Label htmlFor="isActive">Active Status</Label>
//             <Switch checked={watch("isActive")} onCheckedChange={(checked) => setValue("isActive", checked)} />
//           </div>
//           <DialogFooter>
//             <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
//             <Button type="submit" disabled={isLoading}>{isLoading ? "Saving..." : initialData ? "Update Section" : "Create Section"}</Button>
//           </DialogFooter>
//         </form>
//       </DialogContent>
//     </Dialog>
//   );
// }
