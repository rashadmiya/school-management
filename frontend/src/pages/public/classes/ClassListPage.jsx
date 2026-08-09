// pages/public/classes/ClassListPage.jsx
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Users, Calendar, Clock, ChevronRight, Layers } from "lucide-react";
import { useGetClassesQuery } from "@/features/apis/classesApi";
// import { useGetClassesQuery } from "@/features/apis/directoryApi";

export default function ClassListPage() {
  const { data, isLoading } = useGetClassesQuery();
  const classes = data?.classes || [];

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Classes</h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Explore our comprehensive academic programs and class offerings
        </p>
      </div>

      {classes.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <BookOpen className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-600 text-lg">No classes found.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classes.map((cls) => (
              <Card key={cls._id} className="hover:shadow-xl transition-all hover:-translate-y-1">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <BookOpen className="w-6 h-6 text-blue-600" />
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {cls.sectionCount || 0} Sections
                    </Badge>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{cls.name}</h3>
                  {cls.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{cls.description}</p>
                  )}
                  <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>{cls.studentCount || 0} Students</span>
                    </div>
                    <div className="flex items-center gap-1 text-blue-600">
                      <span className="font-medium">View Details</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Stats */}
          <Card className="mt-8">
            <CardContent className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{classes.length}</div>
                  <div className="text-sm text-gray-600">Total Classes</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {classes.reduce((sum, c) => sum + (c.sectionCount || 0), 0)}
                  </div>
                  <div className="text-sm text-gray-600">Total Sections</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {classes.reduce((sum, c) => sum + (c.studentCount || 0), 0)}
                  </div>
                  <div className="text-sm text-gray-600">Total Students</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {classes.filter(c => c.description).length}
                  </div>
                  <div className="text-sm text-gray-600">With Description</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}