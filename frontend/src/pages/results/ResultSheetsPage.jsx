// pages/ResultSheetsPage.jsx
import ResultSheetGenerator from "@/components/resultSheets/ResultSheetGenerator";
import ResultSheetViewer from "@/components/resultSheets/ResultSheetViewer";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGetClassesQuery } from "@/features/apis/classesApi";
import { useGetResultSheetsQuery } from "@/features/apis/resultSheetsApi";
import { useAppSelector } from "@/features/store";
import { FileText } from "lucide-react";
import { useState } from "react";

export default function ResultSheetsPage() {
  const isDarkMode = useAppSelector((state) => state.global.isDarkMode);
  const [selectedSheet, setSelectedSheet] = useState(null);
  
  const { data: classesData } = useGetClassesQuery();
  const { data: sheetsData } = useGetResultSheetsQuery();

  const classes = classesData?.classes || classesData?.docs || [];
  const resultSheets = sheetsData?.resultSheets || [];

  // Theme-based classes
  const theme = {
    textPrimary: isDarkMode ? "text-white" : "text-gray-900",
    textSecondary: isDarkMode ? "text-gray-300" : "text-gray-700",
    textMuted: isDarkMode ? "text-gray-400" : "text-gray-500",
    textLight: isDarkMode ? "text-gray-500" : "text-gray-400",
    border: isDarkMode ? "border-gray-700" : "border-gray-200",
    bgCard: isDarkMode ? "bg-gray-900/50" : "bg-white",
    bgHover: isDarkMode ? "hover:bg-gray-800/50" : "hover:bg-gray-50",
    bgInput: isDarkMode ? "bg-gray-800" : "bg-white",
    inputBorder: isDarkMode ? "border-gray-700" : "border-gray-200",
    tabs: {
      list: isDarkMode ? "bg-gray-800" : "bg-gray-100",
      trigger: isDarkMode 
        ? "text-gray-400 data-[state=active]:bg-gray-700 data-[state=active]:text-white data-[state=active]:shadow-none" 
        : "text-gray-600 data-[state=active]:bg-white data-[state=active]:text-gray-900",
    },
    badge: {
      outline: isDarkMode ? "border-gray-700 text-gray-300" : "",
      published: isDarkMode ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-green-100 text-green-800",
      draft: isDarkMode ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" : "bg-yellow-100 text-yellow-800",
      selected: isDarkMode ? "bg-blue-500/20 text-blue-400 border-blue-500/30" : "bg-blue-50 border-blue-200",
    },
    sheetItem: {
      selected: isDarkMode ? "bg-blue-500/10 border-blue-500/30" : "bg-blue-50 border-blue-200",
      default: isDarkMode ? "border-gray-700 hover:bg-gray-800/50" : "border-gray-200 hover:bg-gray-50",
    }
  };

  return (
    <div className={`container mx-auto p-6 space-y-6 ${isDarkMode ? "text-white" : ""}`}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className={`text-3xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
            Result Sheets
          </h1>
          <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
            Generate, manage, and publish academic result sheets
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <Card className={`${isDarkMode ? "bg-gray-900/50 border-gray-800" : "bg-white border-gray-200"} shadow-sm`}>
            <CardHeader>
              <CardTitle className={isDarkMode ? "text-white" : "text-gray-900"}>
                Quick Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
                  Total Sheets
                </span>
                <Badge variant="outline" className={theme.badge.outline}>
                  {resultSheets.length}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
                  Published
                </span>
                <Badge variant="outline" className={theme.badge.published}>
                  {resultSheets.filter(s => s.isPublished).length}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
                  Drafts
                </span>
                <Badge variant="outline" className={theme.badge.draft}>
                  {resultSheets.filter(s => !s.isPublished).length}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Recent Sheets */}
          <Card className={`${isDarkMode ? "bg-gray-900/50 border-gray-800" : "bg-white border-gray-200"} shadow-sm`}>
            <CardHeader>
              <CardTitle className={isDarkMode ? "text-white" : "text-gray-900"}>
                Recent Sheets
              </CardTitle>
            </CardHeader>
            <CardContent>
              {resultSheets.length === 0 ? (
                <div className={`text-center py-4 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                  No result sheets found
                </div>
              ) : (
                resultSheets.slice(0, 5).map((sheet) => (
                  <div
                    key={sheet._id}
                    className={`flex items-center justify-between p-3 border rounded-lg mb-2 cursor-pointer transition-colors ${
                      selectedSheet?._id === sheet._id 
                        ? theme.sheetItem.selected 
                        : theme.sheetItem.default
                    }`}
                    onClick={() => setSelectedSheet(sheet)}
                  >
                    <div>
                      <p className={`font-medium text-sm ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                        {sheet.student?.name || 'Unknown Student'}
                      </p>
                      <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                        {sheet.term} {sheet.year} • {sheet.class?.name || 'Unknown Class'}
                      </p>
                    </div>
                    <Badge 
                      variant={sheet.isPublished ? "default" : "outline"}
                      className={sheet.isPublished ? theme.badge.published : theme.badge.outline}
                    >
                      {sheet.isPublished ? "Published" : "Draft"}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="generate" className="space-y-6">
            <TabsList className={theme.tabs.list}>
              <TabsTrigger 
                value="generate" 
                className={theme.tabs.trigger}
              >
                Generate Sheets
              </TabsTrigger>
              <TabsTrigger 
                value="view" 
                className={theme.tabs.trigger}
              >
                View Sheets
              </TabsTrigger>
              <TabsTrigger 
                value="publish" 
                className={theme.tabs.trigger}
              >
                Publish
              </TabsTrigger>
            </TabsList>

            <TabsContent value="generate">
              <ResultSheetGenerator 
                classes={classes} 
                isDarkMode={isDarkMode}
              />
            </TabsContent>

            <TabsContent value="view">
              {selectedSheet ? (
                <ResultSheetViewer 
                  resultSheet={selectedSheet} 
                  isDarkMode={isDarkMode}
                />
              ) : (
                <Card className={`${isDarkMode ? "bg-gray-900/50 border-gray-800" : "bg-white border-gray-200"} shadow-sm`}>
                  <CardContent className="p-6">
                    <div className={`text-center ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                      <FileText className={`w-12 h-12 ${isDarkMode ? "text-gray-600" : "text-gray-300"} mx-auto mb-4`} />
                      <p>Select a result sheet from the sidebar to view</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="publish">
              <Card className={`${isDarkMode ? "bg-gray-900/50 border-gray-800" : "bg-white border-gray-200"} shadow-sm`}>
                <CardContent className="p-6">
                  <div className={`text-center ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                    <FileText className={`w-12 h-12 ${isDarkMode ? "text-gray-600" : "text-gray-300"} mx-auto mb-4`} />
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