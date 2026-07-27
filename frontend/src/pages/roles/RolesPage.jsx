import { useState } from "react";
import {
  useGetRolesQuery,
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useDeleteRoleMutation,
} from "@/features/apis/roleApi";
import {
  Button,
} from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Loader2, Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "react-toastify";

export default function RolesPage() {
  const { data, isLoading } = useGetRolesQuery();
  const [createRole] = useCreateRoleMutation();
  const [updateRole] = useUpdateRoleMutation();
  const [deleteRole] = useDeleteRoleMutation();

  const [open, setOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [roleName, setRoleName] = useState("");
  const [permissions, setPermissions] = useState("");

  const roles = data?.roles || [];

  const handleOpen = (role = null) => {
    if (role) {
      setEditingRole(role);
      setRoleName(role.name);
      setPermissions(role.permissions?.join(", ") || "");
    } else {
      setEditingRole(null);
      setRoleName("");
      setPermissions("");
    }
    setOpen(true);
  };

  const handleSave = async () => {
    try {
      const payload = {
        name: roleName.trim(),
        permissions: permissions
          ? permissions.split(",").map((p) => p.trim())
          : [],
      };

      if (editingRole) {
        await updateRole({ id: editingRole._id, ...payload }).unwrap();
        toast.success("Role updated successfully");
      } else {
        await createRole(payload).unwrap();
        toast.success("Role created successfully");
      }

      setOpen(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to save role");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this role?")) return;
    try {
      await deleteRole(id).unwrap();
      toast.success("Role deleted successfully");
    } catch {
      toast.error("Failed to delete role");
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Role Management</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpen()} className="flex items-center gap-2">
              <Plus size={16} /> Create Role
            </Button>
          </DialogTrigger>

          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingRole ? "Edit Role" : "Create Role"}</DialogTitle>
            </DialogHeader>

            <div className="space-y-3 py-2">
              <div>
                <label className="text-sm font-medium">Role Name</label>
                <Input
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  placeholder="e.g. teacher, admin, student"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Permissions (comma separated)</label>
                <Input
                  value={permissions}
                  onChange={(e) => setPermissions(e.target.value)}
                  placeholder="create, edit, delete"
                />
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSave}>
                  {editingRole ? "Update Role" : "Create Role"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* ROLE TABLE */}
      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="animate-spin" />
        </div>
      ) : (
        <div className="overflow-x-auto border rounded-md bg-white dark:bg-gray-900">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
              <tr>
                <th className="px-4 py-2 text-left">Name</th>
                <th className="px-4 py-2 text-left">Permissions</th>
                <th className="px-4 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {roles.length === 0 ? (
                <tr>
                  <td colSpan="3" className="text-center py-8 text-gray-500">
                    No roles found.
                  </td>
                </tr>
              ) : (
                roles.map((role) => (
                  <tr
                    key={role._id}
                    className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <td className="px-4 py-2">{role.name}</td>
                    <td className="px-4 py-2 text-gray-600 dark:text-gray-400">
                      {role.permissions?.join(", ") || "-"}
                    </td>
                    <td className="px-4 py-2 text-right space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpen(role)}
                      >
                        <Pencil size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(role._id)}
                      >
                        <Trash2 size={16} className="text-red-500" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
