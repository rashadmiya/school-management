import React, { useEffect } from "react";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { parentSchema } from "@/schemas/parentSchema";
import { useUpdateParentMutation } from "@/features/apis/parentsApi";
import { useCreateParentMutation } from "@/features/apis/api";
import { toast } from "react-toastify";

export default function ParentDialogForm({
    initialData = null,
    triggerLabel = "New Parent",
    onSaved
}) {
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isDirty }
    } = useForm({
        resolver: zodResolver(parentSchema),
        defaultValues: initialData || {
            name: "",
            email: "",
            phone: "",
            password: "",
            children: []
        }
    });

    const [createParent, { isLoading: creating }] = useCreateParentMutation();
    const [updateParent, { isLoading: updating }] = useUpdateParentMutation();

    useEffect(() => {
        reset(initialData || {
            name: "",
            email: "",
            phone: "",
            password: "",
            children: []
        });
    }, [initialData, reset]);

    const onSubmit = async (data) => {
        try {
            // For new parent, ensure password is provided
            if (!initialData && !data.password) {
                toast.warn("Password is required for new parents");
                return;
            }

            // Prepare the data for API
            const submitData = {
                name: data.name,
                email: data.email,
                phone: data.phone,
                children: data.children || [],
                ...(data.password && { password: data.password }) // Only include password if provided
            };

            if (initialData) {
                // For update, only send changed fields
                const updateData = {};
                if (data.name !== initialData.name) updateData.name = data.name;
                if (data.email !== initialData.email) updateData.email = data.email;
                if (data.phone !== initialData.phone) updateData.phone = data.phone;
                if (data.password) updateData.password = data.password;

                await updateParent({ id: initialData._id, ...updateData }).unwrap();
            } else {
                await createParent(submitData).unwrap();
            }

            onSaved?.();
            reset(); // Reset form after successful submission
        } catch (err) {
            console.error("Error saving parent:", err);
            toast.error(err?.data?.message || "Error saving parent");
        }
    };

    const isLoading = creating || updating;

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="default">{triggerLabel}</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>
                        {initialData ? "Edit Parent" : "Create New Parent"}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
                    {/* Name Field */}
                    <div className="space-y-2">
                        <label htmlFor="name" className="text-sm font-medium">
                            Full Name *
                        </label>
                        <Input
                            id="name"
                            {...register("name")}
                            placeholder="Enter full name"
                            className={errors.name ? "border-red-500" : ""}
                        />
                        {errors.name && (
                            <p className="text-sm text-red-500">{errors.name.message}</p>
                        )}
                    </div>

                    {/* Email Field */}
                    <div className="space-y-2">
                        <label htmlFor="email" className="text-sm font-medium">
                            Email *
                        </label>
                        <Input
                            id="email"
                            type="email"
                            {...register("email")}
                            placeholder="Enter email address"
                            className={errors.email ? "border-red-500" : ""}
                        />
                        {errors.email && (
                            <p className="text-sm text-red-500">{errors.email.message}</p>
                        )}
                    </div>

                    {/* Phone Field */}
                    <div className="space-y-2">
                        <label htmlFor="phone" className="text-sm font-medium">
                            Phone Number
                        </label>
                        <Input
                            id="phone"
                            {...register("phone")}
                            placeholder="Enter phone number"
                        />
                    </div>

                    {/* Password Field - Only required for new parents */}
                    {!initialData && (
                        <div className="space-y-2">
                            <label htmlFor="password" className="text-sm font-medium">
                                Password *
                            </label>
                            <Input
                                id="password"
                                type="password"
                                {...register("password")}
                                placeholder="Enter password"
                                className={errors.password ? "border-red-500" : ""}
                            />
                            {errors.password && (
                                <p className="text-sm text-red-500">{errors.password.message}</p>
                            )}
                            <p className="text-xs text-gray-500">
                                Password must be at least 6 characters long
                            </p>
                        </div>
                    )}

                    {/* Optional: Password field for existing parents to change password */}
                    {initialData && (
                        <div className="space-y-2">
                            <label htmlFor="password" className="text-sm font-medium">
                                New Password (leave blank to keep current)
                            </label>
                            <Input
                                id="password"
                                type="password"
                                {...register("password")}
                                placeholder="Enter new password"
                            />
                            <p className="text-xs text-gray-500">
                                Leave blank to keep current password
                            </p>
                        </div>
                    )}

                    {/* Note about children assignment */}
                    <div className="bg-blue-50 p-3 rounded-md">
                        <p className="text-sm text-blue-700">
                            <strong>Note:</strong> Children can be assigned to this parent after creation in the parent management section.
                        </p>
                    </div>

                    <DialogFooter>
                        <Button
                            type="submit"
                            disabled={isLoading || (!initialData && !isDirty)}
                            className="w-full sm:w-auto"
                        >
                            {isLoading ? "Saving..." : initialData ? "Save Changes" : "Create Parent"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};