// pages/admin/directory/CommitteeManagementPage.jsx
import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Building } from "lucide-react";
import CommitteeManager from "@/components/admin/directory/CommitteeManager";

export default function CommitteeManagementPage() {
  return (
    <div className="space-y-6">
      <CommitteeManager />
    </div>
  );
}