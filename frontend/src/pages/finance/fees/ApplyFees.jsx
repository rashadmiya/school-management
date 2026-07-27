// src/pages/Fees/ApplyFees.jsx - COMPLETE UPDATED VERSION
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  useApplyFeeTemplateMutation,
  useGetFeeTemplatesQuery,
  useGetStudentsByTemplateScopeQuery,
  useGetCurrentSessionQuery,
  useSetSessionMutation
} from '@/features/apis/finance/feeApi'
import { useToast } from '@/hooks/use-toast'
import { formatCurrency } from '@/lib/utils'
import { FEE_SCOPE_OPTIONS } from '@/utils/constants'
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Download,
  FileText,
  Info,
  Loader2,
  Search,
  Users,
  AlertTriangle,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

const ApplyFees = () => {
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [forceApply, setForceApply] = useState(false)
  const [eligibleStudentsInfo, setEligibleStudentsInfo] = useState(null)
  const [showAllStudents, setShowAllStudents] = useState(false)
  const [selectedSession, setSelectedSession] = useState('')

  const { toast } = useToast()

  // Session Management
  const {
    data: sessionData,
    isLoading: sessionLoading,
    refetch: refetchSession
  } = useGetCurrentSessionQuery();

  // console.log("sessionData:", sessionData);

  const [setSession, { isLoading: isSettingSession }] = useSetSessionMutation()

  // Set initial session when data loads
  useEffect(() => {
    if (sessionData?.data?.currentSession && !selectedSession) {
      setSelectedSession(sessionData.data.currentSession)
    }
  }, [sessionData, selectedSession])

  // Fee Templates
  const {
    data: templatesData,
    isLoading: templatesLoading,
    refetch: refetchTemplates
  } = useGetFeeTemplatesQuery({
    session: selectedSession,
    isActive: true,
  }, {
    skip: !selectedSession
  })

  const templates = templatesData?.data || []

  // Eligible Students
  const {
    data: eligibleData,
    isLoading: loadingEligible,
    isFetching: fetchingEligible,
    refetch: refetchEligible
  } = useGetStudentsByTemplateScopeQuery(
    {
      templateId: selectedTemplate?._id,
      session: selectedSession
    },
    {
      skip: !selectedTemplate?._id || !selectedSession,
      refetchOnMountOrArgChange: true
    }
  )

  const [applyFee, { isLoading: isApplying }] = useApplyFeeTemplateMutation()

  // Update eligible students info when data changes
  useEffect(() => {
    if (eligibleData?.data) {
      setEligibleStudentsInfo(eligibleData.data)
    }
  }, [eligibleData])

  const handleSessionChange = async (newSession) => {
    try {
      await setSession({ session: newSession }).unwrap()
      setSelectedSession(newSession)
      setSelectedTemplate(null)
      setEligibleStudentsInfo(null)

      toast({
        title: 'Session Updated',
        description: `Now viewing ${newSession} academic year`,
        variant: 'success',
      })

      // Refresh templates for new session
      refetchTemplates()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to change session',
        variant: 'destructive',
      })
    }
  }

  const handleApplyFees = async () => {
    if (!selectedTemplate) {
      toast({
        title: 'Error',
        description: 'Please select a fee template',
        variant: 'destructive',
      })
      return
    }

    const confirmed = window.confirm(
      forceApply
        ? `Are you sure you want to FORCE apply "${selectedTemplate.title}" to ${eligibleStudentsInfo?.counts.total} students? This will overwrite existing fees.`
        : `Apply "${selectedTemplate.title}" to ${eligibleStudentsInfo?.counts.willBeApplied} students?`
    )

    if (!confirmed) return

    try {
      const result = await applyFee({
        id: selectedTemplate._id,
        force: forceApply,
      }).unwrap()

      toast({
        title: 'Success',
        description: `Fee applied to ${result.data?.appliedTo || result.appliedTo} students successfully`,
        variant: 'success',
        duration: 5000,
      })

      // Reset and refresh
      setSelectedTemplate(null)
      setEligibleStudentsInfo(null)
      setForceApply(false)

      // Refresh data
      refetchEligible()
      refetchTemplates()

    } catch (error) {
      toast({
        title: 'Error',
        description: error.data?.message || 'Failed to apply fees',
        variant: 'destructive',
      })
    }
  }

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template)
    setEligibleStudentsInfo(null)
    setForceApply(false)
  }

  const getScopeDescription = (template) => {
    const scope = FEE_SCOPE_OPTIONS.find(s => s.value === template.appliesTo.scope)?.label || template.appliesTo.scope

    switch (template.appliesTo.scope) {
      case 'all':
        return 'All active students'
      case 'class':
        return `Class: ${template.appliesTo.class?.name || 'Selected Class'}`
      case 'section':
        return `${template.appliesTo.class?.name || 'Class'} - ${template.appliesTo.section?.name || 'Section'}`
      case 'individual':
        return 'Specific student only'
      default:
        return scope
    }
  }

  const getScopeBadgeColor = (scope) => {
    switch (scope) {
      case 'all': return 'bg-blue-100 text-blue-800'
      case 'class': return 'bg-green-100 text-green-800'
      case 'section': return 'bg-purple-100 text-purple-800'
      case 'individual': return 'bg-amber-100 text-amber-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredTemplates = templates.filter(template => {
    if (searchTerm && !template.title.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false
    }
    return true
  })

  const displayedStudents = showAllStudents
    ? eligibleStudentsInfo?.eligibleStudents
    : eligibleStudentsInfo?.eligibleStudents?.slice(0, 10)

  const getSessionOptions = () => {
    if (!sessionData?.data) return []

    const options = []

    // Previous session
    if (sessionData.data.previousSession) {
      options.push({
        value: sessionData.data.previousSession,
        label: `← ${sessionData.data.previousSession}`,
        type: 'previous'
      })
    }

    // Current session
    options.push({
      value: sessionData.data.currentSession,
      label: sessionData.data.currentSession,
      type: 'current'
    })

    // Next session
    if (sessionData.data.nextSession) {
      options.push({
        value: sessionData.data.nextSession,
        label: `${sessionData.data.nextSession} →`,
        type: 'next'
      })
    }

    return options
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Apply Fees</h1>
          <p className="text-muted-foreground">
            Apply fee templates to students based on template scope rules
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {sessionLoading ? (
            <Skeleton className="h-10 w-48" />
          ) : (
            <Select
              value={selectedSession}
              onValueChange={handleSessionChange}
              disabled={isSettingSession}
            >
              <SelectTrigger className="w-48">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Select session">
                    {selectedSession || 'Select Session'}
                  </SelectValue>
                </div>
              </SelectTrigger>
              <SelectContent>
                {getSessionOptions().map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                    className={option.type === 'current' ? 'font-semibold' : ''}
                  >
                    <div className="flex items-center justify-between">
                      <span>{option.label}</span>
                      {option.type === 'current' && (
                        <Badge variant="outline" className="ml-2 text-xs">
                          Current
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button variant="outline" size="icon">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Session Info Banner */}
      {selectedSession && (
        <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Calendar className="h-5 w-5 text-blue-500 mr-3" />
              <div>
                <h3 className="font-semibold text-blue-800">
                  Academic Session: {selectedSession}
                </h3>
                <p className="text-sm text-blue-600">
                  All operations will be performed for this academic year
                </p>
              </div>
            </div>
            <Badge variant="outline" className="border-blue-200 text-blue-700">
              {eligibleStudentsInfo?.counts.total || 0} students in session
            </Badge>
          </div>
        </div>
      )}

      {/* Search and Template Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Select Fee Template</span>
            <Badge variant="outline">
              {filteredTemplates.length} templates available
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search fee templates by title or description..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Loading State */}
            {templatesLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-4 w-96" />
                      </div>
                      <Skeleton className="h-6 w-20" />
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <Skeleton className="h-8 w-32" />
                      <Skeleton className="h-6 w-24" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredTemplates.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTemplates.map((template) => (
                  <Card
                    key={template._id}
                    className={`cursor-pointer transition-all hover:shadow-lg hover:border-primary/50 group ${selectedTemplate?._id === template._id
                      ? 'ring-2 ring-primary border-primary shadow-md'
                      : ''
                      }`}
                    onClick={() => handleTemplateSelect(template)}
                  >
                    <CardContent className="pt-6">
                      <div className="space-y-3">
                        {/* Template Header */}
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-lg truncate group-hover:text-primary transition-colors">
                              {template.title}
                            </h3>
                            {template.description && (
                              <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                                {template.description}
                              </p>
                            )}
                          </div>
                          <Badge
                            variant="outline"
                            className="ml-2 flex-shrink-0"
                          >
                            {template.frequency.replace('_', ' ')}
                          </Badge>
                        </div>

                        {/* Amount */}
                        <div className="flex items-center justify-between">
                          <div className="text-2xl font-bold text-primary">
                            {formatCurrency(template.amount)}
                          </div>
                          {template.taxPercentage > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              +{template.taxPercentage}% tax
                            </Badge>
                          )}
                        </div>

                        {/* Scope Information */}
                        <div className="space-y-2">
                          <div className="flex items-center">
                            <Badge className={getScopeBadgeColor(template.appliesTo.scope)}>
                              {FEE_SCOPE_OPTIONS.find(s => s.value === template.appliesTo.scope)?.label || template.appliesTo.scope}
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-600">
                            <div className="flex items-start">
                              <Info className="h-3 w-3 mr-1 mt-0.5 flex-shrink-0" />
                              <span>{getScopeDescription(template)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Additional Info */}
                        <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t">
                          <div className="flex items-center">
                            <span>Session: {template.session}</span>
                          </div>
                          <div className="flex items-center">
                            {template.lateFee && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <Badge variant="outline" className="text-xs border-amber-200 text-amber-600">
                                      Late fee
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Late fee applies</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="mx-auto h-16 w-16 text-gray-300" />
                <h3 className="mt-4 text-lg font-semibold">No fee templates found</h3>
                <p className="text-gray-500 mt-2">
                  {searchTerm
                    ? `No templates match "${searchTerm}"`
                    : `No active templates for ${selectedSession || 'selected session'}`
                  }
                </p>
                {!searchTerm && (
                  <Button
                    variant="link"
                    className="mt-2"
                    onClick={() => window.location.href = '/finance/fees/templates'}
                  >
                    Create a fee template
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Eligible Students Information */}
      {selectedTemplate && (
        <Card className="border-l-4 border-l-primary">
          <CardHeader>
            <CardTitle>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span>Eligible Students</span>
                  {fetchingEligible && (
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  )}
                </div>
                {eligibleStudentsInfo && (
                  <div className="flex items-center space-x-4">
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">{eligibleStudentsInfo.counts.total}</span> eligible student(s)
                    </div>
                    {eligibleStudentsInfo.counts.alreadyHasFee > 0 && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              {eligibleStudentsInfo.counts.alreadyHasFee} already have this fee
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>These students won't receive the fee unless you force apply</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                )}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Scope Information Card */}
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                <div className="flex items-start">
                  <Info className="h-5 w-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="font-medium text-blue-800">Template Scope Information</h4>
                    <p className="text-sm text-blue-600 mt-1">
                      This fee template is configured to apply to: <strong>{getScopeDescription(selectedTemplate)}</strong>
                    </p>
                    <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="text-sm">
                        <span className="font-medium">Template:</span>{' '}
                        <span className="text-blue-700">{selectedTemplate.title}</span>
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">Amount:</span>{' '}
                        <span className="text-blue-700">{formatCurrency(selectedTemplate.amount)}</span>
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">Session:</span>{' '}
                        <span className="text-blue-700">{eligibleStudentsInfo?.session || selectedSession}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Force Apply Warning */}
              {eligibleStudentsInfo?.counts.alreadyHasFee > 0 && (
                <div className="p-4 bg-amber-50 rounded-lg border border-amber-100">
                  <div className="flex items-start">
                    <AlertCircle className="h-5 w-5 text-amber-500 mr-2 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <label htmlFor="forceApply" className="text-sm font-medium text-amber-800 cursor-pointer">
                          <input
                            type="checkbox"
                            id="forceApply"
                            checked={forceApply}
                            onChange={(e) => setForceApply(e.target.checked)}
                            className="mr-2 rounded border-amber-300 text-amber-600 focus:ring-amber-200"
                          />
                          Force apply (overwrite existing fees)
                        </label>
                        <Badge variant="outline" className="border-amber-200 text-amber-700">
                          {eligibleStudentsInfo.counts.alreadyHasFee} affected
                        </Badge>
                      </div>
                      <p className="text-xs text-amber-600 mt-1 ml-6">
                        When checked, fees will be reapplied even if students already have this fee instance.
                        <strong className="block mt-1">
                          This will overwrite existing fee records for {eligibleStudentsInfo.counts.alreadyHasFee} student(s).
                        </strong>
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Students Table */}
              {loadingEligible ? (
                <div className="space-y-3">
                  <Skeleton className="h-10 w-full" />
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : eligibleStudentsInfo?.eligibleStudents.length > 0 ? (
                <>
                  <div className="overflow-x-auto border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">#</TableHead>
                          <TableHead>Student Name</TableHead>
                          <TableHead>Roll Number</TableHead>
                          <TableHead>Class & Section</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {displayedStudents.map((student, index) => (
                          <TableRow key={student._id}>
                            <TableCell className="font-mono text-sm text-gray-500">
                              {index + 1}
                            </TableCell>
                            <TableCell className="font-medium">
                              <div className="flex items-center">
                                <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center mr-3">
                                  <span className="text-sm font-medium text-gray-600">
                                    {student.name.charAt(0)}
                                  </span>
                                </div>
                                <div>
                                  <div>{student.name}</div>
                                  <div className="text-xs text-gray-500">
                                    ID: {student._id.toString().slice(-6)}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {student.rollNumber || 'N/A'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <div className="text-sm font-medium">
                                  {student.class?.name || 'No Class'}
                                </div>
                                <div className="text-xs text-gray-500">
                                  Section: {student.section?.name || student.section || 'N/A'}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {student.alreadyHasFee ? (
                                <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  Already has fee
                                </Badge>
                              ) : (
                                <Badge className="bg-green-100 text-green-800 border-green-200">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Will receive fee
                                </Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Show More/Less Button */}
                  {eligibleStudentsInfo.eligibleStudents.length > 10 && (
                    <div className="flex justify-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAllStudents(!showAllStudents)}
                        className="text-primary hover:text-primary/80"
                      >
                        {showAllStudents ? (
                          <>
                            <ChevronUp className="h-4 w-4 mr-1" />
                            Show Less
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-4 w-4 mr-1" />
                            Show All {eligibleStudentsInfo.eligibleStudents.length} Students
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </>
              ) : eligibleStudentsInfo?.eligibleStudents.length === 0 ? (
                <div className="text-center py-8 border rounded-lg bg-gray-50">
                  <Users className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-4 text-lg font-semibold">No eligible students found</h3>
                  <p className="text-gray-500">
                    No students match the template's scope criteria for {selectedSession}
                  </p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => {
                      setSelectedTemplate(null)
                      setEligibleStudentsInfo(null)
                    }}
                  >
                    Select Different Template
                  </Button>
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Section */}
      {selectedTemplate && eligibleStudentsInfo && (
        <Card className="bg-gradient-to-r from-gray-50 to-white border-t-4 border-t-primary">
          <CardContent className="pt-6">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
              <div className="space-y-3 flex-1">
                <div className="text-xl font-bold text-gray-900">
                  Ready to Apply: <span className="text-primary">{selectedTemplate.title}</span>
                </div>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center">
                    <div className="w-32">Amount:</div>
                    <div className="font-semibold">{formatCurrency(selectedTemplate.amount)}</div>
                  </div>
                  <div className="flex items-center">
                    <div className="w-32">Scope:</div>
                    <div>{getScopeDescription(selectedTemplate)}</div>
                  </div>
                  <div className="flex items-center">
                    <div className="w-32">Application:</div>
                    <div className={forceApply ? 'font-semibold text-amber-600' : ''}>
                      {forceApply ? (
                        <span>Will apply to ALL {eligibleStudentsInfo.counts.total} students (force mode)</span>
                      ) : (
                        <span>
                          Will apply to {eligibleStudentsInfo.counts.willBeApplied} students
                          {eligibleStudentsInfo.counts.alreadyHasFee > 0 && (
                            <span className="text-amber-600 ml-1">
                              (skipping {eligibleStudentsInfo.counts.alreadyHasFee} existing fees)
                            </span>
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedTemplate(null)
                    setEligibleStudentsInfo(null)
                    setForceApply(false)
                    setShowAllStudents(false)
                  }}
                  disabled={isApplying}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleApplyFees}
                  disabled={isApplying || eligibleStudentsInfo.counts.total === 0}
                  className={`w-full sm:w-auto ${forceApply
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-primary hover:bg-primary/90'
                    }`}
                >
                  {isApplying ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Applying...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      {forceApply ? 'Force Apply Fees' : 'Apply Fees'}
                      <span className="ml-2 font-bold">
                        ({forceApply ? eligibleStudentsInfo.counts.total : eligibleStudentsInfo.counts.willBeApplied})
                      </span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {templates.length}
              </div>
              <div className="text-sm font-medium text-blue-800 mt-1">
                Active Templates
              </div>
              <div className="text-xs text-blue-600 mt-2">
                For {selectedSession || 'selected session'}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {eligibleStudentsInfo?.counts.total || 0}
              </div>
              <div className="text-sm font-medium text-green-800 mt-1">
                Eligible Students
              </div>
              <div className="text-xs text-green-600 mt-2">
                Based on template scope
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-amber-600">
                {eligibleStudentsInfo?.counts.alreadyHasFee || 0}
              </div>
              <div className="text-sm font-medium text-amber-800 mt-1">
                Already Have Fee
              </div>
              <div className="text-xs text-amber-600 mt-2">
                Will be skipped unless forced
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">
                {eligibleStudentsInfo?.counts.willBeApplied || 0}
              </div>
              <div className="text-sm font-medium text-purple-800 mt-1">
                Will Receive Fee
              </div>
              <div className="text-xs text-purple-600 mt-2">
                Ready for application
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Help/Info Section */}
      <Card className="bg-gradient-to-r from-gray-50 to-gray-100">
        <CardContent className="pt-6">
          <div className="flex items-start">
            <Info className="h-5 w-5 text-gray-500 mr-3 mt-0.5 flex-shrink-0" />
            <div className="space-y-2">
              <h4 className="font-medium text-gray-800">How it works:</h4>
              <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                <li>Select a fee template to see which students are eligible based on its scope rules</li>
                <li>Students are automatically selected - you cannot manually select individual students</li>
                <li>If students already have this fee, they will be skipped unless you use "Force Apply"</li>
                <li>All fee applications are logged and can be audited in the ledger</li>
                <li>Make sure you're in the correct academic session before applying fees</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default ApplyFees
// // src/pages/Fees/ApplyFees.jsx
// import { Badge } from '@/components/ui/badge'
// import { Button } from '@/components/ui/button'
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
// import { Checkbox } from '@/components/ui/checkbox'
// import { Input } from '@/components/ui/input'
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
// import { useApplyFeeTemplateMutation, useGetFeeTemplatesQuery } from '@/features/apis/finance/feeApi'
// import { useGetStudentsQuery } from '@/features/apis/studentsApi'
// import { useToast } from '@/hooks/use-toast'
// import { formatCurrency } from '@/lib/utils'
// import { CLASS_OPTIONS, SECTION_OPTIONS, SESSION_OPTIONS } from '@/utils/constants'
// import {
//   CheckCircle,
//   Download,
//   FileText,
//   Search,
//   Users
// } from 'lucide-react'
// import { useState } from 'react'

// const ApplyFees = () => {
//   const [session, setSession] = useState(SESSION_OPTIONS[1].value)
//   const [classId, setClassId] = useState('')
//   const [sectionId, setSectionId] = useState('')
//   const [selectedTemplate, setSelectedTemplate] = useState(null)
//   const [selectedStudents, setSelectedStudents] = useState({})
//   const [searchTerm, setSearchTerm] = useState('')
//   const [forceApply, setForceApply] = useState(false)

//   const { toast } = useToast()
//   const { data: templatesData, isLoading: templatesLoading } = useGetFeeTemplatesQuery({
//     session,
//     isActive: true,
//   })
//   const templates = templatesData?.data || []

//   const { data: students, isLoading: studentsLoading } = useGetStudentsQuery({
//     session,
//     classId: classId || undefined,
//     sectionId: sectionId || undefined,
//     search: searchTerm || undefined,
//     limit: 100,
//   })

//   const [applyFee, { isLoading: isApplying }] = useApplyFeeTemplateMutation()

//   const handleStudentToggle = (studentId) => {
//     setSelectedStudents(prev => ({
//       ...prev,
//       [studentId]: !prev[studentId]
//     }))
//   }

//   const handleSelectAll = () => {
//     if (!students?.length) return

//     const allSelected = Object.keys(selectedStudents).length === students.length
//     const newSelection = {}

//     if (!allSelected) {
//       students.forEach(student => {
//         newSelection[student._id] = true
//       })
//     }

//     setSelectedStudents(newSelection)
//   }

//   const handleApplyFees = async () => {
//     if (!selectedTemplate) {
//       toast({
//         title: 'Error',
//         description: 'Please select a fee template',
//         variant: 'destructive',
//       })
//       return
//     }

//     const selectedCount = Object.values(selectedStudents).filter(v => v).length
//     if (selectedCount === 0) {
//       toast({
//         title: 'Error',
//         description: 'Please select at least one student',
//         variant: 'destructive',
//       })
//       return
//     }

//     try {
//       const result = await applyFee({
//         id: selectedTemplate._id,
//         force: forceApply,
//       }).unwrap()

//       toast({
//         title: 'Success',
//         description: `Fee applied to ${result.appliedTo} students successfully`,
//         variant: 'success',
//       })

//       // Reset selections
//       setSelectedStudents({})
//       setSelectedTemplate(null)
//     } catch (error) {
//       toast({
//         title: 'Error',
//         description: error.data?.message || 'Failed to apply fees',
//         variant: 'destructive',
//       })
//     }
//   }

//   const selectedCount = Object.values(selectedStudents).filter(v => v).length

//   return (
//     <div className="space-y-6">
//       {/* Header */}
//       <div className="flex items-center justify-between">
//         <div>
//           <h1 className="text-3xl font-bold tracking-tight">Apply Fees</h1>
//           <p className="text-muted-foreground">
//             Apply fee templates to selected students
//           </p>
//         </div>
//         <div className="flex items-center space-x-2">
//           <Button variant="outline">
//             <Download className="mr-2 h-4 w-4" />
//             Export
//           </Button>
//         </div>
//       </div>

//       {/* Fee Template Selection */}
//       <Card>
//         <CardHeader>
//           <CardTitle>Select Fee Template</CardTitle>
//         </CardHeader>
//         <CardContent>
//           <div className="space-y-4">
//             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//               <Select value={session} onValueChange={setSession}>
//                 <SelectTrigger>
//                   <SelectValue placeholder="Select session" />
//                 </SelectTrigger>
//                 <SelectContent>
//                   {SESSION_OPTIONS.map((option) => (
//                     <SelectItem key={option.value} value={option.value}>
//                       {option.label}
//                     </SelectItem>
//                   ))}
//                 </SelectContent>
//               </Select>

//               <Select value={classId ?? 'all'}
//                 onValueChange={(value => setClassId(value === 'all' ? '' : value))}>
//                 <SelectTrigger>
//                   <SelectValue placeholder="Filter by class" />
//                 </SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value="all">All Classes</SelectItem>
//                   {CLASS_OPTIONS.map((option) => (
//                     <SelectItem key={option.value} value={option.value}>
//                       {option.label}
//                     </SelectItem>
//                   ))}
//                 </SelectContent>
//               </Select>

//               <Select value={sectionId ?? 'all'}
//                 onValueChange={(value => setSectionId(value === 'all' ? '' : value))}>
//                 <SelectTrigger>
//                   <SelectValue placeholder="Filter by section" />
//                 </SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value="all">All Sections</SelectItem>
//                   {SECTION_OPTIONS.map((option) => (
//                     <SelectItem key={option.value} value={option.value}>
//                       {option.label}
//                     </SelectItem>
//                   ))}
//                 </SelectContent>
//               </Select>
//             </div>

//             {templatesLoading ? (
//               <div className="flex justify-center py-8">
//                 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
//               </div>
//             ) : templates?.length > 0 ? (
//               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//                 {templates.map((template) => (
//                   <Card
//                     key={template._id}
//                     className={`cursor-pointer transition-all hover:shadow-md ${selectedTemplate?._id === template._id
//                       ? 'ring-2 ring-primary border-primary'
//                       : ''
//                       }`}
//                     onClick={() => setSelectedTemplate(template)}
//                   >
//                     <CardContent className="pt-6">
//                       <div className="space-y-3">
//                         <div className="flex items-start justify-between">
//                           <div>
//                             <h3 className="font-semibold">{template.title}</h3>
//                             <p className="text-sm text-gray-500">{template.description}</p>
//                           </div>
//                           <Badge variant="outline">
//                             {template.frequency}
//                           </Badge>
//                         </div>
//                         <div className="text-2xl font-bold text-primary">
//                           {formatCurrency(template.amount)}
//                         </div>
//                         <div className="text-sm text-gray-600">
//                           <div>Applies to: {template.appliesTo.scope}</div>
//                           {template.appliesTo.class && (
//                             <div>Class: {template.appliesTo.class}</div>
//                           )}
//                           {template.appliesTo.section && (
//                             <div>Section: {template.appliesTo.section}</div>
//                           )}
//                         </div>
//                       </div>
//                     </CardContent>
//                   </Card>
//                 ))}
//               </div>
//             ) : (
//               <div className="text-center py-8">
//                 <FileText className="mx-auto h-12 w-12 text-gray-400" />
//                 <h3 className="mt-4 text-lg font-semibold">No fee templates found</h3>
//                 <p className="text-gray-500">Create fee templates first to apply to students</p>
//               </div>
//             )}
//           </div>
//         </CardContent>
//       </Card>

//       {/* Student Selection */}
//       {selectedTemplate && (
//         <Card>
//           <CardHeader>
//             <div className="flex items-center justify-between">
//               <CardTitle>Select Students</CardTitle>
//               <div className="flex items-center space-x-4">
//                 <div className="text-sm text-gray-600">
//                   {selectedCount} student(s) selected
//                 </div>
//                 <Button
//                   variant="outline"
//                   size="sm"
//                   onClick={handleSelectAll}
//                 >
//                   {Object.keys(selectedStudents).length === students?.length ? 'Deselect All' : 'Select All'}
//                 </Button>
//               </div>
//             </div>
//           </CardHeader>
//           <CardContent>
//             <div className="space-y-4">
//               <div className="relative">
//                 <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
//                 <Input
//                   placeholder="Search students..."
//                   className="pl-10"
//                   value={searchTerm}
//                   onChange={(e) => setSearchTerm(e.target.value)}
//                 />
//               </div>

//               <div className="flex items-center space-x-2">
//                 <Checkbox
//                   id="forceApply"
//                   checked={forceApply}
//                   onCheckedChange={(checked) => setForceApply(checked)}
//                 />
//                 <label htmlFor="forceApply" className="text-sm">
//                   Force apply (overwrite existing fees)
//                 </label>
//               </div>

//               {studentsLoading ? (
//                 <div className="flex justify-center py-8">
//                   <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
//                 </div>
//               ) : students?.length > 0 ? (
//                 <div className="overflow-x-auto">
//                   <Table>
//                     <TableHeader>
//                       <TableRow>
//                         <TableHead className="w-12">
//                           <Checkbox
//                             checked={Object.keys(selectedStudents).length === students.length}
//                             onCheckedChange={handleSelectAll}
//                           />
//                         </TableHead>
//                         <TableHead>Student</TableHead>
//                         <TableHead>Roll Number</TableHead>
//                         <TableHead>Class & Section</TableHead>
//                         <TableHead>Fee Category</TableHead>
//                         <TableHead>Status</TableHead>
//                       </TableRow>
//                     </TableHeader>
//                     <TableBody>
//                       {students.map((student) => (
//                         <TableRow key={student._id}>
//                           <TableCell>
//                             <Checkbox
//                               checked={!!selectedStudents[student._id]}
//                               onCheckedChange={() => handleStudentToggle(student._id)}
//                             />
//                           </TableCell>
//                           <TableCell>
//                             <div className="font-medium">{student.name}</div>
//                           </TableCell>
//                           <TableCell>{student.rollNumber}</TableCell>
//                           <TableCell>
//                             <div className="text-sm">
//                               {student.class?.name} - {student.section}
//                             </div>
//                           </TableCell>
//                           <TableCell>
//                             <Badge variant="outline">
//                               {student.feeCategory}
//                             </Badge>
//                           </TableCell>
//                           <TableCell>
//                             <Badge className="bg-green-100 text-green-800">
//                               Active
//                             </Badge>
//                           </TableCell>
//                         </TableRow>
//                       ))}
//                     </TableBody>
//                   </Table>
//                 </div>
//               ) : (
//                 <div className="text-center py-8">
//                   <Users className="mx-auto h-12 w-12 text-gray-400" />
//                   <h3 className="mt-4 text-lg font-semibold">No students found</h3>
//                   <p className="text-gray-500">Try adjusting your filters</p>
//                 </div>
//               )}
//             </div>
//           </CardContent>
//         </Card>
//       )}

//       {/* Action Section */}
//       {selectedTemplate && (
//         <Card>
//           <CardContent className="pt-6">
//             <div className="flex items-center justify-between">
//               <div className="space-y-2">
//                 <div className="text-lg font-semibold">
//                   Selected: {selectedTemplate.title}
//                 </div>
//                 <div className="text-sm text-gray-600">
//                   Amount: {formatCurrency(selectedTemplate.amount)} | Students: {selectedCount}
//                 </div>
//               </div>
//               <div className="flex items-center space-x-4">
//                 <Button
//                   variant="outline"
//                   onClick={() => {
//                     setSelectedTemplate(null)
//                     setSelectedStudents({})
//                   }}
//                 >
//                   Cancel
//                 </Button>
//                 <Button
//                   onClick={handleApplyFees}
//                   disabled={isApplying || selectedCount === 0}
//                 >
//                   {isApplying ? (
//                     <>
//                       <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
//                       Applying...
//                     </>
//                   ) : (
//                     <>
//                       <CheckCircle className="mr-2 h-4 w-4" />
//                       Apply Fees ({selectedCount} students)
//                     </>
//                   )}
//                 </Button>
//               </div>
//             </div>
//           </CardContent>
//         </Card>
//       )}

//       {/* Summary Card */}
//       <Card>
//         <CardHeader>
//           <CardTitle>Application Summary</CardTitle>
//         </CardHeader>
//         <CardContent>
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//             <div className="text-center p-4 bg-blue-50 rounded-lg">
//               <div className="text-2xl font-bold text-blue-600">
//                 {templates?.length || 0}
//               </div>
//               <div className="text-sm text-gray-600">Active Templates</div>
//             </div>
//             <div className="text-center p-4 bg-green-50 rounded-lg">
//               <div className="text-2xl font-bold text-green-600">
//                 {students?.length || 0}
//               </div>
//               <div className="text-sm text-gray-600">Total Students</div>
//             </div>
//             <div className="text-center p-4 bg-purple-50 rounded-lg">
//               <div className="text-2xl font-bold text-purple-600">
//                 {selectedCount}
//               </div>
//               <div className="text-sm text-gray-600">Selected for Application</div>
//             </div>
//           </div>
//         </CardContent>
//       </Card>
//     </div>
//   )
// }

// export default ApplyFees