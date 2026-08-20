// pages/admin/directory/ClubManagementPage.jsx
import ClubManager from "@/components/admin/directory/ClubManager";
import { useGetStudentsQuery } from "@/features/apis/studentsApi";
import { useGetTeachersQuery } from "@/features/apis/teachersApi";

export default function ClubManagementPage() {
  const { data: teachersData } = useGetTeachersQuery();
  const { data: studentsData } = useGetStudentsQuery();

  const teachers = teachersData?.teachers || teachersData?.docs || [];
  const students = studentsData?.students || studentsData?.docs || [];

  return (
    <div className="space-y-6">
      <ClubManager teachers={teachers} students={students} />
    </div>
  );
}