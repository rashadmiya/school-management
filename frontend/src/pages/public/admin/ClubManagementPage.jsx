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
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-orange-600" />
            <div>
              <CardTitle className="text-2xl">Club Management</CardTitle>
              <CardDescription>
                Manage school clubs, members, and activities
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 mb-4">
            Active Clubs: <span className="font-semibold text-gray-700">0</span>
          </p>
        </CardContent>
      </Card>

      <ClubManager teachers={teachers} students={students} />
    </div>
  );
}