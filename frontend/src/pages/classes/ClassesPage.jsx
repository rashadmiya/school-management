// pages/ClassesPage.jsx
import React, { useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ClassList from "@/components/class/ClassList";
import { useGetTeachersQuery } from "@/features/apis/teachersApi";
import { useGetSubjectsQuery } from "@/features/apis/subjectsApi";
import Loader from "@/components/common/Loader";

export default function ClassesPage() {
  const { data: teachersData, isLoading: isTeachersLoading } = useGetTeachersQuery();
  const { data: subjectsData, isLoading: isSubjectsLoading } = useGetSubjectsQuery();

  const teachers = teachersData?.teachers || teachersData?.docs || [];
  const subjects = subjectsData?.subjects || subjectsData?.docs || [];

  if (isTeachersLoading || isSubjectsLoading) {
    return <Loader />
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Class Management</h1>
          <p className="text-gray-600 mt-2">
            Create and manage classes, assign supervisors, and organize students
          </p>
        </div>
      </div>

      <Tabs defaultValue="manage" className="space-y-6">
        <TabsList>
          <TabsTrigger value="manage">Manage Classes</TabsTrigger>
          <TabsTrigger value="overview">Class Overview</TabsTrigger>
        </TabsList>

        <TabsContent value="manage">
          <ClassList
            teachers={teachers}
            subjects={subjects}
          />
        </TabsContent>

        <TabsContent value="overview">
          <div className="text-center py-8 text-gray-500">
            Class overview and analytics coming soon...
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}