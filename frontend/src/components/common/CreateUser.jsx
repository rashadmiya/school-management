import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateParentMutation, useCreateStudentMutation, useCreateTeacherMutation } from "@/features/apis/api";
import { useMeQuery } from "@/features/apis/authApi";
import { useState } from "react";
import { toast } from "react-toastify";

const CreateUser = () => {
  const { data: meData, isLoading } = useMeQuery();
  const user = meData?.user || null;

  const [role, setRole] = useState("teacher");
  const [formData, setFormData] = useState({ name: "", email: "", roll: "", password: "", phone: null });

  const [createTeacher, { isLoading: tLoading }] = useCreateTeacherMutation();
  const [createParent, { isLoading: pLoading }] = useCreateParentMutation();
  const [createStudent, { isLoading: sLoading }] = useCreateStudentMutation();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (role === "teacher") {
        await createTeacher({ name: formData.name, email: formData.email, password: formData.password }).unwrap();
      } else if (role === "parent") {
        await createParent({ name: formData.name, email: formData.email, phone: formData.phone, password: formData.password }).unwrap();
      } else if (role === "student") {
        await createStudent({ name: formData.name, rollNumber: formData.roll }).unwrap();
      }
      toast.success(`${role} created successfully!`);
      setFormData({ name: "", email: "", phone: "", roll: "", password: "" });
    } catch (error) {
      console.error(error);
      toast.error("Error creating user");
    }
  };

  const allowedRoles = user?.role?.name === "admin" ? ["teacher", "parent", "student"] : ["student"];

  return (
    <div className="max-w-lg mx-auto mt-8 bg-white shadow-md p-6 rounded-xl">
      <h2 className="text-xl font-semibold mb-4">Create New User</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Select value={role} onValueChange={setRole}>
          <SelectTrigger>
            <SelectValue placeholder="Select role" />
          </SelectTrigger>
          <SelectContent>
            {allowedRoles.map((r) => (
              <SelectItem key={r} value={r}>
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input name="name" placeholder="Name" value={formData.name} onChange={handleChange} required />

        {role !== "student" && (
          <Input name="email" placeholder="Email" type="email" value={formData.email} onChange={handleChange} required />
        )}

        {role === "student" && (
          <Input name="roll" placeholder="Student Roll" value={formData.roll} onChange={handleChange} required />
        )}
        {role === "parent" && (
          <Input name="phone" placeholder="Parent phone" value={formData.phone} onChange={handleChange} required />
        )}

        {role !== "student" && (
          <Input name="password" placeholder="Password" type="password" value={formData.password} onChange={handleChange} required />
        )}

        <Button type="submit" className="w-full" disabled={tLoading || pLoading || sLoading}>
          {tLoading || pLoading || sLoading ? "Creating..." : `Create ${role}`}
        </Button>
      </form>
    </div>
  );
};

export default CreateUser;
