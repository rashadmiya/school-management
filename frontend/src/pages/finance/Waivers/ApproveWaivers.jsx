// src/pages/Waivers/ApproveWaivers.jsx
import {
    useApproveWaiverMutation,
    useGetWaiverRequestsQuery,
    useRejectWaiverMutation
} from '@/features/apis/finance/waiverApi'
import { WAIVER_STATUS, WAIVER_TYPES } from '@/utils/constants'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { formatCurrency, formatDate, formatRelativeTime } from '@/lib/formaters'
import {
    CheckCircle,
    ChevronLeft,
    ChevronRight,
    Clock,
    Download,
    Eye,
    Filter,
    Search,
    User,
    XCircle
} from 'lucide-react'
import { useState } from 'react'

const ApproveWaivers = () => {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('pending')
  const [page, setPage] = useState(1)
  const [selectedWaiver, setSelectedWaiver] = useState(null)
  const [showDetails, setShowDetails] = useState(false)
  const [remarks, setRemarks] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')

  const { toast } = useToast()
  
  const { data: waiversData, isLoading, refetch } = useGetWaiverRequestsQuery({
    status,
    search: search || undefined,
    page,
    limit: 10,
  })
  const waivers = waiversData?.data || []
  const [approveWaiver, { isLoading: isApproving }] = useApproveWaiverMutation()
  const [rejectWaiver, { isLoading: isRejecting }] = useRejectWaiverMutation()

  const handleViewDetails = (waiver) => {
    setSelectedWaiver(waiver)
    setShowDetails(true)
  }

  const handleApprove = async (waiverId) => {
    try {
      await approveWaiver({ id: waiverId, remarks }).unwrap()
      toast({
        title: 'Success',
        description: 'Waiver approved successfully',
        variant: 'success',
      })
      refetch()
      setRemarks('')
    } catch (error) {
      toast({
        title: 'Error',
        description: error.data?.message || 'Failed to approve waiver',
        variant: 'destructive',
      })
    }
  }

  const handleReject = async (waiverId) => {
    if (!rejectionReason) {
      toast({
        title: 'Error',
        description: 'Please provide a reason for rejection',
        variant: 'destructive',
      })
      return
    }

    try {
      await rejectWaiver({ id: waiverId, reason: rejectionReason }).unwrap()
      toast({
        title: 'Success',
        description: 'Waiver rejected successfully',
        variant: 'success',
      })
      refetch()
      setRejectionReason('')
    } catch (error) {
      toast({
        title: 'Error',
        description: error.data?.message || 'Failed to reject waiver',
        variant: 'destructive',
      })
    }
  }

  const pendingCount = waivers?.filter(w => w.status === 'pending').length || 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Approve Waivers</h1>
          <p className="text-muted-foreground">
            Review and approve pending waiver requests
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge className="bg-yellow-100 text-yellow-800">
            <Clock className="mr-1 h-3 w-3" />
            {pendingCount} Pending
          </Badge>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by student..."
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {WAIVER_STATUS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Waiver Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {WAIVER_TYPES.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" className="flex-1" onClick={() => {
              setSearch('')
              setStatus('pending')
              setPage(1)
            }}>
              <Filter className="mr-2 h-4 w-4" />
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Waivers Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Waiver Requests</CardTitle>
            <div className="text-sm text-gray-500">
              Showing {waivers?.length || 0} requests
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : waivers?.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-semibold">No waiver requests found</h3>
              <p className="text-gray-500">All requests have been processed</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Fee Details</TableHead>
                      <TableHead>Waiver Details</TableHead>
                      <TableHead>Requested</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {waivers.map((waiver) => (
                      <TableRow key={waiver._id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <User className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <div className="font-medium">{waiver.student?.name}</div>
                              <div className="text-sm text-gray-500">
                                Roll: {waiver.student?.rollNumber}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{waiver.feeInstance?.feeTemplate?.title}</div>
                            <div className="text-sm text-gray-500">
                              Amount: {formatCurrency(waiver.feeInstance?.totalAmount)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <Badge variant="outline">
                              {WAIVER_TYPES.find(t => t.value === waiver.type)?.label || waiver.type}
                            </Badge>
                            <div className="text-sm font-medium mt-1">
                              {formatCurrency(waiver.amount)}
                            </div>
                            {waiver.percentage && (
                              <div className="text-xs text-gray-500">
                                ({waiver.percentage}%)
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {formatDate(waiver.requestDate)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatRelativeTime(waiver.requestDate)}
                          </div>
                        </TableCell>
                        <TableCell>
                          {waiver.status === 'pending' ? (
                            <Badge className="bg-yellow-100 text-yellow-800">
                              <Clock className="mr-1 h-3 w-3" />
                              Pending
                            </Badge>
                          ) : waiver.status === 'approved' ? (
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle className="mr-1 h-3 w-3" />
                              Approved
                            </Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-800">
                              <XCircle className="mr-1 h-3 w-3" />
                              Rejected
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleViewDetails(waiver)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {waiver.status === 'pending' && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleApprove(waiver._id)}
                                  disabled={isApproving}
                                >
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Approve
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleReject(waiver._id)}
                                  disabled={isRejecting}
                                >
                                  <XCircle className="mr-2 h-4 w-4" />
                                  Reject
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-gray-500">
                  Page {page}
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setPage(p => p + 1)}
                    disabled={waivers?.length < 10}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions for Pending Waivers */}
      {status === 'pending' && pendingCount > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Approval Remarks (Optional)
                  </label>
                  <Textarea
                    placeholder="Enter remarks for approval..."
                    rows={3}
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                  />
                </div>
                <div className="text-sm text-gray-500">
                  These remarks will be added to all approved waivers
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Rejection Reason (Optional)
                  </label>
                  <Textarea
                    placeholder="Enter reason for rejection..."
                    rows={3}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                  />
                </div>
                <div className="text-sm text-gray-500">
                  Required when rejecting waivers
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Waiver Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Waiver Request Details</DialogTitle>
          </DialogHeader>
          {selectedWaiver && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <div className="text-2xl font-bold text-purple-600">
                    {formatCurrency(selectedWaiver.amount)}
                  </div>
                  <div className="text-sm text-gray-500">
                    {selectedWaiver.percentage && `(${selectedWaiver.percentage}% of fee)`}
                  </div>
                </div>
                <Badge className={
                  selectedWaiver.status === 'pending' 
                    ? 'bg-yellow-100 text-yellow-800'
                    : selectedWaiver.status === 'approved'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }>
                  {selectedWaiver.status}
                </Badge>
              </div>

              {/* Student and Fee Info */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Student Information</h4>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium">{selectedWaiver.student?.name}</div>
                          <div className="text-sm text-gray-500">
                            Roll: {selectedWaiver.student?.rollNumber} | Class: {selectedWaiver.student?.class?.name}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Fee Information</h4>
                    <div className="space-y-2">
                      <div>
                        <div className="text-sm text-gray-500">Fee Title</div>
                        <div className="font-medium">{selectedWaiver.feeInstance?.feeTemplate?.title}</div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm text-gray-500">Total Amount</div>
                          <div className="font-medium">{formatCurrency(selectedWaiver.feeInstance?.totalAmount)}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500">Already Waived</div>
                          <div className="font-medium text-blue-600">
                            {formatCurrency(selectedWaiver.feeInstance?.waivedAmount || 0)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Waiver Details</h4>
                    <div className="space-y-2">
                      <div>
                        <div className="text-sm text-gray-500">Type</div>
                        <Badge variant="outline">
                          {WAIVER_TYPES.find(t => t.value === selectedWaiver.type)?.label || selectedWaiver.type}
                        </Badge>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Requested By</div>
                        <div className="font-medium">{selectedWaiver.requestedBy?.name}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Request Date</div>
                        <div className="font-medium">{formatDate(selectedWaiver.requestDate)}</div>
                      </div>
                      {selectedWaiver.approvedDate && (
                        <div>
                          <div className="text-sm text-gray-500">Approved Date</div>
                          <div className="font-medium">{formatDate(selectedWaiver.approvedDate)}</div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Reason for Waiver</h4>
                    <p className="text-gray-600">{selectedWaiver.reason}</p>
                  </div>
                </div>
              </div>

              {/* Supporting Documents */}
              {selectedWaiver.supportingDocuments?.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Supporting Documents</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {selectedWaiver.supportingDocuments.map((doc, index) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <FileText className="h-8 w-8 text-gray-400" />
                          <div>
                            <div className="font-medium text-sm">{doc.name}</div>
                            <div className="text-xs text-gray-500">
                              Uploaded {formatDate(doc.uploadedAt)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              {selectedWaiver.status === 'pending' && (
                <div className="border-t pt-4">
                  <div className="flex items-center justify-end space-x-4">
                    <Button
                      variant="outline"
                      onClick={() => handleReject(selectedWaiver._id)}
                      disabled={isRejecting}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Reject
                    </Button>
                    <Button
                      onClick={() => handleApprove(selectedWaiver._id)}
                      disabled={isApproving}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Approve
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ApproveWaivers