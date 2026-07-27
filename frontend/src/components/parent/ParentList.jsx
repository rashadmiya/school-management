// components/parents/ParentList.jsx
import React, { useState } from "react";
import { useGetParentsQuery, useDeleteParentMutation } from "@/features/apis/parentsApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Search, 
  User, 
  Phone, 
  Mail, 
  Users, 
  BookOpen,
  Edit3,
  Trash2,
  Plus,
  MapPin,
  MoreVertical,
  Shield
} from "lucide-react";
import { toast } from "react-toastify";
import ParentForm from "./ParentForm";

export default function ParentList() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  
  // Debounce search input
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading, refetch } = useGetParentsQuery({ 
    page, 
    limit: 10, 
    search: debouncedSearch 
  });
  
  const [deleteParent, { isLoading: isDeleting }] = useDeleteParentMutation();

  const handleDelete = async (id, parentName) => {
    if (!confirm(`Are you sure you want to delete ${parentName}? This will remove their association with children.`)) return;
    
    try {
      await deleteParent(id).unwrap();
      toast.success("Parent deleted successfully");
      refetch();
    } catch (err) {
      console.error(err);
      toast.error(err?.data?.message || "Failed to delete parent");
    }
  };

  const parents = data?.docs || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Parents</h1>
          <p className="text-gray-600 mt-2">
            Manage parent information and their children relationships
          </p>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Search Input */}
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search parents by name, phone, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 w-full sm:w-80"
            />
          </div>
          
          {/* Add Parent Button */}
          <ParentForm
            trigger={
              <Button className="flex items-center gap-2 whitespace-nowrap">
                <Plus className="w-4 h-4" />
                Add Parent
              </Button>
            }
            onSaved={() => {
              refetch();
              toast.success("Parent added successfully");
            }}
          />
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{data?.total || 0}</p>
                <p className="text-sm text-gray-600">Total Parents</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {parents.reduce((total, parent) => total + (parent.children?.length || 0), 0)}
                </p>
                <p className="text-sm text-gray-600">Total Children</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <BookOpen className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {new Set(parents.flatMap(parent => parent.children?.map(child => child.class?.name) || [])).size}
                </p>
                <p className="text-sm text-gray-600">Classes Covered</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Shield className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {parents.filter(p => p.children?.length >= 2).length}
                </p>
                <p className="text-sm text-gray-600">Multiple Children</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Parents Table */}
      <Card>
        <CardHeader>
          <CardTitle>Parent Records</CardTitle>
          <CardDescription>
            {parents.length} parents found • {parents.reduce((total, parent) => total + (parent.children?.length || 0), 0)} total children
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading parents...</p>
              </div>
            </div>
          ) : parents.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No parents found</h3>
              <p className="text-gray-500 mb-4">
                {debouncedSearch ? "Try adjusting your search criteria" : "Get started by adding a new parent"}
              </p>
              <ParentForm
                trigger={
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Parent
                  </Button>
                }
                onSaved={() => refetch()}
              />
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-64">Parent Information</TableHead>
                    <TableHead className="w-48">Contact</TableHead>
                    <TableHead>Children</TableHead>
                    <TableHead className="w-20">Total</TableHead>
                    <TableHead className="w-24">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parents.map((parent) => (
                    <TableRow key={parent._id} className="hover:bg-gray-50">
                      {/* Parent Information */}
                      <TableCell>
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <User className="w-5 h-5 text-blue-600" />
                            </div>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-gray-900 truncate">
                                {parent.name}
                              </p>
                              {parent.children?.length >= 2 && (
                                <Badge variant="secondary" className="text-xs">
                                  {parent.children.length} children
                                </Badge>
                              )}
                            </div>
                            {parent.address && (
                              <div className="flex items-center gap-1 mt-1 text-sm text-gray-500">
                                <MapPin className="w-3 h-3" />
                                <span className="truncate">{parent.address}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      {/* Contact Information */}
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Phone className="w-3 h-3 text-gray-500" />
                            <span className="text-sm font-medium">{parent.phone}</span>
                          </div>
                          {parent.email && (
                            <div className="flex items-center gap-2">
                              <Mail className="w-3 h-3 text-gray-500" />
                              <span className="text-sm text-blue-600 truncate">
                                {parent.email}
                              </span>
                            </div>
                          )}
                        </div>
                      </TableCell>

                      {/* Children Information - Compact Single Line */}
                      <TableCell>
                        <div className="space-y-2">
                          {parent.children && parent.children.length > 0 ? (
                            parent.children.map((child) => (
                              <div key={child._id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                  <div className="flex-shrink-0">
                                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                                      <Users className="w-3 h-3 text-green-600" />
                                    </div>
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium text-sm truncate">
                                        {child.name}
                                      </span>
                                      <Badge variant="outline" className="text-xs font-mono">
                                        {child.rollNumber}
                                      </Badge>
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                      <BookOpen className="w-3 h-3 text-gray-400" />
                                      <span className="text-xs text-gray-600 truncate">
                                        {child.class?.name || 'No Class'}
                                      </span>
                                      {child.gender && (
                                        <Badge variant="secondary" className="text-xs">
                                          {child.gender}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-2 text-gray-400 text-sm">
                              No children assigned
                            </div>
                          )}
                        </div>
                      </TableCell>

                      {/* Children Count */}
                      <TableCell>
                        <div className="text-center">
                          <Badge 
                            variant={parent.children?.length > 0 ? "default" : "secondary"}
                            className={parent.children?.length >= 2 ? "bg-green-100 text-green-800" : ""}
                          >
                            {parent.children?.length || 0}
                          </Badge>
                        </div>
                      </TableCell>

                      {/* Actions */}
                      <TableCell>
                        <div className="flex gap-1">
                          <ParentForm
                            initialData={parent}
                            trigger={
                              <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                                <Edit3 className="w-3 h-3" />
                              </Button>
                            }
                            onSaved={() => refetch()}
                          />
                          <Button
                            variant="destructive"
                            size="sm"
                            disabled={isDeleting}
                            onClick={() => handleDelete(parent._id, parent.name)}
                            className="h-8 w-8 p-0"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {parents.length > 0 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-500">
                Showing {((page - 1) * 10) + 1} to {Math.min(page * 10, data?.total || 0)} of {data?.total || 0} parents
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={!data?.hasNextPage}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-4 justify-between items-center">
        <div className="text-sm text-gray-600">
          Need to manage student-parent relationships?{" "}
          <Button variant="link" className="p-0 h-auto text-blue-600" asChild>
            <a href="/students">Go to Students</a>
          </Button>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={refetch}>
            Refresh Data
          </Button>
          <ParentForm
            trigger={
              <Button size="sm" className="flex items-center gap-1">
                <Plus className="w-3 h-3" />
                Add Parent
              </Button>
            }
            onSaved={() => refetch()}
          />
        </div>
      </div>
    </div>
  );
}

// // components/parents/ParentList.jsx - UPDATED FOR YOUR SCHEMA
// import React, { useState } from "react";
// import DataTable from "@/components/common/DataTable";
// import ParentForm from "./ParentForm";
// import { useGetParentsQuery, useDeleteParentMutation } from "@/features/apis/parentsApi";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Badge } from "@/components/ui/badge";
// import { 
//   Search, 
//   User, 
//   Phone, 
//   Mail, 
//   Users, 
//   BookOpen,
//   Edit3,
//   Trash2,
//   Plus,
//   MapPin
// } from "lucide-react";
// import { toast } from "react-toastify";

// export default function ParentList() {
//   const [page, setPage] = useState(1);
//   const [search, setSearch] = useState("");
//   const [debouncedSearch, setDebouncedSearch] = useState("");
  
//   // Debounce search input
//   React.useEffect(() => {
//     const timer = setTimeout(() => {
//       setDebouncedSearch(search);
//       setPage(1);
//     }, 500);
    
//     return () => clearTimeout(timer);
//   }, [search]);

//   const { data, isLoading, refetch } = useGetParentsQuery({ 
//     page, 
//     limit: 10, 
//     search: debouncedSearch 
//   });
  
//   console.log("parents data :", data)
//   const [deleteParent, { isLoading: isDeleting }] = useDeleteParentMutation();

//   const handleDelete = async (id, parentName) => {
//     if (!confirm(`Are you sure you want to delete ${parentName}?`)) return;
    
//     try {
//       await deleteParent(id).unwrap();
//       toast.success("Parent deleted successfully");
//       refetch();
//     } catch (err) {
//       console.error(err);
//       toast.error("Failed to delete parent");
//     }
//   };

//   // Columns based on your actual schema
//   const columns = [
//     { 
//       key: "name", 
//       title: "Parent Info",
//       render: (r) => (
//         <div className="flex items-center gap-3">
//           <div className="p-2 bg-blue-100 rounded-full">
//             <User className="w-4 h-4 text-blue-600" />
//           </div>
//           <div>
//             <p className="font-medium text-gray-900">{r.name}</p>
//             {r.address && (
//               <div className="flex items-center gap-1 mt-1">
//                 <MapPin className="w-3 h-3 text-gray-500" />
//                 <span className="text-xs text-gray-500 truncate max-w-[200px]">
//                   {r.address}
//                 </span>
//               </div>
//             )}
//           </div>
//         </div>
//       )
//     },
//     { 
//       key: "contact", 
//       title: "Contact",
//       render: (r) => (
//         <div className="space-y-2">
//           <div className="flex items-center gap-2">
//             <Phone className="w-4 h-4 text-gray-500" />
//             <span className="text-sm font-medium">{r.phone}</span>
//           </div>
//           {r.email && (
//             <div className="flex items-center gap-2">
//               <Mail className="w-4 h-4 text-gray-500" />
//               <span className="text-sm text-blue-600 break-all">{r.email}</span>
//             </div>
//           )}
//         </div>
//       )
//     },
//     { 
//       key: "children", 
//       title: "Children",
//       render: (r) => (
//         <div className="space-y-2">
//           {r.children && r.children.length > 0 ? (
//             r.children.map((child) => (
//               <div key={child._id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
//                 <div className="flex-1">
//                   <div className="flex items-center gap-2 mb-1">
//                     <Users className="w-3 h-3 text-green-600" />
//                     <span className="font-medium text-sm">{child.name}</span>
//                     <Badge variant="outline" className="text-xs">
//                       {child.rollNumber}
//                     </Badge>
//                   </div>
//                   <div className="flex items-center gap-2">
//                     <BookOpen className="w-3 h-3 text-gray-400" />
//                     <span className="text-xs text-gray-600">
//                       {child.class?.name || 'No Class'}
//                     </span>
//                   </div>
//                   {child.gender && (
//                     <Badge variant="secondary" className="text-xs mt-1">
//                       {child.gender}
//                     </Badge>
//                   )}
//                 </div>
//               </div>
//             ))
//           ) : (
//             <div className="text-center py-3 text-gray-500">
//               <Users className="w-6 h-6 mx-auto mb-1 text-gray-300" />
//               <p className="text-sm">No children</p>
//             </div>
//           )}
//         </div>
//       )
//     },
//     { 
//       key: "childrenCount", 
//       title: "Total",
//       render: (r) => (
//         <div className="text-center">
//           <Badge variant={r.children?.length > 0 ? "default" : "secondary"}>
//             {r.children?.length || 0}
//           </Badge>
//         </div>
//       )
//     },
//     {
//       key: "action",
//       title: "Actions",
//       render: (r) => (
//         <div className="flex gap-2">
//           <ParentForm
//             initialData={r}
//             trigger={
//               <Button variant="outline" size="sm" className="flex items-center gap-1">
//                 <Edit3 className="w-3 h-3" />
//                 Edit
//               </Button>
//             }
//             onSaved={() => refetch()}
//           />
//           <Button
//             variant="destructive"
//             size="sm"
//             disabled={isDeleting}
//             onClick={() => handleDelete(r._id, r.name)}
//             className="flex items-center gap-1"
//           >
//             <Trash2 className="w-3 h-3" />
//             Delete
//           </Button>
//         </div>
//       ),
//     },
//   ];

//   return (
//     <div className="space-y-6">
//       {/* Header with Search */}
//       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
//         <div>
//           <h2 className="text-2xl font-bold text-gray-900">Parents Management</h2>
//           <p className="text-gray-600 mt-1">Manage parent information and their children</p>
//         </div>
        
//         <div className="flex items-center gap-3 w-full sm:w-auto">
//           {/* Search Input */}
//           <div className="relative flex-1 sm:flex-none">
//             <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
//             <Input
//               placeholder="Search parents by name, phone, email..."
//               value={search}
//               onChange={(e) => setSearch(e.target.value)}
//               className="pl-10 pr-4 w-full sm:w-80"
//             />
//           </div>
          
//           {/* Add Parent Button */}
//           <ParentForm
//             trigger={
//               <Button className="flex items-center gap-2 whitespace-nowrap">
//                 <Plus className="w-4 h-4" />
//                 Add Parent
//               </Button>
//             }
//             onSaved={() => {
//               refetch();
//               toast.success("Parent added successfully");
//             }}
//           />
//         </div>
//       </div>

//       {/* Statistics Cards */}
//       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//         <div className="bg-white p-4 rounded-lg border shadow-sm">
//           <div className="flex items-center gap-3">
//             <div className="p-2 bg-blue-100 rounded-lg">
//               <User className="w-5 h-5 text-blue-600" />
//             </div>
//             <div>
//               <p className="text-2xl font-bold">{data?.total || 0}</p>
//               <p className="text-sm text-gray-600">Total Parents</p>
//             </div>
//           </div>
//         </div>
        
//         <div className="bg-white p-4 rounded-lg border shadow-sm">
//           <div className="flex items-center gap-3">
//             <div className="p-2 bg-green-100 rounded-lg">
//               <Users className="w-5 h-5 text-green-600" />
//             </div>
//             <div>
//               <p className="text-2xl font-bold">
//                 {data?.docs?.reduce((total, parent) => total + (parent.children?.length || 0), 0) || 0}
//               </p>
//               <p className="text-sm text-gray-600">Total Children</p>
//             </div>
//           </div>
//         </div>
        
//         <div className="bg-white p-4 rounded-lg border shadow-sm">
//           <div className="flex items-center gap-3">
//             <div className="p-2 bg-purple-100 rounded-lg">
//               <BookOpen className="w-5 h-5 text-purple-600" />
//             </div>
//             <div>
//               <p className="text-2xl font-bold">
//                 {new Set(data?.docs?.flatMap(parent => parent.children?.map(child => child.class?.name) || [])).size}
//               </p>
//               <p className="text-sm text-gray-600">Classes Covered</p>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Data Table */}
//       <div className="bg-white rounded-lg border shadow-sm">
//         <DataTable
//           columns={columns}
//           data={data?.docs || []}
//           loading={isLoading}
//           pagination={{
//             currentPage: page,
//             totalPages: data?.pages || 1,
//             onPageChange: setPage,
//             totalItems: data?.total || 0,
//             itemsPerPage: 10
//           }}
//           emptyState={
//             <div className="text-center py-12">
//               <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
//               <h3 className="text-lg font-medium text-gray-900 mb-2">No parents found</h3>
//               <p className="text-gray-500 mb-4">
//                 {debouncedSearch ? "Try adjusting your search criteria" : "Get started by adding a new parent"}
//               </p>
//               <ParentForm
//                 trigger={
//                   <Button>
//                     <Plus className="w-4 h-4 mr-2" />
//                     Add First Parent
//                   </Button>
//                 }
//                 onSaved={() => refetch()}
//               />
//             </div>
//           }
//         />
//       </div>

//       {/* Quick Actions Footer */}
//       <div className="flex flex-wrap gap-4 justify-between items-center text-sm text-gray-600">
//         <div>
//           Showing {((page - 1) * 10) + 1} to {Math.min(page * 10, data?.total || 0)} of {data?.total || 0} parents
//         </div>
//         <div className="flex gap-4">
//           <Button variant="outline" size="sm" onClick={refetch}>
//             Refresh Data
//           </Button>
//         </div>
//       </div>
//     </div>
//   );
// };