// pages/UserManagement.jsx
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useGetUsersQuery } from "@/features/apis/authApi";
import {
    useGetRolesQuery,
    useUpdateUserRoleMutation,
} from "@/features/apis/roleApi";
import { useTheme } from "@/hooks/useTheme";
// import { useTheme } from "@/hooks/useTheme";
import { Loader2, RefreshCw, UserCog, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "react-toastify";

export default function UserManagement() {
    const theme = useTheme();
    const [selectedRoles, setSelectedRoles] = useState({});
    const { data: usersData, isLoading, refetch } = useGetUsersQuery();
    const { data: rolesData, isLoading: isRolesLoading } = useGetRolesQuery();
    const [updateUserRole, { isLoading: isUpdating }] = useUpdateUserRoleMutation();

    const handleRoleChange = (userId, roleId) => {
        setSelectedRoles((prev) => ({ ...prev, [userId]: roleId }));
    };

    const handleUpdate = async (userId) => {
        const roleId = selectedRoles[userId];
        if (!roleId) return toast.error("Please select a role");

        try {
            await updateUserRole({ id: userId, roleId }).unwrap();
            toast.success("Role updated successfully");
            // Clear the selected role after update
            setSelectedRoles((prev) => {
                const newState = { ...prev };
                delete newState[userId];
                return newState;
            });
            refetch();
        } catch (err) {
            toast.error(err?.data?.message || "Failed to update role");
        }
    };

    if (isLoading || isRolesLoading) {
        return (
            <div className={`flex items-center justify-center min-h-[400px] ${theme.textMuted}`}>
                <div className="text-center">
                    <Loader2 className={`w-12 h-12 animate-spin ${theme.loading} mx-auto mb-4`} />
                    <p>Loading users...</p>
                </div>
            </div>
        );
    }

    const users = usersData?.users || [];
    const roles = rolesData?.roles || [];

    return (
        <div className={`space-y-6 ${theme.text}`}>
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className={`text-3xl font-bold ${theme.text}`}>User Management</h1>
                    <p className={theme.textMuted}>
                        Manage user roles and permissions across the system
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className={`${theme.badge.outline} flex items-center gap-2`}>
                        <Users className="w-4 h-4" />
                        {users.length} Users
                    </Badge>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => refetch()}
                        className={theme.button.outline}
                    >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className={`${theme.bgCard} ${theme.border} shadow-sm`}>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className={`p-2.5 rounded-lg border ${theme.badge.default}`}>
                                <Users className={`w-5 h-5 ${theme.icon}`} />
                            </div>
                            <div>
                                <p className={`text-2xl font-bold ${theme.text}`}>{users.length}</p>
                                <p className={`text-sm ${theme.textMuted}`}>Total Users</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className={`${theme.bgCard} ${theme.border} shadow-sm`}>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className={`p-2.5 rounded-lg border ${theme.badge.default}`}>
                                <UserCog className={`w-5 h-5 ${theme.icon}`} />
                            </div>
                            <div>
                                <p className={`text-2xl font-bold ${theme.text}`}>{roles.length}</p>
                                <p className={`text-sm ${theme.textMuted}`}>Available Roles</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className={`${theme.bgCard} ${theme.border} shadow-sm`}>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className={`p-2.5 rounded-lg border ${theme.badge.default}`}>
                                <Badge className={`${theme.badge.default} border-0`}>A</Badge>
                            </div>
                            <div>
                                <p className={`text-2xl font-bold ${theme.text}`}>
                                    {users.filter(u => u.role?.name === 'admin').length}
                                </p>
                                <p className={`text-sm ${theme.textMuted}`}>Admins</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className={`${theme.bgCard} ${theme.border} shadow-sm`}>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className={`p-2.5 rounded-lg border ${theme.badge.default}`}>
                                <Badge className={`${theme.badge.default} border-0`}>T</Badge>
                            </div>
                            <div>
                                <p className={`text-2xl font-bold ${theme.text}`}>
                                    {users.filter(u => u.role?.name === 'teacher').length}
                                </p>
                                <p className={`text-sm ${theme.textMuted}`}>Teachers</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Users Table */}
            <Card className={`${theme.bgCard} ${theme.border} shadow-sm overflow-hidden`}>
                <CardHeader>
                    <CardTitle className={theme.text}>All Users</CardTitle>
                    <CardDescription className={theme.textMuted}>
                        Assign or update roles for each user in the system
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className={`${theme.tableHeader} border-b ${theme.border}`}>
                                <TableRow>
                                    <TableHead className={theme.textSecondary}>User</TableHead>
                                    <TableHead className={theme.textSecondary}>Email</TableHead>
                                    <TableHead className={theme.textSecondary}>Current Role</TableHead>
                                    <TableHead className={theme.textSecondary}>Assign Role</TableHead>
                                    <TableHead className={`text-right ${theme.textSecondary}`}>Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.length === 0 ? (
                                    <TableRow className={theme.tableRow}>
                                        <TableCell colSpan={5} className={`text-center py-8 ${theme.textMuted}`}>
                                            <Users className={`w-12 h-12 ${theme.textMuted} mx-auto mb-2 opacity-50`} />
                                            <p>No users found</p>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    users.map((user) => {
                                        const currentRoleId = selectedRoles[user._id] || user.role?._id || "";
                                        const hasSelectedRole = !!selectedRoles[user._id];

                                        return (
                                            <TableRow key={user._id} className={`border-b ${theme.tableRow}`}>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-10 h-10 rounded-full ${theme.badge.default} flex items-center justify-center text-sm font-medium`}>
                                                            {user.name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <div className={`font-medium ${theme.text}`}>{user.name}</div>
                                                            <div className={`text-xs ${theme.textMuted}`}>
                                                                ID: {user._id?.slice(-6) || 'N/A'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className={theme.textMuted}>
                                                    {user.email}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className={theme.badge.default}>
                                                        {user.role?.name || "No Role"}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Select
                                                        value={currentRoleId}
                                                        onValueChange={(val) => handleRoleChange(user._id, val)}
                                                    >
                                                        <SelectTrigger className={`w-[180px] ${theme.select.trigger}`}>
                                                            <SelectValue placeholder={user.role?.name || "Select role"} />
                                                        </SelectTrigger>
                                                        <SelectContent className={theme.select.content}>
                                                            {roles.map((role) => (
                                                                <SelectItem key={role._id} value={role._id} className={theme.select.item}>
                                                                    {role.name}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        disabled={isUpdating || !hasSelectedRole}
                                                        onClick={() => handleUpdate(user._id)}
                                                        className={`${theme.button.primary} min-w-[80px]`}
                                                        size="sm"
                                                    >
                                                        {isUpdating ? (
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                        ) : (
                                                            "Update"
                                                        )}
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Legend */}
            <Card className={`${theme.bgCard} ${theme.border} shadow-sm`}>
                <CardContent className="p-4">
                    <div className="flex flex-wrap items-center gap-4 text-sm">
                        <span className={theme.textMuted}>Role Colors:</span>
                        <Badge variant="outline" className="border-blue-200 text-blue-700 bg-blue-50 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/30">
                            Admin
                        </Badge>
                        <Badge variant="outline" className="border-green-200 text-green-700 bg-green-50 dark:bg-green-500/20 dark:text-green-400 dark:border-green-500/30">
                            Teacher
                        </Badge>
                        <Badge variant="outline" className="border-purple-200 text-purple-700 bg-purple-50 dark:bg-purple-500/20 dark:text-purple-400 dark:border-purple-500/30">
                            Student
                        </Badge>
                        <Badge variant="outline" className="border-orange-200 text-orange-700 bg-orange-50 dark:bg-orange-500/20 dark:text-orange-400 dark:border-orange-500/30">
                            Parent
                        </Badge>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
