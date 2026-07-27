import { Button } from "@/components/ui/button";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui/select";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { useState } from "react";
import { toast } from "react-toastify";
import { useGetUsersQuery } from "@/features/apis/authApi";
import {
    useGetRolesQuery,
    useUpdateUserRoleMutation,
} from "@/features/apis/roleApi";

export default function UserManagement() {
    const [selectedRoles, setSelectedRoles] = useState({});
    const { data: usersData, isLoading } = useGetUsersQuery();
    const { data: rolesData, isLoading: isRolesLoading } = useGetRolesQuery();
    const [updateUserRole, { isLoading: isUpdating }] =
        useUpdateUserRoleMutation();

    if (isLoading || isRolesLoading) return <div>Loading users...</div>;

    const users = usersData?.users || [];
    const roles = rolesData?.roles || [];

    const handleRoleChange = (userId, roleId) => {
        setSelectedRoles((prev) => ({ ...prev, [userId]: roleId }));
    };

    const handleUpdate = async (userId) => {
        const roleId = selectedRoles[userId];
        if (!roleId) return toast.error("Please select a role");

        try {
            await updateUserRole({ id: userId, roleId }).unwrap();
            toast.success("Role updated successfully");
        } catch (err) {
            toast.error("Failed to update role");
        }
    };

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-2xl font-semibold">User Management</h1>

            <Card>
                <CardHeader>
                    <h2 className="text-xl font-medium">All Users</h2>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="min-w-full border rounded-md">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="p-3 text-left">Name</th>
                                    <th className="p-3 text-left">Email</th>
                                    <th className="p-3 text-left">Current Role</th>
                                    <th className="p-3 text-left">Assign Role</th>
                                    <th className="p-3 text-left">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users?.map((user) => {
                                    const currentRoleId =
                                        selectedRoles[user._id] || user.role?._id || "";

                                    return (
                                        <tr key={user._id} className="border-t">
                                            <td className="p-3">{user.name}</td>
                                            <td className="p-3">{user.email}</td>
                                            <td className="p-3">{user.role?.name || "—"}</td>
                                            <td className="p-3">
                                                <Select
                                                    value={currentRoleId}
                                                    onValueChange={(val) =>
                                                        handleRoleChange(user._id, val)
                                                    }
                                                >
                                                    <SelectTrigger className="w-[180px]">
                                                        <SelectValue
                                                            placeholder={user.role?.name || "Select role"}
                                                        />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {roles?.map((role) => (
                                                            <SelectItem key={role._id} value={role._id}>
                                                                {role.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </td>
                                            <td className="p-3">
                                                <Button
                                                    disabled={isUpdating}
                                                    onClick={() => handleUpdate(user._id)}
                                                    className="bg-primary text-white"
                                                >
                                                    Update
                                                </Button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

