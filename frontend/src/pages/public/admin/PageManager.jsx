// components/admin/PageManager.jsx
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Plus, Eye, ArrowUpDown, Search } from "lucide-react";
import PageForm from "./PageForm";
import { toast } from "react-toastify";
import { Input } from "@/components/ui/input";
import { useDeletePageMutation, useGetAdminPagesQuery, useUpdatePageOrderMutation } from "@/features/apis/api";

export default function PageManager() {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingPage, setEditingPage] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");

    const { data, isLoading, refetch } = useGetAdminPagesQuery();
    const [deletePage] = useDeletePageMutation();
    const [updatePageOrder] = useUpdatePageOrderMutation();

    const pages = data?.pages || [];

    const handleDelete = async (id, title) => {
        if (!confirm(`Are you sure you want to delete "${title}"?`)) return;
        try {
            await deletePage(id).unwrap();
            toast.success("Page deleted successfully");
        } catch (err) {
            toast.error(err?.data?.message || "Failed to delete page");
        }
    };

    const handleEdit = (page) => {
        setEditingPage(page);
        setIsFormOpen(true);
    };

    const handleAddNew = () => {
        setEditingPage(null);
        setIsFormOpen(true);
    };

    const handleFormClose = () => {
        setIsFormOpen(false);
        setEditingPage(null);
        refetch();
    };

    const handleOrderChange = async (pageId, newOrder) => {
        try {
            const updatedPages = pages.map(page => ({
                id: page._id,
                order: page._id === pageId ? newOrder : page.order
            }));
            await updatePageOrder(updatedPages).unwrap();
            toast.success("Page order updated");
        } catch (err) {
            toast.error(err?.data?.message || "Failed to update order");
        }
    };

    const filteredPages = pages.filter(page =>
        page.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        page.slug.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (isLoading) {
        return (
            <Card>
                <CardContent className="p-6">
                    <div className="text-center">Loading pages...</div>
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
                        <CardTitle className="text-2xl">Page Management</CardTitle>
                        <Button onClick={handleAddNew} className="flex items-center gap-2">
                            <Plus className="w-4 h-4" />
                            New Page
                        </Button>
                    </div>
                </CardHeader>

                <CardContent className="space-y-4">
                    {/* Search */}
                    <div className="relative max-w-sm">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                            placeholder="Search pages..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Pages Table */}
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-16">Order</TableHead>
                                <TableHead>Title</TableHead>
                                <TableHead>Slug</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Created</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredPages.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                                        {searchQuery ? (
                                            "No pages found matching your search."
                                        ) : (
                                            <div className="flex flex-col items-center gap-2">
                                                <Eye className="w-12 h-12 text-gray-300" />
                                                <p>No pages found.</p>
                                                <p className="text-sm">Create your first page to get started.</p>
                                            </div>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredPages
                                    .sort((a, b) => a.order - b.order)
                                    .map((page) => (
                                        <TableRow key={page._id}>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleOrderChange(page._id, page.order - 1)}
                                                        disabled={page.order <= 1}
                                                    >
                                                        <ArrowUpDown className="w-3 h-3 rotate-90" />
                                                    </Button>
                                                    <span className="font-mono text-sm">{page.order}</span>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleOrderChange(page._id, page.order + 1)}
                                                        disabled={page.order >= pages.length}
                                                    >
                                                        <ArrowUpDown className="w-3 h-3 -rotate-90" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-2">
                                                    {page.title}
                                                    {page.slug === 'home' && (
                                                        <Badge variant="outline" className="text-xs text-gray-800">
                                                            Home
                                                        </Badge>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <code className="text-sm bg-gray-100 text-gray-800 px-2 py-1 rounded">/{page.slug}</code>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant="outline"
                                                    className={page.isPublished ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
                                                >
                                                    {page.isPublished ? 'Published' : 'Draft'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {new Date(page.createdAt).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleEdit(page)}
                                                        className="flex items-center gap-1"
                                                    >
                                                        <Edit className="w-3 h-3" />
                                                        Edit
                                                    </Button>
                                                    {page.slug !== 'home' && (
                                                        <Button
                                                            variant="destructive"
                                                            size="sm"
                                                            onClick={() => handleDelete(page._id, page.title)}
                                                            className="flex items-center gap-1"
                                                        >
                                                            <Trash2 className="w-3 h-3" />
                                                            Delete
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Page Form Dialog */}
            <PageForm
                open={isFormOpen}
                onOpenChange={handleFormClose}
                initialData={editingPage}
            />
        </div>
    );
}