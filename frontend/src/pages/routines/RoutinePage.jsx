// pages/RoutinesPage.jsx
import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RoutineList from "@/components/routine/RoutineList";
import TodaysRoutine from "@/components/routine/TodaysRoutine";
import { useGetClassesQuery } from "@/features/apis/classesApi";
import { useGetSubjectsQuery } from "@/features/apis/subjectsApi";
import { useGetTeachersQuery } from "@/features/apis/teachersApi";
import WeeklyTimetable from "@/components/routine/WeeklyTimetable";
import Loader from "@/components/common/Loader";

export default function RoutinesPage() {
  const [selectedClass, setSelectedClass] = useState(null);

  const { data: classesData, isLoading: isClassLoading } = useGetClassesQuery();
  const { data: subjectsData, isLoading: isSubjectsLoading } = useGetSubjectsQuery();
  const { data: teachersData, isLoading: isTeachersLoading } = useGetTeachersQuery();

  const classes = classesData?.classes || classesData?.docs || [];
  const subjects = subjectsData?.subjects || subjectsData?.docs || [];
  const teachers = teachersData?.teachers || teachersData?.docs || [];

  useEffect(() => {
    if (classes.length > 0 && !selectedClass) {
      setSelectedClass(classes[0]);
    }
  }, [classes, selectedClass]);

  if (isClassLoading || isSubjectsLoading || isTeachersLoading) <Loader />

  console.log("classes :", classes)

  return (
    <div className="container space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Class Routine Management</h1>
          <p className="text-gray-600 mt-2">
            Manage and view class schedules, timetables, and daily routines
          </p>
        </div>
      </div>

      {/* Class Selector */}
      {classes.length > 0 && (
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium">Select Class:</label>
          <select
            className="border rounded-md px-3 py-2"
            value={selectedClass?._id || ""}
            onChange={(e) => setSelectedClass(classes.find(c => c._id === e.target.value))}
          >
            {classes.map(classItem => (
              <option key={classItem._id} value={classItem._id}>
                {classItem.name || ""} ({classItem?.section?.name || ""})
              </option>
            ))}
          </select>
        </div>
      )}

      <Tabs defaultValue="timetable" className="space-y-6">
        <TabsList>
          <TabsTrigger value="timetable">Weekly Timetable</TabsTrigger>
          <TabsTrigger value="manage">Manage Routines</TabsTrigger>
          <TabsTrigger value="today">Today's Schedule</TabsTrigger>
        </TabsList>

        <TabsContent value="timetable">
          <WeeklyTimetable
            classId={selectedClass?._id}
            className={selectedClass?.name}
            classes={classes}
            subjects={subjects}
            teachers={teachers}
          />
        </TabsContent>

        <TabsContent value="manage">
          <RoutineList
            classes={classes}
            subjects={subjects}
            teachers={teachers}
          />
        </TabsContent>

        <TabsContent value="today">
          {selectedClass ? (
            <TodaysRoutine classId={selectedClass._id} />
          ) : (
            <div className="text-center py-8 text-gray-500">
              Please select a class to view today's schedule
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}