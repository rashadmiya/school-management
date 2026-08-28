// components/parent/ParentDashboard.jsx
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGetParentDashboardQuery } from "@/features/apis/parentsApi";
import { BookOpen, Calendar, TrendingUp, User, Users } from "lucide-react";
import { Link } from "react-router-dom";

export default function ParentDashboard() {
  const { data, isLoading } = useGetParentDashboardQuery();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading dashboard...</div>
        </CardContent>
      </Card>
    );
  }

  const { dashboard } = data || {};
  const { parent, children, statistics, payments, recentAttendance, recentResults } = dashboard || {};
  const { childAttendanceStats = {} } = statistics || {};
  const { summary: paymentSummary, recent: recentPayments } = payments || {};

  // Calculate overall attendance average
  const calculateOverallAttendance = () => {
    if (!children || children.length === 0) return 0;
    
    const totalPercentage = children.reduce((sum, child) => {
      return sum + (childAttendanceStats[child._id]?.attendancePercentage || 0);
    }, 0);
    
    return Math.round(totalPercentage / children.length);
  };

  const overallAttendance = calculateOverallAttendance();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Welcome, {parent?.name}!</h1>
          <p className="text-gray-600 mt-2">Monitor your children's academic progress and payments</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Today</p>
          <p className="font-semibold">{new Date().toLocaleDateString()}</p>
        </div>
      </div>

      {/* Payment Alert */}
      {paymentSummary?.totalOutstanding > 0 && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground text-lg">৳</span>
            <span className="font-medium text-yellow-800">
              Total Outstanding Fees: ${paymentSummary.totalOutstanding}
            </span>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{statistics?.totalChildren || 0}</p>
                <p className="text-sm text-gray-600">Children</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <BookOpen className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{statistics?.childrenWithClasses || 0}</p>
                <p className="text-sm text-gray-600">In School</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{overallAttendance}%</p>
                <p className="text-sm text-gray-600">Avg Attendance</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Calendar className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{recentAttendance?.length || 0}</p>
                <p className="text-sm text-gray-600">Recent Records</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-100 rounded-lg">
                <span className="h-4 w-4 text-indigo-400 text-muted-foreground text-lg">৳</span>
              </div>
              <div>
                <p className="text-2xl font-bold">{paymentSummary?.collectionRate || 0}%</p>
                <p className="text-sm text-gray-600">Payment Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payment Summary */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <span className="h-6 w-6 text-muted-foreground text-lg">৳</span>
              Payment Summary
            </CardTitle>
            <Badge variant={paymentSummary?.totalOutstanding > 0 ? "destructive" : "default"}>
              {paymentSummary?.totalOutstanding > 0 ? "Pending" : "Cleared"}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 mb-4">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Due:</span>
                <span className="font-semibold">${paymentSummary?.totalDue || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Paid:</span>
                <span className="font-semibold text-green-600">${paymentSummary?.totalPaid || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Outstanding:</span>
                <span className={`font-semibold ${
                  paymentSummary?.totalOutstanding > 0 ? "text-red-600" : "text-gray-600"
                }`}>
                  ${paymentSummary?.totalOutstanding || 0}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t">
                <span className="text-sm text-gray-600">Collection Rate:</span>
                <span className="font-semibold">{paymentSummary?.collectionRate || 0}%</span>
              </div>
            </div>

            {/* Recent Payments */}
            {recentPayments && recentPayments.length > 0 && (
              <div className="mt-4">
                <h4 className="font-semibold mb-2 text-sm">Recent Payments</h4>
                <div className="space-y-2">
                  {recentPayments.slice(0, 3).map((payment) => (
                    <div key={payment._id} className="flex justify-between items-center p-2 border rounded text-sm">
                      <div>
                        <p className="font-medium">{payment.student?.name}</p>
                        <p className="text-gray-500 text-xs capitalize">
                          {payment.feeType} • {new Date(payment.paidDate).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant="outline" className="bg-green-100">
                        ${payment.paidAmount}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button variant="outline" className="w-full mt-4" asChild>
              <Link to="/parent/payments">View Payment Details</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Children Attendance Overview */}
        {children && children.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Children's Attendance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {children.map((child) => {
                  const stats = childAttendanceStats[child._id] || {};
                  const performance = stats.attendancePercentage >= 90 ? 'Excellent' :
                                    stats.attendancePercentage >= 75 ? 'Good' :
                                    stats.attendancePercentage >= 60 ? 'Average' : 'Needs Improvement';

                  return (
                    <div key={child._id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-sm">{child.name}</h4>
                        <Badge variant="outline" className="text-xs">{child.class?.name || 'No Class'}</Badge>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Attendance:</span>
                          <span className="font-bold">{stats.attendancePercentage || 0}%</span>
                        </div>
                        
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              stats.attendancePercentage >= 90 ? 'bg-green-500' :
                              stats.attendancePercentage >= 75 ? 'bg-yellow-500' :
                              'bg-red-500'
                            }`}
                            style={{ width: `${stats.attendancePercentage || 0}%` }}
                          ></div>
                        </div>
                        
                        <div className="grid grid-cols-4 gap-1 text-xs">
                          <div className="text-center p-1 bg-green-50 rounded">
                            <div className="font-semibold text-green-600">{stats.presentRecords || 0}</div>
                            <div className="text-gray-500">Present</div>
                          </div>
                          <div className="text-center p-1 bg-red-50 rounded">
                            <div className="font-semibold text-red-600">{stats.absentRecords || 0}</div>
                            <div className="text-gray-500">Absent</div>
                          </div>
                          <div className="text-center p-1 bg-yellow-50 rounded">
                            <div className="font-semibold text-yellow-600">{stats.lateRecords || 0}</div>
                            <div className="text-gray-500">Late</div>
                          </div>
                          <div className="text-center p-1 bg-orange-50 rounded">
                            <div className="font-semibold text-orange-600">{stats.halfDayRecords || 0}</div>
                            <div className="text-gray-500">Half Day</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Recent Results */}
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Recent Results
                </h4>
                {recentResults?.length === 0 ? (
                  <p className="text-sm text-gray-500">No recent results</p>
                ) : (
                  <div className="space-y-2">
                    {recentResults?.slice(0, 3).map((result) => (
                      <div key={result._id} className="flex justify-between items-center text-sm p-2 border rounded">
                        <div>
                          <p className="font-medium">{result.student.name}</p>
                          <p className="text-gray-500">{result.exam.title} - {result.subject?.name}</p>
                        </div>
                        <Badge variant="outline">
                          {result.marksObtained}/{result.exam.totalMarks}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Attendance */}
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Recent Attendance
                </h4>
                {recentAttendance?.length === 0 ? (
                  <p className="text-sm text-gray-500">No recent attendance</p>
                ) : (
                  <div className="space-y-2">
                    {recentAttendance?.slice(0, 3).map((record) => (
                      <div key={record._id} className="flex justify-between items-center text-sm p-2 border rounded">
                        <div>
                          <p className="font-medium">{record.student.name}</p>
                          <p className="text-gray-500">
                            {new Date(record.date).toLocaleDateString()} - {record.subject?.name}
                          </p>
                        </div>
                        <Badge 
                          variant={
                            record.status === 'present' ? 'default' : 
                            record.status === 'absent' ? 'destructive' : 
                            record.status === 'late' ? 'secondary' : 'outline'
                          }
                        >
                          {record.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Children List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>My Children</CardTitle>
          <Badge variant="outline">{children?.length || 0}</Badge>
        </CardHeader>
        <CardContent>
          {children?.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p>No children registered</p>
              <p className="text-sm">Contact school administration to add children</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {children?.map((child) => {
                const stats = childAttendanceStats[child._id] || {};
                
                return (
                  <div key={child._id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">{child.name}</p>
                        <p className="text-sm text-gray-500">
                          Roll: {child.rollNumber} • {child.class?.name || 'No class'}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {stats.attendancePercentage || 0}% Attendance
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/parent/children/${child._id}`}>
                          Details
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/parent/payments?child=${child._id}`}>
                          Payments
                        </Link>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Button variant="outline" className="flex flex-col items-center gap-2 h-auto py-4" asChild>
              <Link to="/parent/children">
                <Users className="w-6 h-6" />
                <span>All Children</span>
              </Link>
            </Button>
            
            <Button variant="outline" className="flex flex-col items-center gap-2 h-auto py-4" asChild>
              <Link to="/parent/attendance">
                <Calendar className="w-6 h-6" />
                <span>Attendance</span>
              </Link>
            </Button>
            
            <Button variant="outline" className="flex flex-col items-center gap-2 h-auto py-4" asChild>
              <Link to="/parent/results">
                <BookOpen className="w-6 h-6" />
                <span>Results</span>
              </Link>
            </Button>

            <Button variant="outline" className="flex flex-col items-center gap-2 h-auto py-4" asChild>
              <Link to="/parent/payments">
               <span className="w-6 h-6 text-muted-foreground text-lg">৳</span>
                <span>Payments</span>
              </Link>
            </Button>
            
            <Button variant="outline" className="flex flex-col items-center gap-2 h-auto py-4" asChild>
              <Link to="/parent/profile">
                <User className="w-6 h-6" />
                <span>Profile</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// // components/parent/ParentDashboard.jsx
// import { Badge } from "@/components/ui/badge";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { useGetParentDashboardQuery } from "@/features/apis/parentsApi";
// import { BookOpen, Calendar, TrendingUp, User, Users, Clock, AlertCircle } from "lucide-react";
// import { Link } from "react-router-dom";

// export default function ParentDashboard() {
//   const { data, isLoading } = useGetParentDashboardQuery();

//   if (isLoading) {
//     return (
//       <Card>
//         <CardContent className="p-6">
//           <div className="text-center">Loading dashboard...</div>
//         </CardContent>
//       </Card>
//     );
//   }

//   const { dashboard } = data || {};
//   const { parent, children, statistics, recentAttendance, recentResults } = dashboard || {};
//   const { childAttendanceStats = {} } = statistics || {};

//   // Calculate overall attendance average
//   const calculateOverallAttendance = () => {
//     if (!children || children.length === 0) return 0;
    
//     const totalPercentage = children.reduce((sum, child) => {
//       return sum + (childAttendanceStats[child._id]?.attendancePercentage || 0);
//     }, 0);
    
//     return Math.round(totalPercentage / children.length);
//   };

//   const overallAttendance = calculateOverallAttendance();

//   return (
//     <div className="space-y-6">
//       {/* Header */}
//       <div className="flex justify-between items-center">
//         <div>
//           <h1 className="text-3xl font-bold">Welcome, {parent?.name}!</h1>
//           <p className="text-gray-600 mt-2">Monitor your children's academic progress</p>
//         </div>
//         <div className="text-right">
//           <p className="text-sm text-gray-500">Today</p>
//           <p className="font-semibold">{new Date().toLocaleDateString()}</p>
//         </div>
//       </div>

//       {/* Stats */}
//       <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
//         <Card>
//           <CardContent className="p-6">
//             <div className="flex items-center gap-4">
//               <div className="p-3 bg-blue-100 rounded-lg">
//                 <Users className="w-6 h-6 text-blue-600" />
//               </div>
//               <div>
//                 <p className="text-2xl font-bold">{statistics?.totalChildren || 0}</p>
//                 <p className="text-sm text-gray-600">Children</p>
//               </div>
//             </div>
//           </CardContent>
//         </Card>

//         <Card>
//           <CardContent className="p-6">
//             <div className="flex items-center gap-4">
//               <div className="p-3 bg-green-100 rounded-lg">
//                 <BookOpen className="w-6 h-6 text-green-600" />
//               </div>
//               <div>
//                 <p className="text-2xl font-bold">{statistics?.childrenWithClasses || 0}</p>
//                 <p className="text-sm text-gray-600">In School</p>
//               </div>
//             </div>
//           </CardContent>
//         </Card>

//         <Card>
//           <CardContent className="p-6">
//             <div className="flex items-center gap-4">
//               <div className="p-3 bg-purple-100 rounded-lg">
//                 <TrendingUp className="w-6 h-6 text-purple-600" />
//               </div>
//               <div>
//                 <p className="text-2xl font-bold">{overallAttendance}%</p>
//                 <p className="text-sm text-gray-600">Avg Attendance</p>
//               </div>
//             </div>
//           </CardContent>
//         </Card>

//         <Card>
//           <CardContent className="p-6">
//             <div className="flex items-center gap-4">
//               <div className="p-3 bg-orange-100 rounded-lg">
//                 <Calendar className="w-6 h-6 text-orange-600" />
//               </div>
//               <div>
//                 <p className="text-2xl font-bold">{recentAttendance?.length || 0}</p>
//                 <p className="text-sm text-gray-600">Recent Records</p>
//               </div>
//             </div>
//           </CardContent>
//         </Card>
//       </div>

//       {/* Children Attendance Overview */}
//       {children && children.length > 0 && (
//         <Card>
//           <CardHeader>
//             <CardTitle className="flex items-center gap-2">
//               <TrendingUp className="w-5 h-5" />
//               Children's Attendance Overview
//             </CardTitle>
//           </CardHeader>
//           <CardContent>
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//               {children.map((child) => {
//                 const stats = childAttendanceStats[child._id] || {};
//                 const performance = stats.attendancePercentage >= 90 ? 'Excellent' :
//                                   stats.attendancePercentage >= 75 ? 'Good' :
//                                   stats.attendancePercentage >= 60 ? 'Average' : 'Needs Improvement';

//                 return (
//                   <div key={child._id} className="p-4 border rounded-lg">
//                     <div className="flex items-center justify-between mb-3">
//                       <h4 className="font-semibold">{child.name}</h4>
//                       <Badge variant="outline">{child.class?.name || 'No Class'}</Badge>
//                     </div>
                    
//                     <div className="space-y-2 text-sm">
//                       <div className="flex justify-between">
//                         <span>Attendance:</span>
//                         <span className="font-bold">{stats.attendancePercentage || 0}%</span>
//                       </div>
                      
//                       <div className="w-full bg-gray-200 rounded-full h-2">
//                         <div 
//                           className={`h-2 rounded-full ${
//                             stats.attendancePercentage >= 90 ? 'bg-green-500' :
//                             stats.attendancePercentage >= 75 ? 'bg-yellow-500' :
//                             'bg-red-500'
//                           }`}
//                           style={{ width: `${stats.attendancePercentage || 0}%` }}
//                         ></div>
//                       </div>
                      
//                       <div className="grid grid-cols-2 gap-2 text-xs">
//                         <div className="text-center p-1 bg-green-50 rounded">
//                           <div className="font-semibold text-green-600">{stats.presentRecords || 0}</div>
//                           <div className="text-gray-500">Present</div>
//                         </div>
//                         <div className="text-center p-1 bg-red-50 rounded">
//                           <div className="font-semibold text-red-600">{stats.absentRecords || 0}</div>
//                           <div className="text-gray-500">Absent</div>
//                         </div>
//                         <div className="text-center p-1 bg-yellow-50 rounded">
//                           <div className="font-semibold text-yellow-600">{stats.lateRecords || 0}</div>
//                           <div className="text-gray-500">Late</div>
//                         </div>
//                         <div className="text-center p-1 bg-orange-50 rounded">
//                           <div className="font-semibold text-orange-600">{stats.halfDayRecords || 0}</div>
//                           <div className="text-gray-500">Half Day</div>
//                         </div>
//                       </div>
                      
//                       <div className="flex justify-between items-center pt-2 border-t">
//                         <span className="text-gray-500">Performance:</span>
//                         <Badge variant={
//                           performance === 'Excellent' ? 'default' :
//                           performance === 'Good' ? 'secondary' : 'outline'
//                         }>
//                           {performance}
//                         </Badge>
//                       </div>
//                     </div>
//                   </div>
//                 );
//               })}
//             </div>
//           </CardContent>
//         </Card>
//       )}

//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//         {/* Children List */}
//         <Card>
//           <CardHeader className="flex flex-row items-center justify-between">
//             <CardTitle>My Children</CardTitle>
//             <Badge variant="outline">{children?.length || 0}</Badge>
//           </CardHeader>
//           <CardContent>
//             {children?.length === 0 ? (
//               <div className="text-center py-8 text-gray-500">
//                 <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
//                 <p>No children registered</p>
//                 <p className="text-sm">Contact school administration to add children</p>
//               </div>
//             ) : (
//               <div className="space-y-3">
//                 {children?.map((child) => {
//                   const stats = childAttendanceStats[child._id] || {};
                  
//                   return (
//                     <div key={child._id} className="flex items-center justify-between p-3 border rounded-lg">
//                       <div className="flex items-center gap-3">
//                         <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
//                           <User className="w-5 h-5 text-blue-600" />
//                         </div>
//                         <div>
//                           <p className="font-medium">{child.name}</p>
//                           <p className="text-sm text-gray-500">
//                             Roll: {child.rollNumber} • {child.class?.name || 'No class'}
//                           </p>
//                           <div className="flex items-center gap-2 mt-1">
//                             <Badge variant="outline" className="text-xs">
//                               {stats.attendancePercentage || 0}% Attendance
//                             </Badge>
//                           </div>
//                         </div>
//                       </div>
//                       <Button variant="outline" size="sm" asChild>
//                         <Link to={`/parent/children?child=${child._id}`}>
//                           View Details
//                         </Link>
//                       </Button>
//                     </div>
//                   );
//                 })}
//               </div>
//             )}
//             <Button variant="outline" className="w-full mt-4" asChild>
//               <Link to="/parent/children">View All Children</Link>
//             </Button>
//           </CardContent>
//         </Card>

//         {/* Recent Activity */}
//         <Card>
//           <CardHeader>
//             <CardTitle>Recent Activity</CardTitle>
//           </CardHeader>
//           <CardContent>
//             <div className="space-y-4">
//               {/* Recent Results */}
//               <div>
//                 <h4 className="font-semibold mb-2 flex items-center gap-2">
//                   <BookOpen className="w-4 h-4" />
//                   Recent Results
//                 </h4>
//                 {recentResults?.length === 0 ? (
//                   <p className="text-sm text-gray-500">No recent results</p>
//                 ) : (
//                   <div className="space-y-2">
//                     {recentResults?.slice(0, 3).map((result) => (
//                       <div key={result._id} className="flex justify-between items-center text-sm p-2 border rounded">
//                         <div>
//                           <p className="font-medium">{result.student.name}</p>
//                           <p className="text-gray-500">{result.exam.title} - {result.subject?.name}</p>
//                         </div>
//                         <Badge variant="outline">
//                           {result.marksObtained}/{result.exam.totalMarks}
//                         </Badge>
//                       </div>
//                     ))}
//                   </div>
//                 )}
//               </div>

//               {/* Recent Attendance */}
//               <div>
//                 <h4 className="font-semibold mb-2 flex items-center gap-2">
//                   <Calendar className="w-4 h-4" />
//                   Recent Attendance
//                 </h4>
//                 {recentAttendance?.length === 0 ? (
//                   <p className="text-sm text-gray-500">No recent attendance</p>
//                 ) : (
//                   <div className="space-y-2">
//                     {recentAttendance?.slice(0, 3).map((record) => (
//                       <div key={record._id} className="flex justify-between items-center text-sm p-2 border rounded">
//                         <div>
//                           <p className="font-medium">{record.student.name}</p>
//                           <p className="text-gray-500">
//                             {new Date(record.date).toLocaleDateString()} - {record.subject?.name} (Period {record.period})
//                           </p>
//                         </div>
//                         <Badge 
//                           variant={
//                             record.status === 'present' ? 'default' : 
//                             record.status === 'absent' ? 'destructive' : 
//                             record.status === 'late' ? 'secondary' : 'outline'
//                           }
//                         >
//                           {record.status}
//                         </Badge>
//                       </div>
//                     ))}
//                   </div>
//                 )}
//               </div>
//             </div>
//           </CardContent>
//         </Card>
//       </div>

//       {/* Quick Actions */}
//       <Card>
//         <CardHeader>
//           <CardTitle>Quick Actions</CardTitle>
//         </CardHeader>
//         <CardContent>
//           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
//             <Button variant="outline" className="flex flex-col items-center gap-2 h-auto py-4" asChild>
//               <Link to="/parent/children">
//                 <Users className="w-6 h-6" />
//                 <span>All Children</span>
//               </Link>
//             </Button>
            
//             <Button variant="outline" className="flex flex-col items-center gap-2 h-auto py-4" asChild>
//               <Link to="/parent/attendance">
//                 <Calendar className="w-6 h-6" />
//                 <span>Attendance</span>
//               </Link>
//             </Button>
            
//             <Button variant="outline" className="flex flex-col items-center gap-2 h-auto py-4" asChild>
//               <Link to="/parent/results">
//                 <BookOpen className="w-6 h-6" />
//                 <span>Results</span>
//               </Link>
//             </Button>
            
//             <Button variant="outline" className="flex flex-col items-center gap-2 h-auto py-4" asChild>
//               <Link to="/parent/profile">
//                 <User className="w-6 h-6" />
//                 <span>Profile</span>
//               </Link>
//             </Button>
//           </div>
//         </CardContent>
//       </Card>
//     </div>
//   );
// }