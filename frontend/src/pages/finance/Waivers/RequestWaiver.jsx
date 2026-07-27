// src/pages/Waivers/RequestWaiver.jsx
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { useGetStudentFeesQuery } from '@/features/apis/finance/feeApi'
import { useGetEligibleWaiverQuery, useRequestWaiverMutation } from '@/features/apis/finance/waiverApi'
import { useToast } from '@/hooks/use-toast'
import { useStudentSearch } from '@/hooks/useStudentSearch'
import { formatCurrency, formatDate } from '@/lib/formaters'
import { WAIVER_TYPES } from '@/utils/constants'
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  FileText,
  Percent,
  Search,
  Upload,
  User,
  X
} from 'lucide-react'
import { useState } from 'react'

const RequestWaiver = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [selectedFee, setSelectedFee] = useState(null)
  const [waiverType, setWaiverType] = useState('')
  const [waiverAmount, setWaiverAmount] = useState('')
  const [waiverPercentage, setWaiverPercentage] = useState('')
  const [reason, setReason] = useState('')
  const [documents, setDocuments] = useState([])
  const [effectiveFrom, setEffectiveFrom] = useState('')
  const [effectiveUntil, setEffectiveUntil] = useState('')

  const { toast } = useToast()

  const {
    results: searchResults,
    isLoading: searchLoading
  } = useStudentSearch(
    searchTerm, {
    fields: 'name,rollNumber,religion',
    limit: 10,
  })

  const { data: studentFees } = useGetStudentFeesQuery(
    selectedStudent ? { studentId: selectedStudent._id } : null,
    { skip: !selectedStudent }
  )

  const { data: eligibility } = useGetEligibleWaiverQuery(selectedFee?._id, {
    skip: !selectedFee,
  })

  const [requestWaiver, { isLoading: isSubmitting }] = useRequestWaiverMutation()

  const handleStudentSelect = (student) => {
    setSelectedStudent(student)
    setSelectedFee(null)
    resetForm()
  }

  const handleFeeSelect = (fee) => {
    setSelectedFee(fee)
    resetForm()
  }

  const handleDocumentUpload = (event) => {
    const files = Array.from(event.target.files)
    const newDocuments = files.map(file => ({
      name: file.name,
      url: URL.createObjectURL(file),
      uploadedAt: new Date(),
    }))
    setDocuments([...documents, ...newDocuments])
  }

  const removeDocument = (index) => {
    const newDocuments = [...documents]
    newDocuments.splice(index, 1)
    setDocuments(newDocuments)
  }

  const resetForm = () => {
    setWaiverType('')
    setWaiverAmount('')
    setWaiverPercentage('')
    setReason('')
    setDocuments([])
    setEffectiveFrom('')
    setEffectiveUntil('')
  }

  const calculateWaiverAmount = () => {
    if (!selectedFee) return 0

    if (waiverPercentage) {
      return (selectedFee.totalAmount * parseFloat(waiverPercentage)) / 100
    }

    return parseFloat(waiverAmount) || 0
  }

  const handleSubmit = async () => {
    if (!selectedFee || !waiverType || !reason) {
      toast({
        title: 'Error',
        description: 'Please fill all required fields',
        variant: 'destructive',
      })
      return
    }

    const waiverAmountValue = calculateWaiverAmount()
    if (waiverAmountValue <= 0) {
      toast({
        title: 'Error',
        description: 'Waiver amount must be greater than 0',
        variant: 'destructive',
      })
      return
    }

    if (waiverAmountValue > (eligibility?.maxWaivable || 0)) {
      toast({
        title: 'Error',
        description: `Waiver amount exceeds maximum waivable amount of ${formatCurrency(eligibility.maxWaivable)}`,
        variant: 'destructive',
      })
      return
    }

    try {
      const waiverData = {
        feeInstanceId: selectedFee._id,
        type: waiverType,
        reason,
        supportingDocuments: documents,
      }

      if (waiverPercentage) {
        waiverData.percentage = parseFloat(waiverPercentage)
      } else {
        waiverData.amount = waiverAmountValue
      }

      if (effectiveFrom) {
        waiverData.effectiveFrom = new Date(effectiveFrom)
      }

      if (effectiveUntil) {
        waiverData.effectiveUntil = new Date(effectiveUntil)
      }

      const result = await requestWaiver(waiverData).unwrap()

      toast({
        title: 'Success',
        description: 'Waiver request submitted successfully',
        variant: 'success',
      })

      // Reset everything
      setSelectedStudent(null)
      setSelectedFee(null)
      resetForm()
      setSearchTerm('')
    } catch (error) {
      toast({
        title: 'Error',
        description: error.data?.message || 'Failed to submit waiver request',
        variant: 'destructive',
      })
    }
  }

  const waiverAmountValue = calculateWaiverAmount()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Request Fee Waiver</h1>
          <p className="text-muted-foreground">
            Submit waiver requests for student fees
          </p>
        </div>
      </div>

      {/* Student Selection */}
      <Card>
        <CardHeader>
          <CardTitle>1. Select Student</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search student by name or roll number..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {searchResults && searchResults.length > 0 && searchTerm.length >= 2 && (
              <div className="border rounded-md max-h-60 overflow-auto">
                {searchResults.map((student) => (
                  <div
                    key={student._id}
                    className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                    onClick={() => handleStudentSelect(student)}
                  >
                    <div className="font-medium">{student.name}</div>
                    <div className="text-sm text-gray-500">
                      Roll: {student.rollNumber} | Class: {student.class?.name}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {selectedStudent && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium">{selectedStudent.name}</div>
                      <div className="text-sm text-gray-500">
                        Roll: {selectedStudent.rollNumber} | Class: {selectedStudent.class?.name}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedStudent(null)
                      setSelectedFee(null)
                      resetForm()
                    }}
                  >
                    Change
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Fee Selection */}
      {selectedStudent && (
        <Card>
          <CardHeader>
            <CardTitle>2. Select Fee to Waive</CardTitle>
          </CardHeader>
          <CardContent>
            {studentFees?.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fee Title</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Total Amount</TableHead>
                      <TableHead>Already Waived</TableHead>
                      <TableHead>Max Waivable</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {studentFees.map((fee) => (
                      <TableRow
                        key={fee._id}
                        className={`cursor-pointer ${selectedFee?._id === fee._id
                          ? 'bg-primary/5'
                          : 'hover:bg-gray-50'
                          }`}
                        onClick={() => handleFeeSelect(fee)}
                      >
                        <TableCell>
                          <div className="font-medium">{fee.feeTemplate?.title}</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Calendar className="mr-2 h-4 w-4 text-gray-400" />
                            {formatDate(fee.dueDate)}
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold">
                          {formatCurrency(fee.totalAmount)}
                        </TableCell>
                        <TableCell>
                          <div className="text-blue-600">
                            {formatCurrency(fee.waivedAmount || 0)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-green-600 font-medium">
                            {formatCurrency(fee.totalAmount - (fee.waivedAmount || 0))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={
                            fee.status === 'paid'
                              ? 'bg-green-100 text-green-800'
                              : fee.status === 'partial'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                          }>
                            {fee.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleFeeSelect(fee)
                            }}
                          >
                            Select
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-4 text-lg font-semibold">No fees found</h3>
                <p className="text-gray-500">This student has no fees</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Waiver Details */}
      {selectedFee && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>3. Waiver Details</CardTitle>
              {eligibility && (
                <div className="text-sm text-gray-500">
                  Max waivable: {formatCurrency(eligibility.maxWaivable)}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Selected Fee Info */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-sm text-gray-500">Fee Title</div>
                    <div className="font-medium">{selectedFee.feeTemplate?.title}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Total Amount</div>
                    <div className="font-medium text-green-600">
                      {formatCurrency(selectedFee.totalAmount)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Already Waived</div>
                    <div className="font-medium text-blue-600">
                      {formatCurrency(selectedFee.waivedAmount || 0)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Max Waivable</div>
                    <div className="font-medium text-purple-600">
                      {formatCurrency(eligibility?.maxWaivable || 0)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Waiver Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Waiver Type *
                    </label>
                    <Select value={waiverType} onValueChange={setWaiverType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select waiver type" />
                      </SelectTrigger>
                      <SelectContent>
                        {WAIVER_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Waiver Amount or Percentage *
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Amount"
                          value={waiverAmount}
                          onChange={(e) => {
                            setWaiverAmount(e.target.value)
                            setWaiverPercentage('')
                          }}
                          disabled={!!waiverPercentage}
                        />
                      </div>
                      <div>
                        <div className="relative">
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="Percentage"
                            value={waiverPercentage}
                            onChange={(e) => {
                              setWaiverPercentage(e.target.value)
                              setWaiverAmount('')
                            }}
                            disabled={!!waiverAmount}
                          />
                          <div className="absolute inset-y-0 right-3 flex items-center">
                            <span className="text-gray-500">%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Effective Dates
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Input
                          type="date"
                          placeholder="From"
                          value={effectiveFrom}
                          onChange={(e) => setEffectiveFrom(e.target.value)}
                        />
                      </div>
                      <div>
                        <Input
                          type="date"
                          placeholder="Until"
                          value={effectiveUntil}
                          onChange={(e) => setEffectiveUntil(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Reason for Waiver *
                    </label>
                    <Textarea
                      placeholder="Explain why this waiver is needed..."
                      rows={4}
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Supporting Documents
                    </label>
                    <div className="space-y-2">
                      <div className="flex items-center justify-center w-full">
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Upload className="w-8 h-8 mb-2 text-gray-500" />
                            <p className="text-sm text-gray-500">
                              <span className="font-semibold">Click to upload</span> or drag and drop
                            </p>
                            <p className="text-xs text-gray-500">PDF, DOC, JPG, PNG (MAX. 5MB)</p>
                          </div>
                          <input
                            type="file"
                            className="hidden"
                            multiple
                            onChange={handleDocumentUpload}
                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                          />
                        </label>
                      </div>

                      {documents.length > 0 && (
                        <div className="space-y-2">
                          {documents.map((doc, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <div className="flex items-center space-x-3">
                                <FileText className="h-5 w-5 text-gray-400" />
                                <div>
                                  <div className="text-sm font-medium">{doc.name}</div>
                                  <div className="text-xs text-gray-500">
                                    Uploaded {formatDate(doc.uploadedAt)}
                                  </div>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeDocument(index)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Calculation Preview */}
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-lg font-semibold">Waiver Calculation</div>
                  <div className="text-2xl font-bold text-purple-600">
                    {formatCurrency(waiverAmountValue)}
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  {waiverPercentage ? (
                    <span>{waiverPercentage}% of {formatCurrency(selectedFee.totalAmount)} = {formatCurrency(waiverAmountValue)}</span>
                  ) : (
                    <span>Fixed amount: {formatCurrency(waiverAmountValue)}</span>
                  )}
                </div>
                {eligibility && waiverAmountValue > eligibility.maxWaivable && (
                  <div className="flex items-center mt-2 text-sm text-red-600">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Amount exceeds maximum waivable amount by {formatCurrency(waiverAmountValue - eligibility.maxWaivable)}
                  </div>
                )}
                {eligibility && waiverAmountValue <= eligibility.maxWaivable && waiverAmountValue > 0 && (
                  <div className="flex items-center mt-2 text-sm text-green-600">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    This waiver will cover {Math.round((waiverAmountValue / selectedFee.totalAmount) * 100)}% of the total fee
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="border-t pt-6">
                <div className="flex items-center justify-between">
                  <div className="text-lg font-semibold">
                    Waiver Amount: {formatCurrency(waiverAmountValue)}
                  </div>
                  <div className="flex items-center space-x-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedFee(null)
                        resetForm()
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      disabled={isSubmitting || !waiverType || !reason || waiverAmountValue <= 0}
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Percent className="mr-2 h-4 w-4" />
                          Submit Waiver Request
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default RequestWaiver