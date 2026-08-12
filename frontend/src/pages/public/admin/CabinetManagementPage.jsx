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
      <CabinetManager classes={classes} />
    </div>
  );
}