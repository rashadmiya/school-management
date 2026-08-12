// pages/admin/directory/ClubManagementPage.jsx
import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BookOpen } from "lucide-react";
import ClubManager from "@/components/admin/directory/ClubManager";
import { useGetTeachersQuery } from "@/features/apis/teachersApi";
import { useGetStudentsQuery } from "@/features/apis/studentsApi";

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