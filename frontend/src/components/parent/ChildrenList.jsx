// components/parent/ChildrenList.jsx
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, BookOpen, TrendingUp, Mail, Phone } from "lucide-react";
import { useGetParentChildrenQuery } from "@/features/apis/parentsApi";
import { Link, useSearchParams } from "react-router-dom";

export default function ChildrenList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedChild, setSelectedChild] = useState(searchParams.get("child") || "");
  
  const { data, isLoading } = useGetParentChildrenQuery();

  const children = data?.children || [];

  const handleChildSelect = (childId) => {
    setSelectedChild(childId);
    setSearchParams(childId ? { child: childId } : {});
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading children...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">My Children</h1>
        <p className="text-gray-600 mt-2">Manage and monitor your children's academic progress</p>
      </div>

      {children.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600">No Children Registered</h3>
            <p className="text-gray-500 mt-2">
              Contact your school administration to register your children.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Children List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Children ({children.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {children.map((child) => (
                    <div
                      key={child._id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedChild === child._id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                      onClick={() => handleChildSelect(child._id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Users className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{child.name}</p>
                          <p className="text-sm text-gray-500">
                            Class: {child.class?.name || 'Not assigned'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Child Details */}
          <div className="lg:col-span-2">
            {selectedChild ? (
              <Card>
                <CardHeader>
                  <CardTitle>
                    {children.find(c => c._id === selectedChild)?.name}'s Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <BookOpen className="w-5 h-5 text-blue-600" />
                          <div>
                            <p className="font-medium">Academic Information</p>
                            <p className="text-sm text-gray-500">
                              Roll No: {children.find(c => c._id === selectedChild)?.rollNumber}
                            </p>
                            <p className="text-sm text-gray-500">
                              Class: {children.find(c => c._id === selectedChild)?.class?.name || 'Not assigned'}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <TrendingUp className="w-5 h-5 text-green-600" />
                          <div>
                            <p className="font-medium">Performance</p>
                            <p className="text-sm text-gray-500">View academic progress</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="grid grid-cols-2 gap-4">
                      <Button variant="outline" className="flex items-center gap-2" asChild>
                        <Link to={`/parent/attendance?child=${selectedChild}`}>
                          <TrendingUp className="w-4 h-4" />
                          View Attendance
                        </Link>
                      </Button>
                      <Button variant="outline" className="flex items-center gap-2" asChild>
                        <Link to={`/parent/results?child=${selectedChild}`}>
                          <BookOpen className="w-4 h-4" />
                          View Results
                        </Link>
                      </Button>
                    </div>

                    {/* Contact Information */}
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-semibold mb-3">School Contact</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-gray-500" />
                          <span>Contact school office for inquiries</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-gray-500" />
                          <span>Email school administration</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600">Select a Child</h3>
                  <p className="text-gray-500 mt-2">
                    Click on a child's name to view their details and academic information.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}