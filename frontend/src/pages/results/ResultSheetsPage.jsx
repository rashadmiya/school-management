// pages/ResultSheetsPage.jsx
import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ResultSheetGenerator from "@/components/resultSheets/ResultSheetGenerator";
import ResultSheetViewer from "@/components/resultSheets/ResultSheetViewer";
import { useGetClassesQuery } from "@/features/apis/classesApi";
import { useGetResultSheetsQuery } from "@/features/apis/resultSheetsApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Users, Download, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function ResultSheetsPage() {
  const [selectedSheet, setSelectedSheet] = useState(null);
  
  const { data: classesData } = useGetClassesQuery();
  const { data: sheetsData } = useGetResultSheetsQuery();

  const classes = classesData?.classes || classesData?.docs || [];
  const resultSheets = sheetsData?.resultSheets || [];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Result Sheets</h1>
          <p className="text-gray-600 mt-2">
            Generate, manage, and publish academic result sheets
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Sheets</span>
                <Badge variant="outline">{resultSheets.length}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Published</span>
                <Badge variant="outline" className="bg-green-100 text-green-800">
                  {resultSheets.filter(s => s.isPublished).length}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Drafts</span>
                <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                  {resultSheets.filter(s => !s.isPublished).length}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Recent Sheets */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Sheets</CardTitle>
            </CardHeader>
            <CardContent>
              {resultSheets.slice(0, 5).map((sheet) => (
                <div
                  key={sheet._id}
                  className={`flex items-center justify-between p-3 border rounded-lg mb-2 cursor-pointer hover:bg-gray-50 ${
                    selectedSheet?._id === sheet._id ? 'bg-blue-50 border-blue-200' : ''
                  }`}
                  onClick={() => setSelectedSheet(sheet)}
                >
                  <div>
                    <p className="font-medium text-sm">{sheet.student.name}</p>
                    <p className="text-xs text-gray-500">
                      {sheet.term} {sheet.year} • {sheet.class.name}
                    </p>
                  </div>
                  <Badge variant={sheet.isPublished ? "default" : "outline"}>
                    {sheet.isPublished ? "Published" : "Draft"}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="generate" className="space-y-6">
            <TabsList>
              <TabsTrigger value="generate">Generate Sheets</TabsTrigger>
              <TabsTrigger value="view">View Sheets</TabsTrigger>
              <TabsTrigger value="publish">Publish</TabsTrigger>
            </TabsList>

            <TabsContent value="generate">
              <ResultSheetGenerator classes={classes} />
            </TabsContent>

            <TabsContent value="view">
              <ResultSheetViewer resultSheet={selectedSheet} />
            </TabsContent>

            <TabsContent value="publish">
              <Card>
                <CardContent className="p-6">
                  <div className="text-center text-gray-500">
                    <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p>Result sheet publication management coming soon...</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}