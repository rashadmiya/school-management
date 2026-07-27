// pages/AttendancePage.jsx - UPDATED
import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AttendanceMarker from "@/components/attendance/AttendanceMark";
import AttendanceSummary from "@/components/attendance/AttendanceSummary";
import AttendanceDashboard from "@/components/attendance/AttendanceDashboard"; // Updated component
import { useGetClassesQuery } from "@/features/apis/classesApi";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Users, TrendingUp, Home, BarChart3, BookMarked, Settings } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function AttendancePage() {
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "dashboard";

  const { data: classesData } = useGetClassesQuery();
  const classes = classesData?.classes || classesData?.docs || [];

  useEffect(() => {
    if (classes.length > 0 && !selectedClass) {
      setSelectedClass(classes[0]);
    }
  }, [classes, selectedClass]);

  const handleTabChange = (tab) => {
    setSearchParams({ tab });
  };

  const handleClassSelect = (classItem, periodNumber) => {
    setSelectedClass(classItem);
    setSelectedPeriod(periodNumber);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Attendance Management</h1>
          <p className="text-gray-600 mt-2">
            Mark and monitor student attendance with detailed analytics
          </p>
        </div>
      </div>

      {/* Class Selector - Only show when needed */}
      {(activeTab === "mark" || activeTab === "summary" || activeTab === "reports") && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium">Select Class:</label>
              <select
                className="border rounded-md px-3 py-2 flex-1"
                value={selectedClass?._id || ""}
                onChange={(e) => setSelectedClass(classes.find(c => c._id === e.target.value))}
              >
                {classes.map(classItem => (
                  <option key={classItem._id} value={classItem._id}>
                    {classItem.name} {classItem.section ? `- ${classItem.section.name}` : ''} ({classItem.students?.length || 0} students)
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="grid grid-cols-6">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <Home className="w-4 h-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="mark" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Mark Attendance
          </TabsTrigger>
          <TabsTrigger value="summary" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            View Summary
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Reports
          </TabsTrigger>
          <TabsTrigger value="bulk" className="flex items-center gap-2">
            <BookMarked className="w-4 h-4" />
            Bulk
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <AttendanceDashboard 
            onTabChange={handleTabChange}
            onClassSelect={handleClassSelect}
            selectedClassId={selectedClass?._id}
          />
        </TabsContent>

        <TabsContent value="mark">
          {selectedClass ? (
            <AttendanceMarker classId={selectedClass._id} periodNumber={selectedPeriod} />
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Please select a class to mark attendance</p>
                <Button 
                  onClick={() => handleTabChange("dashboard")}
                  className="mt-4"
                  variant="outline"
                >
                  Go to Dashboard
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="summary">
          {selectedClass ? (
            <AttendanceSummary classId={selectedClass._id} />
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Please select a class to view attendance summary</p>
                <Button 
                  onClick={() => handleTabChange("dashboard")}
                  className="mt-4"
                  variant="outline"
                >
                  Go to Dashboard
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="reports">
          <Card>
            <CardContent className="p-6">
              <div className="text-center py-8">
                <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Attendance Reports</h3>
                <p className="text-gray-500 mb-4">Generate detailed attendance reports and analytics</p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button variant="outline">
                    Monthly Reports
                  </Button>
                  <Button variant="outline">
                    Student-wise Reports
                  </Button>
                  <Button variant="outline">
                    Export to Excel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bulk">
          <Card>
            <CardContent className="p-6">
              <div className="text-center py-8">
                <BookMarked className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Bulk Attendance Operations</h3>
                <p className="text-gray-500 mb-4">Mark attendance for multiple classes or periods at once</p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button variant="outline">
                    Bulk Mark by Date
                  </Button>
                  <Button variant="outline">
                    Import from CSV
                  </Button>
                  <Button variant="outline">
                    Copy Previous Day
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardContent className="p-6">
              <div className="text-center py-8">
                <Settings className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Attendance Settings</h3>
                <p className="text-gray-500 mb-4">Configure attendance rules, notifications, and preferences</p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button variant="outline">
                    Period Settings
                  </Button>
                  <Button variant="outline">
                    Notification Settings
                  </Button>
                  <Button variant="outline">
                    Holiday Settings
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// // pages/AttendancePage.jsx - UPDATED with dashboard
// import React, { useState, useEffect } from "react";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import AttendanceMarker from "@/components/attendance/AttendanceMark";
// import AttendanceSummary from "@/components/attendance/AttendanceSummary";
// import AttendanceDashboard from "@/components/attendance/AttendanceDashboard"; // New component
// import { useGetClassesQuery } from "@/features/apis/classesApi";
// import { Card, CardContent } from "@/components/ui/card";
// import { Calendar, Users, TrendingUp, Home, BarChart3, BookMarked } from "lucide-react";

// export default function AttendancePage() {
//   const [selectedClass, setSelectedClass] = useState(null);
//   const [activeTab, setActiveTab] = useState("dashboard");

//   const { data: classesData } = useGetClassesQuery();
//   const classes = classesData?.classes || classesData?.docs || [];

//   useEffect(() => {
//     if (classes.length > 0 && !selectedClass) {
//       setSelectedClass(classes[0]);
//     }
//   }, [classes, selectedClass]);

//   return (
//     <div className="container mx-auto p-6 space-y-6">
//       <div className="flex justify-between items-center">
//         <div>
//           <h1 className="text-3xl font-bold">Attendance Management</h1>
//           <p className="text-gray-600 mt-2">
//             Mark and monitor student attendance with detailed analytics
//           </p>
//         </div>
//       </div>

//       {/* Class Selector - Only show when needed */}
//       {(activeTab === "mark" || activeTab === "summary" || activeTab === "reports") && (
//         <Card>
//           <CardContent className="p-4">
//             <div className="flex items-center gap-4">
//               <label className="text-sm font-medium">Select Class:</label>
//               <select
//                 className="border rounded-md px-3 py-2 flex-1"
//                 value={selectedClass?._id || ""}
//                 onChange={(e) => setSelectedClass(classes.find(c => c._id === e.target.value))}
//               >
//                 {classes.map(classItem => (
//                   <option key={classItem._id} value={classItem._id}>
//                     {classItem.name} {classItem.section ? `- ${classItem.section.name}` : ''} ({classItem.students?.length || 0} students)
//                   </option>
//                 ))}
//               </select>
//             </div>
//           </CardContent>
//         </Card>
//       )}

//       <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
//         <TabsList className="grid grid-cols-5">
//           <TabsTrigger value="dashboard" className="flex items-center gap-2">
//             <Home className="w-4 h-4" />
//             Dashboard
//           </TabsTrigger>
//           <TabsTrigger value="mark" className="flex items-center gap-2">
//             <Calendar className="w-4 h-4" />
//             Mark Attendance
//           </TabsTrigger>
//           <TabsTrigger value="summary" className="flex items-center gap-2">
//             <TrendingUp className="w-4 h-4" />
//             View Summary
//           </TabsTrigger>
//           <TabsTrigger value="reports" className="flex items-center gap-2">
//             <BarChart3 className="w-4 h-4" />
//             Reports
//           </TabsTrigger>
//           <TabsTrigger value="bulk" className="flex items-center gap-2">
//             <BookMarked className="w-4 h-4" />
//             Bulk Actions
//           </TabsTrigger>
//         </TabsList>

//         <TabsContent value="dashboard">
//           <AttendanceDashboard />
//         </TabsContent>

//         <TabsContent value="mark">
//           {selectedClass ? (
//             <AttendanceMarker classId={selectedClass._id} />
//           ) : (
//             <Card>
//               <CardContent className="p-6 text-center">
//                 <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
//                 <p className="text-gray-500">Please select a class to mark attendance</p>
//               </CardContent>
//             </Card>
//           )}
//         </TabsContent>

//         <TabsContent value="summary">
//           {selectedClass ? (
//             <AttendanceSummary classId={selectedClass._id} />
//           ) : (
//             <Card>
//               <CardContent className="p-6 text-center">
//                 <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
//                 <p className="text-gray-500">Please select a class to view attendance summary</p>
//               </CardContent>
//             </Card>
//           )}
//         </TabsContent>

//         <TabsContent value="reports">
//           <div className="text-center py-8 text-gray-500">
//             <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
//             <h3 className="text-lg font-medium mb-2">Advanced Attendance Reports</h3>
//             <p>Detailed attendance reports and analytics coming soon.</p>
//           </div>
//         </TabsContent>

//         <TabsContent value="bulk">
//           <div className="text-center py-8 text-gray-500">
//             <BookMarked className="w-16 h-16 text-gray-300 mx-auto mb-4" />
//             <h3 className="text-lg font-medium mb-2">Bulk Attendance Actions</h3>
//             <p>Bulk attendance marking and management features coming soon.</p>
//           </div>
//         </TabsContent>
//       </Tabs>
//     </div>
//   );
// }