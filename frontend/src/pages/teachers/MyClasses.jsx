// components/teacher/MyClasses.jsx
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, BookOpen, Calendar, Eye } from "lucide-react";
import { useGetTeacherClassesQuery, useGetTeachersQuery } from "@/features/apis/teachersApi";
import { Link } from "react-router-dom";

export default function MyClasses() {
  const { data, isLoading } = useGetTeacherClassesQuery();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading your classes...</div>
        </CardContent>
      </Card>
    );
  }

  const classes = data?.classes || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">My Classes</h1>
          <p className="text-gray-600 mt-2">Manage your assigned classes and students</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{classes.length}</p>
                <p className="text-sm text-gray-600">Total Classes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {classes.reduce((total, cls) => total + (cls.students?.length || 0), 0)}
                </p>
                <p className="text-sm text-gray-600">Total Students</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <BookOpen className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {classes.reduce((total, cls) => total + (cls.subjects?.length || 0), 0)}
                </p>
                <p className="text-sm text-gray-600">Subjects Taught</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Classes Table */}
      <Card>
        <CardHeader>
          <CardTitle>Assigned Classes</CardTitle>
        </CardHeader>
        <CardContent>
          {classes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p>No classes assigned to you yet.</p>
              <p className="text-sm">Contact administrator to get assigned to classes.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Class Name</TableHead>
                  <TableHead>Students</TableHead>
                  <TableHead>Subjects</TableHead>
                  <TableHead>Schedule</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {classes.map((classItem) => (
                  <TableRow key={classItem._id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        {classItem.name}
                        {classItem.section && (
                          <Badge variant="outline" className="text-xs">
                            {classItem.section.name}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-500" />
                        <span>{classItem.students?.length || 0} students</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {classItem.subjects?.slice(0, 2).map((subject, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {subject.name}
                          </Badge>
                        ))}
                        {classItem.subjects?.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{classItem.subjects.length - 2} more
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>View Schedule</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link
                            // to={`/teacher/classes/${classItem._id}`}
                            to={`/classes/${classItem._id}`}
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            View
                          </Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/teacher/attendance?class=${classItem._id}`}>
                            <Users className="w-3 h-3 mr-1" />
                            Attendance
                          </Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}