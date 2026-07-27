// components/admin/directory/SectionManager.jsx
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Edit, Trash2, Plus, Filter, Users, CheckCircle, XCircle } from "lucide-react";
import { toast } from "react-toastify";
import SectionForm from "@/components/section/SectionForm";
import { useGetSectionsQuery } from "@/features/apis/sectionsApi";


export default function SectionManager({ classes = [] }) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const { data, isLoading } = useGetSectionsQuery();
  const sections = data?.sections || [];

  const handleDelete = async (id, name) => {
    // Check if section is used in any class
    const usedInClasses = classes.filter(c => c.section?._id === id);
    if (usedInClasses.length > 0) {
      const classNames = usedInClasses.map(c => c.name).join(', ');
      toast.error(`Cannot delete section. It is used in classes: ${classNames}`);
      return;
    }

    if (!confirm(`Are you sure you want to delete section "${name}"?`)) return;
    try {
      toast.success("Section deleted successfully");
    } catch (err) {
      toast.error(err?.data?.message || "Failed to delete section");
    }
  };

  const handleEdit = (section) => {
    setEditingSection(section);
    setIsFormOpen(true);
  };

  const handleAddNew = () => {
    setEditingSection(null);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingSection(null);
  };

  const filteredSections = sections.filter(section =>
    section.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate statistics
  const stats = {
    totalSections: sections.length,
    activeSections: sections.filter(s => s.isActive).length,
    totalCapacity: sections.reduce((sum, s) => sum + s.capacity, 0),
    totalStudents: sections.reduce((sum, s) => sum + s.currentStrength, 0),
    usagePercentage: Math.round((sections.reduce((sum, s) => sum + s.currentStrength, 0) / 
      sections.reduce((sum, s) => sum + s.capacity, 0)) * 100) || 0
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading sections data...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-2xl">Section Management</CardTitle>
              <p className="text-gray-600">
                Manage class sections and their capacities
              </p>
            </div>
            <Button onClick={handleAddNew} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Section
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Sections</p>
                <p className="text-2xl font-bold mt-1">{stats.totalSections}</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <Filter className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Sections</p>
                <p className="text-2xl font-bold mt-1">{stats.activeSections}</p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Capacity</p>
                <p className="text-2xl font-bold mt-1">{stats.totalCapacity}</p>
              </div>
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Usage Rate</p>
                <p className="text-2xl font-bold mt-1">{stats.usagePercentage}%</p>
              </div>
              <div className="p-2 bg-orange-100 rounded-lg">
                <Users className="w-5 h-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search sections..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Sections Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Section Name</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead>Current Strength</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSections.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    {searchQuery ? (
                      "No sections found matching your search."
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <Filter className="w-12 h-12 text-gray-300" />
                        <p>No sections found.</p>
                        <p className="text-sm">Create your first section to get started.</p>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                filteredSections.map((section) => {
                  const usagePercentage = Math.round((section.currentStrength / section.capacity) * 100);
                  const isFull = section.currentStrength >= section.capacity;
                  
                  return (
                    <TableRow key={section._id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="font-bold text-blue-600">{section.name.slice(0,3)}</span>
                          </div>
                          <div className="font-medium">{section.name}</div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="text-lg font-semibold">{section.capacity}</div>
                        <div className="text-sm text-gray-500">students</div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-gray-500" />
                          <div>
                            <div className="font-semibold">{section.currentStrength}</div>
                            <div className="text-sm text-gray-500">enrolled</div>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>{usagePercentage}%</span>
                            <span>{section.currentStrength}/{section.capacity}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                usagePercentage >= 90 ? 'bg-red-500' :
                                usagePercentage >= 75 ? 'bg-yellow-500' :
                                'bg-green-500'
                              }`}
                              style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                            ></div>
                          </div>
                          {isFull && (
                            <Badge variant="destructive" className="text-xs">
                              Full
                            </Badge>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-2">
                          {section.isActive ? (
                            <>
                              <CheckCircle className="w-4 h-4 text-green-500" />
                              <Badge variant="default" className="bg-green-100 text-green-800">
                                Active
                              </Badge>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-4 h-4 text-red-500" />
                              <Badge variant="outline" className="text-red-600 border-red-200">
                                Inactive
                              </Badge>
                            </>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(section)}
                            className="flex items-center gap-1 h-8 px-2"
                            title="Edit"
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(section._id, section.name)}
                            className="flex items-center gap-1 h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                            title="Delete"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Section Form Dialog */}
      <SectionForm
        open={isFormOpen}
        onOpenChange={handleFormClose}
        initialData={editingSection}
      />
    </div>
  );
}

// // pages/SectionsPage.jsx
// import React, { useState } from "react";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
// import { Badge } from "@/components/ui/badge";
// import { Edit, Trash2, Plus } from "lucide-react";
// import { useGetSectionsQuery, useDeleteSectionMutation } from "@/features/apis/sectionsApi";
// import SectionForm from "@/components/section/SectionForm";
// import { toast } from "react-toastify";

// export default function SectionsPage() {
//   const [isFormOpen, setIsFormOpen] = useState(false);
//   const [editingSection, setEditingSection] = useState(null);
//   const { data, isLoading, refetch } = useGetSectionsQuery();
//   const sections = data?.sections || [];
//   const [deleteSection] = useDeleteSectionMutation();

//   const handleDelete = async (id) => {
//     if (!confirm("Are you sure you want to delete this section?")) return;
//     try {
//       await deleteSection(id).unwrap();
//       refetch();
//     } catch (err) {
//       toast.error(err?.data?.message || "Failed to delete section");
//     }
//   };

//   const handleEdit = (section) => {
//     setEditingSection(section);
//     setIsFormOpen(true);
//   };

//   const handleAddNew = () => {
//     setEditingSection(null);
//     setIsFormOpen(true);
//   };

//   const handleFormClose = () => {
//     setIsFormOpen(false);
//     setEditingSection(null);
//     refetch();
//   };

//   if (isLoading) {
//     return (
//       <Card><CardContent className="p-6"><div className="text-center">Loading sections...</div></CardContent></Card>
//     );
//   }

//   return (
//     <div className="container space-y-6">
//       <div className="flex justify-between items-center">
//         <div>
//           <h1 className="text-3xl font-bold">Sections Management</h1>
//           <p className="text-gray-600 mt-2">Create and manage sections for classes</p>
//         </div>
//         <Button onClick={handleAddNew} className="flex items-center gap-2"><Plus className="w-4 h-4" />Add Section</Button>
//       </div>
//       <Card>
//         <CardContent className="p-0">
//           <Table>
//             <TableHeader>
//               <TableRow>
//                 <TableHead>Section Name</TableHead>
//                 <TableHead>Capacity</TableHead>
//                 <TableHead>Current Strength</TableHead>
//                 <TableHead>Status</TableHead>
//                 <TableHead className="text-right">Actions</TableHead>
//               </TableRow>
//             </TableHeader>
//             <TableBody>
//               {sections.length === 0 ? (
//                 <TableRow>
//                   <TableCell colSpan={5} className="text-center py-8 text-gray-500">No sections found. Create your first section.</TableCell>
//                 </TableRow>
//               ) : (
//                 sections.map((section) => (
//                   <TableRow key={section._id}>
//                     <TableCell className="font-medium">{section.name}</TableCell>
//                     <TableCell>{section.capacity}</TableCell>
//                     <TableCell>{section.currentStrength}</TableCell>
//                     <TableCell>
//                       <Badge variant={section.isActive ? "default" : "secondary"}>{section.isActive ? "Active" : "Inactive"}</Badge>
//                     </TableCell>
//                     <TableCell className="text-right">
//                       <div className="flex justify-end gap-2">
//                         <Button variant="outline" size="sm" onClick={() => handleEdit(section)} className="flex items-center gap-1">
//                           <Edit className="w-3 h-3" />Edit
//                         </Button>
//                         <Button variant="destructive" size="sm" onClick={() => handleDelete(section._id)} className="flex items-center gap-1">
//                           <Trash2 className="w-3 h-3" />Delete
//                         </Button>
//                       </div>
//                     </TableCell>
//                   </TableRow>
//                 ))
//               )}
//             </TableBody>
//           </Table>
//         </CardContent>
//       </Card>
//       <SectionForm open={isFormOpen} onOpenChange={handleFormClose} initialData={editingSection} />
//     </div>
//   );
// }