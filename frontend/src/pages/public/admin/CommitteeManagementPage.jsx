// pages/admin/directory/CommitteeManagementPage.jsx
import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Building } from "lucide-react";
import CommitteeManager from "@/components/admin/directory/CommitteeManager";

export default function CommitteeManagementPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Building className="w-6 h-6 text-purple-600" />
            <div>
              <CardTitle className="text-2xl">Committee Management</CardTitle>
              <CardDescription>
                Manage school management committee members and their roles
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 mb-4">
            Committee Members: <span className="font-semibold text-gray-700">0</span>
          </p>
        </CardContent>
      </Card>

      <CommitteeManager />
    </div>
  );
}