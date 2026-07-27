// pages/public/directory/DirectoryPage.jsx
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Building, Users, GraduationCap, BookOpen, Users2, BarChart3, Filter } from "lucide-react";
import { useGetDirectoryStatsQuery } from "@/features/apis/directoryApi";
import StuffTab from "./StuffTab";
import ClubsTab from "./ClubsTab";
import CabinetTab from "./CabinetTab";
import CommitteeTab from "./CommitteeTab";

export default function DirectoryPage() {
  const [activeTab, setActiveTab] = useState("stuff");
  const { data: statsData, isLoading: statsLoading } = useGetDirectoryStatsQuery();

  const stats = statsData?.statistics || {};
  const currentYear = new Date().getFullYear();
  const currentSession = `${currentYear}-${currentYear + 1}`;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">School Directory</h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Meet our dedicated staff, management committee, student leaders, and club activities
        </p>
      </div>

      {/* Statistics */}
      {!statsLoading && (
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 mb-1">
                  {stats.staff?.active || 0}
                </div>
                <div className="text-sm text-gray-600">Staff Members</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600 mb-1">
                  {stats.committee?.active || 0}
                </div>
                <div className="text-sm text-gray-600">Committee</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 mb-1">
                  {stats.cabinet?.active || 0}
                </div>
                <div className="text-sm text-gray-600">Student Cabinet</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600 mb-1">
                  {stats.clubs?.active || 0}
                </div>
                <div className="text-sm text-gray-600">Active Clubs</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-indigo-600 mb-1">
                  {stats.sections?.active || 0}
                </div>
                <div className="text-sm text-gray-600">Class Sections</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Directory Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-2 md:grid-cols-5">
          <TabsTrigger value="stuff" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Staff</span>
          </TabsTrigger>
          <TabsTrigger value="committee" className="flex items-center gap-2">
            <Building className="w-4 h-4" />
            <span className="hidden sm:inline">Committee</span>
          </TabsTrigger>
          <TabsTrigger value="cabinet" className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4" />
            <span className="hidden sm:inline">Cabinet</span>
          </TabsTrigger>
          <TabsTrigger value="clubs" className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            <span className="hidden sm:inline">Clubs</span>
          </TabsTrigger>
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stuff">
          <StuffTab />
        </TabsContent>

        <TabsContent value="committee">
          <CommitteeTab />
        </TabsContent>

        <TabsContent value="cabinet">
          <CabinetTab />
        </TabsContent>

        <TabsContent value="clubs">
          <ClubsTab />
        </TabsContent>

        <TabsContent value="overview">
          <Card>
            <CardContent className="p-6">
              <div className="text-center py-8">
                <BarChart3 className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">Directory Overview</h3>
                <p className="text-gray-600 mb-6">
                  Comprehensive view of all directory statistics and analytics
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                  <Card>
                    <CardContent className="p-4">
                      <h4 className="font-semibold mb-2">Current Session</h4>
                      <Badge variant="outline" className="text-lg">
                        {currentSession}
                      </Badge>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <h4 className="font-semibold mb-2">Active Members</h4>
                      <div className="text-2xl font-bold">
                        {Object.values(stats).reduce((sum, stat) => sum + (stat?.active || 0), 0)}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}