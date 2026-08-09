// pages/SubjectsPage.jsx
import React, { useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SubjectList from "@/components/subject/SubjectList";
import { useGetClassesQuery } from "@/features/apis/classesApi";
import Loader from "@/components/common/Loader";

export default function SubjectsPage() {
  const { data: classesData, isLoading: isClassesLoading } = useGetClassesQuery();

  const classes = classesData?.classes || [];

  if (isClassesLoading) {
    return <Loader />;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Subject Management</h1>
          <p className="text-gray-600 mt-2">
            Create and manage subjects, assign to classes, and track subject-related activities
          </p>
        </div>
      </div>

      <Tabs defaultValue="manage" className="space-y-6">
        <TabsList>
          <TabsTrigger value="manage">Manage Subjects</TabsTrigger>
          <TabsTrigger value="assignments">Subject Assignments</TabsTrigger>
          <TabsTrigger value="reports">Subject Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="manage">
          <SubjectList classes={classes} />
        </TabsContent>

        <TabsContent value="assignments">
          <div className="text-center py-8 text-gray-500">
            Subject assignments and tracking coming soon...
          </div>
        </TabsContent>

        <TabsContent value="reports">
          <div className="text-center py-8 text-gray-500">
            Subject reports and analytics coming soon...
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}