// pages/admin/directory/CabinetManagementPage.jsx
import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users2 } from "lucide-react";
import CabinetManager from "@/components/admin/directory/CabinetManager";
import { useGetClassesQuery } from "@/features/apis/classesApi";

export default function CabinetManagementPage() {
  const { data: classesData } = useGetClassesQuery();
  const classes = classesData?.classes || [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Users2 className="w-6 h-6 text-green-600" />
            <div>
              <CardTitle className="text-2xl">Student Cabinet Management</CardTitle>
              <CardDescription>
                Manage student cabinet members, positions, and assignments
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 mb-4">
            Cabinet Members: <span className="font-semibold text-gray-700">0</span>
          </p>
        </CardContent>
      </Card>

      <CabinetManager classes={classes} />
    </div>
  );
}