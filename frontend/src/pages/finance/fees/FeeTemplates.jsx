// src/pages/Fees/FeeTemplates.jsx
import { useDeleteFeeTemplateMutation, useGetFeeTemplatesQuery } from '@/features/apis/finance/feeApi'
import {
  CheckCircle,
  Download,
  Edit,
  Eye,
  FileText,
  Filter,
  Plus,
  Search,
  Trash2,
  XCircle
} from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

import FeeTemplateForm from '@/components/finance/FeeTemplateForm'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import { formatCurrency, formatDate } from '@/lib/formaters'
import { FEE_SCOPE_OPTIONS, FREQUENCY_OPTIONS, SESSION_OPTIONS } from '@/utils/constants'
import { useGetClassesQuery } from '@/features/apis/classesApi'

const FeeTemplates = () => {
  const [search, setSearch] = useState('')
  const [session, setSession] = useState('')
  const [isActive, setIsActive] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState(null)

  const { data:templatesData, isLoading, refetch } = useGetFeeTemplatesQuery({
    session: session || undefined,
    isActive: isActive === '' ? undefined : isActive === 'true',
  });
  const templates = templatesData?.data || [];

  const { data: classesData } = useGetClassesQuery();

  const [deleteTemplate] = useDeleteFeeTemplateMutation()
  const { toast } = useToast()

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this fee template?')) {
      try {
        await deleteTemplate(id).unwrap()
        toast({
          title: 'Success',
          description: 'Fee template deleted successfully',
          variant: 'success',
        })
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to delete fee template',
          variant: 'destructive',
        })
      }
    }
  }

  const handleEdit = (template) => {
    setSelectedTemplate(template)
    setShowForm(true)
  }

  const handleFormSuccess = () => {
    setShowForm(false)
    setSelectedTemplate(null)
    refetch()
    toast({
      title: 'Success',
      description: 'Fee template saved successfully',
      variant: 'success',
    })
  }

  const filteredTemplates = templates?.filter(template => {
    if (search && !template.title.toLowerCase().includes(search.toLowerCase())) {
      return false
    }
    return true
  }) || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fee Templates</h1>
          <p className="text-muted-foreground">
            Create and manage fee templates for different categories
          </p>
        </div>
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button onClick={() => setSelectedTemplate(null)}>
              <Plus className="mr-2 h-4 w-4" />
              New Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedTemplate ? 'Edit Fee Template' : 'Create New Fee Template'}
              </DialogTitle>
            </DialogHeader>
            <FeeTemplateForm
              template={selectedTemplate}
              classes={classesData?.classes || []}
              onSuccess={handleFormSuccess}
              onCancel={() => {
                setShowForm(false)
                setSelectedTemplate(null)
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search templates..."
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={session ?? 'all'}
              onValueChange={(value) => setSession(value === 'all' ? '' : value)}>
              <SelectTrigger>
                <SelectValue placeholder="All Sessions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sessions</SelectItem>
                {SESSION_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={isActive ?? 'all'}
              onValueChange={(value) => setIsActive(value === 'all' ? '' : value)}>
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center space-x-2">
              <Button variant="outline" className="flex-1">
                <Filter className="mr-2 h-4 w-4" />
                Filter
              </Button>
              <Button variant="outline" size="icon">
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Templates Table */}
      <Card>
        <CardHeader>
          <CardTitle>Fee Templates ({filteredTemplates.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-semibold">No fee templates found</h3>
              <p className="text-gray-500">Create your first fee template to get started</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Frequency</TableHead>
                    <TableHead>Applies To</TableHead>
                    <TableHead>Session</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTemplates.map((template) => (
                    <TableRow key={template._id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{template.title}</div>
                          {template.description && (
                            <div className="text-sm text-gray-500 truncate max-w-xs">
                              {template.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold">{formatCurrency(template.amount)}</div>
                        {template.taxPercentage > 0 && (
                          <div className="text-sm text-gray-500">
                            +{template.taxPercentage}% tax
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {FREQUENCY_OPTIONS.find(f => f.value === template.frequency)?.label || template.frequency}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <Badge variant="secondary">
                            {FEE_SCOPE_OPTIONS.find(s => s.value === template?.appliesTo?.scope)?.label || template?.appliesTo?.scope}
                          </Badge>
                          {template?.appliesTo?.class && (
                            <div className="text-xs text-gray-500">
                              Class: {template?.appliesTo?.class}
                            </div>
                          )}
                          {template?.appliesTo?.section && (
                            <div className="text-xs text-gray-500">
                              Section: {template?.appliesTo?.section?.name}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{template.session}</TableCell>
                      <TableCell>
                        {template.isActive ? (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-gray-500">
                            <XCircle className="mr-1 h-3 w-3" />
                            Inactive
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {formatDate(template.createdAt)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(template)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(template._id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              // Navigate to apply fee page
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default FeeTemplates