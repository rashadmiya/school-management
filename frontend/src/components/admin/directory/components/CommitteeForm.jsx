// components/admin/directory/forms/CommitteeForm.jsx
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useCreateCommitteeMemberMutation, useUpdateCommitteeMemberMutation } from "@/features/apis/directoryApi";
import { handleApiError } from "@/utils/handleApiErrors";
import { AlertCircle, Award, Check, Phone, Quote } from "lucide-react";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

export default function CommitteeForm({ open, onOpenChange, initialData }) {

  const [createMember, { isLoading: isCreatingMember }] = useCreateCommitteeMemberMutation();
  const [updateMember, { isLoading: isUpdating }] = useUpdateCommitteeMemberMutation();

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
      phoneNumber: "",
      address: "",
      religion: "",
      photo: "",
      quote: "", // Added quote field
      order: 1,
      isActive: true
    }
  });

  // Watch form values
  const watchedName = watch("name");
  const watchedDesignation = watch("designation");
  
  // Check if quote should be shown
  const quoteAllowedDesignations = ['chairman', 'secretary', 'principal'];
  const showQuoteField = quoteAllowedDesignations.includes(watchedDesignation);

  const currentYear = new Date().getFullYear();
  const sessionOptions = [
    `${currentYear - 2}-${currentYear - 1}`,
    `${currentYear - 1}-${currentYear}`,
    `${currentYear}-${currentYear + 1}`,
    `${currentYear + 1}-${currentYear + 2}`
  ];

  const designationOptions = [
    { value: "chairman", label: "Chairman" },
    { value: "secretary", label: "Secretary" },
    { value: "treasurer", label: "Treasurer" },
    { value: "principal", label: "Principal" },
    { value: "member", label: "Member" }
  ];

  const religionOptions = ["Islam", "Hinduism", "Christianity", "Buddhism", "Other"];

  useEffect(() => {
    if (open) {
      if (initialData) {
        // Format data for editing
        const editData = {
          name: initialData.name || "",
          designation: initialData.designation || "member",
          session: initialData.session || `${currentYear}-${currentYear + 1}`,
          phoneNumber: initialData.phoneNumber || "",
          address: initialData.address || "",
          religion: initialData.religion || "",
          photo: initialData.photo || "",
          quote: initialData.quote || "", // Added quote
          order: initialData.order || 1,
          isActive: initialData.isActive !== false
        };
        reset(editData);
      } else {
        // Default values for new member
        reset({
          name: "",
          designation: "member",
          session: `${currentYear}-${currentYear + 1}`,
          phoneNumber: "",
          address: "",
          religion: "",
          photo: "",
          quote: "", // Added quote
          order: 1,
          isActive: true
        });
      }
    }
  }, [open, initialData, reset, currentYear]);

  // Clear quote when designation changes to non-allowed role
  useEffect(() => {
    if (watchedDesignation && !quoteAllowedDesignations.includes(watchedDesignation)) {
      setValue("quote", "");
    }
  }, [watchedDesignation, setValue]);

  const onSubmit = async (data) => {
    try {
      // Ensure quote is only sent for allowed designations
      const payload = {
        ...data,
        quote: quoteAllowedDesignations.includes(data.designation) ? data.quote : ""
      };

      if (initialData) {
        await updateMember({ id: initialData._id, ...payload }).unwrap();
        toast.success("Committee member updated");
      } else {
        await createMember(payload).unwrap();
        toast.success("Committee member added");
      }
      onOpenChange(false);
    } catch (err) {
      handleApiError(err || "Error saving committee member");
    }
  };

  const isLoading = isCreatingMember || isUpdating;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Award className="w-5 h-5" />
            {initialData ? `Edit Committee Member: ${initialData.name}` : "Add Committee Member"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
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

            {/* Order */}
            <div className="space-y-2">
              <Label htmlFor="order">Display Order</Label>
              <Input
                id="order"
                type="number"
                min="1"
                {...register("order", {
                  min: { value: 1, message: "Order must be at least 1" },
                  valueAsNumber: true
                })}
                placeholder="Display order (1, 2, 3...)"
                className={errors.order ? "border-red-500" : ""}
                disabled={isLoading}
              />
              {errors.order && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.order.message}
                </p>
              )}
              <p className="text-xs text-gray-500">Lower numbers appear first</p>
            </div>
          </div>

          {/* Quote Field - Conditionally Rendered */}
          {showQuoteField && (
            <div className="space-y-2 p-4 border rounded-lg bg-gray-50">
              <Label htmlFor="quote" className="flex items-center gap-2">
                <Quote className="w-4 h-4" />
                Inspirational Quote
                <span className="text-xs text-gray-500 ml-auto">
                  (Optional for {watchedDesignation})
                </span>
              </Label>
              <Textarea
                id="quote"
                {...register("quote")}
                placeholder={`Enter inspirational quote for the ${watchedDesignation}`}
                rows={3}
                disabled={isLoading}
                className="resize-none"
              />
              <p className="text-xs text-gray-500">
                This quote will be displayed prominently on the committee page.
              </p>
            </div>
          )}

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Phone className="w-4 h-4" />
              Contact Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Phone Number */}
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  {...register("phoneNumber")}
                  placeholder="Enter phone number"
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
                      value={field.value ?? "none"}
                      onValueChange={(value) =>
                        field.onChange(value === "none" ? undefined : value)
                      }
                      disabled={isLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select religion" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Not specified</SelectItem>
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

          {/* Photo */}
          <div className="space-y-2">
            <Label htmlFor="photo">Photo URL</Label>
            <Input
              id="photo"
              {...register("photo")}
              placeholder="Enter photo URL or path"
              disabled={isLoading}
            />
            <p className="text-xs text-gray-500">
              Enter URL of the committee member's photo
            </p>
          </div>

          {/* Status */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <Label htmlFor="isActive" className="text-base">Active Status</Label>
              <p className="text-sm text-gray-500">
                {watch("isActive") ? "Member is active" : "Member is inactive"}
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
          {(errors.name || errors.designation || errors.session || errors.order) && (
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

// // components/admin/directory/forms/CommitteeForm.jsx
// import { Alert, AlertDescription } from "@/components/ui/alert";
// import { Button } from "@/components/ui/button";
// import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { Switch } from "@/components/ui/switch";
// import { Textarea } from "@/components/ui/textarea";
// import { useCreateCommitteeMemberMutation, useUpdateCommitteeMemberMutation } from "@/features/apis/directoryApi";
// import { handleApiError } from "@/utils/handleApiErrors";
// import { AlertCircle, Award, Check, Phone } from "lucide-react";
// import { useEffect } from "react";
// import { Controller, useForm } from "react-hook-form";
// import { toast } from "sonner";

// export default function CommitteeForm({ open, onOpenChange, initialData }) {

//   const [createMember, { isLoading: isCreatingMember }] = useCreateCommitteeMemberMutation();
//   const [updateMember, { isLoading: isUpdating }] = useUpdateCommitteeMemberMutation();

//   const {
//     register,
//     handleSubmit,
//     reset,
//     setValue,
//     watch,
//     control,
//     formState: { errors },
//   } = useForm({
//     defaultValues: {
//       name: "",
//       designation: "",
//       session: "",
//       phoneNumber: "",
//       address: "",
//       religion: "",
//       photo: "",
//       order: 1,
//       isActive: true
//     }
//   });

//   // Watch form values
//   const watchedName = watch("name");
//   const currentYear = new Date().getFullYear();
//   const sessionOptions = [
//     `${currentYear - 2}-${currentYear - 1}`,
//     `${currentYear - 1}-${currentYear}`,
//     `${currentYear}-${currentYear + 1}`,
//     `${currentYear + 1}-${currentYear + 2}`
//   ];

//   const designationOptions = [
//     { value: "chairman", label: "Chairman" },
//     { value: "secretary", label: "Secretary" },
//     { value: "treasurer", label: "Treasurer" },
//     { value: "principal", label: "Principal" },
//     { value: "member", label: "Member" }
//   ];

//   const religionOptions = ["Islam", "Hinduism", "Christianity", "Buddhism", "Other"];

//   useEffect(() => {
//     if (open) {
//       if (initialData) {
//         // Format data for editing
//         const editData = {
//           name: initialData.name || "",
//           designation: initialData.designation || "member",
//           session: initialData.session || `${currentYear}-${currentYear + 1}`,
//           phoneNumber: initialData.phoneNumber || "",
//           address: initialData.address || "",
//           religion: initialData.religion || "",
//           photo: initialData.photo || "",
//           order: initialData.order || 1,
//           isActive: initialData.isActive !== false
//         };
//         reset(editData);
//       } else {
//         // Default values for new member
//         reset({
//           name: "",
//           designation: "member",
//           session: `${currentYear}-${currentYear + 1}`,
//           phoneNumber: "",
//           address: "",
//           religion: "",
//           photo: "",
//           order: 1,
//           isActive: true
//         });
//       }
//     }
//   }, [open, initialData, reset, currentYear]);

//   const onSubmit = async (data) => {
//     try {
//       if (initialData) {
//         await updateMember({ id: initialData._id, ...data }).unwrap();
//         toast.success("Committee member updated");
//       } else {
//         await createMember(data).unwrap();
//         toast.success("SCommittee member added");
//       }
//       onOpenChange(false);
//     } catch (err) {
//       handleApiError(err || "Error saving committee member");
//     }
//   };

//   const isLoading = false;

//   return (
//     <Dialog open={open} onOpenChange={onOpenChange}>
//       <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
//         <DialogHeader>
//           <DialogTitle className="flex items-center gap-2">
//             <Award className="w-5 h-5" />
//             {initialData ? `Edit Committee Member: ${initialData.name}` : "Add Committee Member"}
//           </DialogTitle>
//         </DialogHeader>

//         <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
//           {/* Basic Information */}
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//             {/* Name */}
//             <div className="space-y-2">
//               <Label htmlFor="name">
//                 Full Name *
//                 {watchedName && !errors.name && (
//                   <span className="ml-2 text-xs text-green-600">
//                     <Check className="w-3 h-3 inline" /> Valid
//                   </span>
//                 )}
//               </Label>
//               <Input
//                 id="name"
//                 {...register("name", {
//                   required: "Name is required",
//                   minLength: { value: 3, message: "Name is too short" }
//                 })}
//                 placeholder="Enter full name"
//                 className={errors.name ? "border-red-500" : ""}
//                 disabled={isLoading}
//               />
//               {errors.name && (
//                 <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
//                   <AlertCircle className="w-3 h-3" />
//                   {errors.name.message}
//                 </p>
//               )}
//             </div>

//             {/* Designation */}
//             <div className="space-y-2">
//               <Label htmlFor="designation">Designation *</Label>
//               <Controller
//                 name="designation"
//                 control={control}
//                 rules={{ required: "Designation is required" }}
//                 render={({ field }) => (
//                   <Select
//                     value={field.value}
//                     onValueChange={field.onChange}
//                     disabled={isLoading}
//                   >
//                     <SelectTrigger className={errors.designation ? "border-red-500" : ""}>
//                       <SelectValue placeholder="Select designation" />
//                     </SelectTrigger>
//                     <SelectContent>
//                       {designationOptions.map((option) => (
//                         <SelectItem key={option.value} value={option.value}>
//                           {option.label}
//                         </SelectItem>
//                       ))}
//                     </SelectContent>
//                   </Select>
//                 )}
//               />
//               {errors.designation && (
//                 <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
//                   <AlertCircle className="w-3 h-3" />
//                   {errors.designation.message}
//                 </p>
//               )}
//             </div>

//             {/* Session */}
//             <div className="space-y-2">
//               <Label htmlFor="session">Session *</Label>
//               <Controller
//                 name="session"
//                 control={control}
//                 rules={{ required: "Session is required" }}
//                 render={({ field }) => (
//                   <Select
//                     value={field.value}
//                     onValueChange={field.onChange}
//                     disabled={isLoading}
//                   >
//                     <SelectTrigger className={errors.session ? "border-red-500" : ""}>
//                       <SelectValue placeholder="Select session" />
//                     </SelectTrigger>
//                     <SelectContent>
//                       {sessionOptions.map((session) => (
//                         <SelectItem key={session} value={session}>
//                           {session}
//                         </SelectItem>
//                       ))}
//                     </SelectContent>
//                   </Select>
//                 )}
//               />
//               {errors.session && (
//                 <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
//                   <AlertCircle className="w-3 h-3" />
//                   {errors.session.message}
//                 </p>
//               )}
//             </div>

//             {/* Order */}
//             <div className="space-y-2">
//               <Label htmlFor="order">Display Order</Label>
//               <Input
//                 id="order"
//                 type="number"
//                 min="1"
//                 {...register("order", {
//                   min: { value: 1, message: "Order must be at least 1" },
//                   valueAsNumber: true
//                 })}
//                 placeholder="Display order (1, 2, 3...)"
//                 className={errors.order ? "border-red-500" : ""}
//                 disabled={isLoading}
//               />
//               {errors.order && (
//                 <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
//                   <AlertCircle className="w-3 h-3" />
//                   {errors.order.message}
//                 </p>
//               )}
//               <p className="text-xs text-gray-500">Lower numbers appear first</p>
//             </div>
//           </div>

//           {/* Contact Information */}
//           <div className="space-y-4">
//             <h3 className="text-lg font-semibold flex items-center gap-2">
//               <Phone className="w-4 h-4" />
//               Contact Information
//             </h3>

//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               {/* Phone Number */}
//               <div className="space-y-2">
//                 <Label htmlFor="phoneNumber">Phone Number</Label>
//                 <Input
//                   id="phoneNumber"
//                   {...register("phoneNumber")}
//                   placeholder="Enter phone number"
//                   disabled={isLoading}
//                 />
//               </div>

//               {/* Religion */}
//               <div className="space-y-2">
//                 <Label htmlFor="religion">Religion</Label>
//                 <Controller
//                   name="religion"
//                   control={control}
//                   render={({ field }) => (
//                     <Select
//                       value={field.value ?? "none"}
//                       onValueChange={(value) =>
//                         field.onChange(value === "none" ? undefined : value)
//                       }
//                       disabled={isLoading}
//                     >
//                       <SelectTrigger>
//                         <SelectValue placeholder="Select religion" />
//                       </SelectTrigger>
//                       <SelectContent>
//                         <SelectItem value="none">Not specified</SelectItem>
//                         {religionOptions.map((religion) => (
//                           <SelectItem key={religion} value={religion}>
//                             {religion}
//                           </SelectItem>
//                         ))}
//                       </SelectContent>
//                     </Select>
//                   )}
//                 />
//               </div>

//               {/* Address */}
//               <div className="space-y-2 md:col-span-2">
//                 <Label htmlFor="address">Address</Label>
//                 <Textarea
//                   id="address"
//                   {...register("address")}
//                   placeholder="Enter full address"
//                   rows={2}
//                   disabled={isLoading}
//                 />
//               </div>
//             </div>
//           </div>

//           {/* Photo */}
//           <div className="space-y-2">
//             <Label htmlFor="photo">Photo URL</Label>
//             <Input
//               id="photo"
//               {...register("photo")}
//               placeholder="Enter photo URL or path"
//               disabled={isLoading}
//             />
//             <p className="text-xs text-gray-500">
//               Enter URL of the committee member's photo
//             </p>
//           </div>

//           {/* Status */}
//           <div className="flex items-center justify-between p-4 border rounded-lg">
//             <div>
//               <Label htmlFor="isActive" className="text-base">Active Status</Label>
//               <p className="text-sm text-gray-500">
//                 {watch("isActive") ? "Member is active" : "Member is inactive"}
//               </p>
//             </div>
//             <Controller
//               name="isActive"
//               control={control}
//               render={({ field }) => (
//                 <Switch
//                   checked={field.value}
//                   onCheckedChange={field.onChange}
//                   disabled={isLoading}
//                 />
//               )}
//             />
//           </div>

//           {/* Validation Alert */}
//           {(errors.name || errors.designation || errors.session || errors.order) && (
//             <Alert variant="destructive">
//               <AlertCircle className="h-4 w-4" />
//               <AlertDescription>
//                 Please fix the errors above before submitting
//               </AlertDescription>
//             </Alert>
//           )}

//           <DialogFooter className="pt-4 border-t">
//             <Button
//               type="button"
//               variant="outline"
//               onClick={() => onOpenChange(false)}
//               disabled={isLoading}
//             >
//               Cancel
//             </Button>
//             <Button
//               type="submit"
//               disabled={isLoading || Object.keys(errors).length > 0}
//               className="min-w-[120px]"
//             >
//               {isLoading ? (
//                 <>
//                   <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
//                   {initialData ? "Updating..." : "Creating..."}
//                 </>
//               ) : initialData ? (
//                 "Update Member"
//               ) : (
//                 "Add Member"
//               )}
//             </Button>
//           </DialogFooter>
//         </form>
//       </DialogContent>
//     </Dialog>
//   );
// }