// pages/admin/directory/StaffManagementPage.jsx
import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users } from "lucide-react";
import StuffManager from "@/components/admin/directory/StuffManager";

export default function StaffManagementPage() {
  return (
    <div className="space-y-6">
      <StuffManager />
    </div>
  );
}