// pages/admin/directory/StaffManagementPage.jsx
import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users } from "lucide-react";
import StuffManager from "@/components/admin/directory/StuffManager";

export default function StaffManagementPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-blue-600" />
            <div>
              <CardTitle className="text-2xl">Staff Management</CardTitle>
              <CardDescription>
                Manage school staff members, their roles, and contact information
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 mb-4">
            Total Staff: <span className="font-semibold text-gray-700">0</span>
          </p>
        </CardContent>
      </Card>

      <StuffManager />
    </div>
  );
}