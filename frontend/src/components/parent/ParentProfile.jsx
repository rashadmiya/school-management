// components/parent/ParentProfile.jsx
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Phone, MapPin, Edit, Save, X, ShieldCheck } from "lucide-react";
import {
    useGetMyProfileQuery,
    useUpdateMyProfileMutation,
} from "@/features/apis/parentPortalApi";
import { useGetMyChildrenQuery } from "@/features/apis/parentPortalApi";
import { toast } from "react-toastify";

export default function ParentProfile() {
    const [isEditing, setIsEditing] = useState(false);

    const {
        data: profileData,
        isLoading: loadingProfile,
    } = useGetMyProfileQuery();

    const {
        data: childrenData,
        isLoading: loadingChildren,
    } = useGetMyChildrenQuery();

    const [updateProfile, { isLoading: isUpdating }] = useUpdateMyProfileMutation();

    const parent = profileData?.parent || {};
    const children = childrenData?.children || [];

    const [form, setForm] = useState({ email: "", altPhone: "", address: "" });

    // Sync form when profile data arrives / changes
    useEffect(() => {
        if (parent._id) {
            setForm({
                email: parent.email || "",
                altPhone: parent.altPhone || "",
                address: parent.address || "",
            });
        }
    }, [parent._id, parent.email, parent.altPhone, parent.address]);

    const handleChange = (field, value) =>
        setForm((f) => ({ ...f, [field]: value }));

    const handleSave = async () => {
        try {
            await updateProfile({
                email: form.email || undefined,
                altPhone: form.altPhone || undefined,
                address: form.address || undefined,
            }).unwrap();
            toast.success("Profile updated");
            setIsEditing(false);
        } catch (err) {
            toast.error(err?.data?.message || "Failed to update profile");
        }
    };

    const handleCancel = () => {
        setForm({
            email: parent.email || "",
            altPhone: parent.altPhone || "",
            address: parent.address || "",
        });
        setIsEditing(false);
    };

    if (loadingProfile) {
        return (
            <Card>
                <CardContent className="p-6 text-center text-gray-500">
                    Loading profile…
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">My Profile</h1>
                    <p className="text-gray-600 mt-2">
                        Manage your contact information
                    </p>
                </div>

                {!isEditing ? (
                    <Button
                        onClick={() => setIsEditing(true)}
                        className="flex items-center gap-2"
                    >
                        <Edit className="w-4 h-4" />
                        Edit Profile
                    </Button>
                ) : (
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={handleCancel}
                            className="flex items-center gap-2"
                        >
                            <X className="w-4 h-4" />
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={isUpdating}
                            className="flex items-center gap-2"
                        >
                            <Save className="w-4 h-4" />
                            {isUpdating ? "Saving…" : "Save Changes"}
                        </Button>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Summary card */}
                <div className="lg:col-span-1">
                    <Card>
                        <CardContent className="p-6">
                            <div className="text-center">
                                <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <User className="w-12 h-12 text-emerald-600" />
                                </div>
                                <h2 className="text-xl font-bold">{parent.name}</h2>
                                <p className="text-gray-600">Parent</p>

                                <div className="mt-4 space-y-2">
                                    <Badge
                                        variant="outline"
                                        className="w-full justify-center"
                                    >
                                        {children.length} Children
                                    </Badge>
                                </div>
                            </div>

                            <div className="mt-6 space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Status:</span>
                                    <Badge
                                        variant="default"
                                        className="bg-green-100 text-green-800"
                                    >
                                        Active
                                    </Badge>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">
                                        Children in School:
                                    </span>
                                    <span className="font-medium">
                                        {children.filter((c) => c.class).length}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Phone:</span>
                                    <span className="font-mono text-xs">
                                        {parent.phone}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Details */}
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Personal Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Contact */}
                            <div className="space-y-4">
                                <h3 className="font-semibold text-lg">
                                    Contact Information
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="flex items-center gap-2">
                                            <User className="w-4 h-4" />
                                            Full Name
                                        </Label>
                                        <Input
                                            value={parent.name || ""}
                                            disabled
                                            className="bg-gray-50"
                                        />
                                        <p className="text-xs text-gray-500">
                                            Contact the school office to change your name.
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="flex items-center gap-2">
                                            <Mail className="w-4 h-4" />
                                            Email
                                        </Label>
                                        <Input
                                            type="email"
                                            value={form.email}
                                            onChange={(e) =>
                                                handleChange("email", e.target.value)
                                            }
                                            disabled={!isEditing}
                                            placeholder="you@example.com"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="flex items-center gap-2">
                                            <Phone className="w-4 h-4" />
                                            Primary Phone
                                        </Label>
                                        <Input
                                            value={parent.phone || ""}
                                            disabled
                                            className="bg-gray-50"
                                        />
                                        <p className="text-xs text-gray-500">
                                            This is your login identifier. Contact the
                                            school to change it.
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="flex items-center gap-2">
                                            <Phone className="w-4 h-4" />
                                            Alternate Phone
                                        </Label>
                                        <Input
                                            type="tel"
                                            value={form.altPhone}
                                            onChange={(e) =>
                                                handleChange("altPhone", e.target.value)
                                            }
                                            disabled={!isEditing}
                                            placeholder="Optional alternate number"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2">
                                        <MapPin className="w-4 h-4" />
                                        Address
                                    </Label>
                                    <textarea
                                        value={form.address}
                                        onChange={(e) =>
                                            handleChange("address", e.target.value)
                                        }
                                        disabled={!isEditing}
                                        rows={3}
                                        className="w-full border rounded-md px-3 py-2 disabled:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        placeholder="Enter your address"
                                    />
                                </div>
                            </div>

                            {/* Children */}
                            <div className="space-y-4">
                                <h3 className="font-semibold text-lg">
                                    Children Information
                                </h3>

                                {loadingChildren ? (
                                    <p className="text-sm text-gray-500">
                                        Loading children…
                                    </p>
                                ) : children.length === 0 ? (
                                    <div className="text-center py-4 text-gray-500 text-sm">
                                        <p>No children registered.</p>
                                        <p>Contact the school office to link your children.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {children.map((child) => (
                                            <div
                                                key={child._id}
                                                className="flex items-center justify-between p-3 border rounded-lg"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                                        <User className="w-5 h-5 text-blue-600" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">
                                                            {child.name}
                                                        </p>
                                                        <p className="text-sm text-gray-500">
                                                            Roll: {child.rollNumber} •{" "}
                                                            {child.class?.name || "No class assigned"}
                                                        </p>
                                                    </div>
                                                </div>
                                                <Badge variant="outline">
                                                    {child.gender || "N/A"}
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Security */}
                            <div className="space-y-4">
                                <h3 className="font-semibold text-lg">
                                    Account Security
                                </h3>
                                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
                                    <ShieldCheck className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                                    <div className="text-sm text-blue-900">
                                        <p className="font-medium">PIN Authentication</p>
                                        <p className="text-blue-800 mt-1">
                                            Your account is protected by your phone number
                                            and a PIN. Forgot your PIN? Contact the school
                                            office to get a new temporary one.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}