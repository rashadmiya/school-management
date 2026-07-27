// src/components/fees/FeeTemplateForm.jsx - UPDATED VERSION
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { FEE_SCOPE_OPTIONS, FREQUENCY_OPTIONS } from '@/utils/constants'
import { useCreateFeeTemplateMutation, useUpdateFeeTemplateMutation } from '@/features/apis/finance/feeApi'
import { useAppSelector } from '@/features/store'

// Complete schema matching backend model
const feeTemplateSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  amount: z.number().min(0, 'Amount must be positive'),
  currency: z.string().default('BDT'),
  frequency: z.enum(['one_time', 'monthly', 'quarterly', 'yearly', 'custom']),
  appliesTo: z.object({
    scope: z.enum(['all', 'class', 'section', 'individual']),
    class: z.string().nullable().optional(),
    section: z.string().nullable().optional(),
    individualStudent: z.string().nullable().optional(),
    grade: z.string().nullable().optional(),
  }),
  isActive: z.boolean().default(true),
  dueDay: z.number().min(1).max(31).optional(),
  taxPercentage: z.number().min(0).max(100).optional().default(0),
  lateFee: z.object({
    amount: z.number().optional(),
    percentage: z.number().optional(),
    afterDays: z.number().optional(),
  }).optional(),
  session: z.string(),
  installmentPlan: z.string().optional(),
  allowPartialPayments: z.boolean().default(true),
  // createdBy and updatedBy will be added from user context
})

const FeeTemplateForm = ({ template, classes, onSuccess, onCancel }) => {
  const [scope, setScope] = useState(template?.appliesTo?.scope || 'all')
  const { user } = useAppSelector((state) => state.user)
  const [createFeeTemplate] = useCreateFeeTemplateMutation()
  const [updateFeeTemplate] = useUpdateFeeTemplateMutation()
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm({
    resolver: zodResolver(feeTemplateSchema),
    defaultValues: template || {
      session: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
      isActive: true,
      currency: 'BDT',
      allowPartialPayments: true,
      taxPercentage: 0,
      appliesTo: {
        scope: 'all',
        class: null,
        section: null,
        individualStudent: null,
        grade: null,
      },
    },
  })

  const onSubmit = async (data) => {
    try {
      const payload = {
        ...data,
        createdBy: template ? undefined : user._id, // Only set on create
        updatedBy: user._id, // Always set on update
      }

      if (template) {
        await updateFeeTemplate({ id: template._id, ...payload }).unwrap()
      } else {
        await createFeeTemplate(payload).unwrap()
      }
      
      onSuccess?.()
    } catch (error) {
      console.error('Failed to save fee template:', error)
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Fee Title *</Label>
                <Input
                  id="title"
                  {...register('title')}
                  placeholder="e.g., Tuition Fee, Admission Fee"
                />
                {errors.title && (
                  <p className="text-sm text-red-500">{errors.title.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="amount">Amount (BDT) *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  {...register('amount', { valueAsNumber: true })}
                  placeholder="0.00"
                />
                {errors.amount && (
                  <p className="text-sm text-red-500">{errors.amount.message}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="Fee description and details..."
                rows={3}
              />
            </div>
          </div>

          {/* Frequency, Session, and Tax */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="frequency">Frequency</Label>
              <Select
                onValueChange={(value) => setValue('frequency', value)}
                defaultValue={template?.frequency || 'one_time'}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  {FREQUENCY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="session">Academic Session *</Label>
              <Input
                id="session"
                {...register('session')}
                placeholder="e.g., 2024-2025"
              />
              {errors.session && (
                <p className="text-sm text-red-500">{errors.session.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="taxPercentage">Tax Percentage (%)</Label>
              <Input
                id="taxPercentage"
                type="number"
                step="0.01"
                {...register('taxPercentage', { valueAsNumber: true })}
                placeholder="0"
              />
            </div>
          </div>

          {/* Late Fee Settings */}
          <div className="space-y-4">
            <Label>Late Fee Settings (Optional)</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="lateFeeAmount">Fixed Amount</Label>
                <Input
                  id="lateFeeAmount"
                  type="number"
                  step="0.01"
                  {...register('lateFee.amount', { valueAsNumber: true })}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="lateFeePercentage">Percentage</Label>
                <Input
                  id="lateFeePercentage"
                  type="number"
                  step="0.01"
                  {...register('lateFee.percentage', { valueAsNumber: true })}
                  placeholder="0%"
                />
              </div>
              <div>
                <Label htmlFor="lateFeeAfterDays">Apply After (Days)</Label>
                <Input
                  id="lateFeeAfterDays"
                  type="number"
                  {...register('lateFee.afterDays', { valueAsNumber: true })}
                  placeholder="30"
                />
              </div>
            </div>
          </div>

          {/* Application Scope */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="scope">Apply To *</Label>
              <Select
                onValueChange={(value) => {
                  setScope(value)
                  setValue('appliesTo.scope', value)
                  // Clear dependent fields when scope changes
                  if (value !== 'class' && value !== 'section') {
                    setValue('appliesTo.class', null)
                    setValue('appliesTo.section', null)
                  }
                  if (value !== 'individual') {
                    setValue('appliesTo.individualStudent', null)
                  }
                }}
                defaultValue={template?.appliesTo?.scope || 'all'}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select scope" />
                </SelectTrigger>
                <SelectContent>
                  {FEE_SCOPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Conditional fields based on scope */}
            {(scope === 'class' || scope === 'section') && (
              <div>
                <Label htmlFor="class">Class *</Label>
                <Select
                  onValueChange={(value) => setValue('appliesTo.class', value)}
                  defaultValue={template?.appliesTo?.class || ''}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((cls) => (
                      <SelectItem key={cls._id} value={cls._id}>
                        {cls.name} ({cls?.section?.name || ""})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* {scope === 'section' && (
              <div>
                <Label htmlFor="section">Section *</Label>
                <Select
                  onValueChange={(value) => setValue('appliesTo.section', value)}
                  defaultValue={template?.appliesTo?.section || ''}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select section" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="section-a">Section A</SelectItem>
                    <SelectItem value="section-b">Section B</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )} */}

            {scope === 'individual' && (
              <div>
                <Label htmlFor="individualStudent">Student *</Label>
                <Input
                  id="individualStudent"
                  placeholder="Search or select student..."
                  // TODO: Implement student search/select component
                  {...register('appliesTo.individualStudent')}
                />
              </div>
            )}
          </div>

          {/* Additional Options */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={watch('isActive')}
                onCheckedChange={(checked) => setValue('isActive', checked)}
              />
              <Label htmlFor="isActive">Active (Can be applied to students)</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="allowPartialPayments"
                checked={watch('allowPartialPayments')}
                onCheckedChange={(checked) => setValue('allowPartialPayments', checked)}
              />
              <Label htmlFor="allowPartialPayments">Allow partial payments</Label>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit">
              {template ? 'Update Template' : 'Create Template'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

export default FeeTemplateForm

// // src/components/fees/FeeTemplateForm.jsx
// import { useState } from 'react'
// import { useForm } from 'react-hook-form'
// import { zodResolver } from '@hookform/resolvers/zod'
// import * as z from 'zod'
// import { Button } from '@/components/ui/button'
// import { Input } from '@/components/ui/input'
// import { Textarea } from '@/components/ui/textarea'
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
// import { Label } from '@/components/ui/label'
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
// import { FEE_SCOPE_OPTIONS, FREQUENCY_OPTIONS, SESSION_OPTIONS } from '@/utils/constants'
// import { useCreateFeeTemplateMutation } from '@/features/apis/finance/feeApi'

// const feeTemplateSchema = z.object({
//   title: z.string().min(1, 'Title is required'),
//   description: z.string().optional(),
//   amount: z.number().min(0, 'Amount must be positive'),
//   frequency: z.enum(['one_time', 'monthly', 'quarterly', 'yearly', 'custom']),
//   appliesTo: z.object({
//     scope: z.enum(['all', 'class', 'section', 'individual']),
//     class: z.string().optional(),
//     section: z.string().optional(),
//     individualStudent: z.string().optional(),
//   }),
//   dueDay: z.number().min(1).max(31).optional(),
//   taxPercentage: z.number().min(0).max(100).optional(),
//   session: z.string(),
//   isActive: z.boolean().default(true),
// })

// const FeeTemplateForm = ({ onSuccess, classes }) => {
//   const [scope, setScope] = useState('all')
//   const [createFeeTemplate, { isLoading }] = useCreateFeeTemplateMutation()
  
//   const {
//     register,
//     handleSubmit,
//     formState: { errors },
//     setValue,
//     watch,
//   } = useForm({
//     resolver: zodResolver(feeTemplateSchema),
//     defaultValues: {
//       session: SESSION_OPTIONS[1].value,
//       isActive: true,
//       appliesTo: {
//         scope: 'all',
//       },
//     },
//   })

//   const onSubmit = async (data) => {
//     try {
//       await createFeeTemplate(data).unwrap()
//       onSuccess?.()
//     } catch (error) {
//       console.error('Failed to create fee template:', error)
//     }
//   }

//   return (
//     <Card>
//       <CardHeader>
//         <CardTitle>Create New Fee Template</CardTitle>
//       </CardHeader>
//       <CardContent>
//         <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
//           {/* Basic Information */}
//           <div className="space-y-4">
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               <div>
//                 <Label htmlFor="title">Fee Title *</Label>
//                 <Input
//                   id="title"
//                   {...register('title')}
//                   placeholder="e.g., Tuition Fee, Admission Fee"
//                 />
//                 {errors.title && (
//                   <p className="text-sm text-red-500">{errors.title.message}</p>
//                 )}
//               </div>

//               <div>
//                 <Label htmlFor="amount">Amount (BDT) *</Label>
//                 <Input
//                   id="amount"
//                   type="number"
//                   step="0.01"
//                   {...register('amount', { valueAsNumber: true })}
//                   placeholder="0.00"
//                 />
//                 {errors.amount && (
//                   <p className="text-sm text-red-500">{errors.amount.message}</p>
//                 )}
//               </div>
//             </div>

//             <div>
//               <Label htmlFor="description">Description</Label>
//               <Textarea
//                 id="description"
//                 {...register('description')}
//                 placeholder="Fee description and details..."
//                 rows={3}
//               />
//             </div>
//           </div>

//           {/* Frequency and Session */}
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//             <div>
//               <Label htmlFor="frequency">Frequency</Label>
//               <Select
//                 onValueChange={(value) => setValue('frequency', value)}
//                 defaultValue="one_time"
//               >
//                 <SelectTrigger>
//                   <SelectValue placeholder="Select frequency" />
//                 </SelectTrigger>
//                 <SelectContent>
//                   {FREQUENCY_OPTIONS.map((option) => (
//                     <SelectItem key={option.value} value={option.value}>
//                       {option.label}
//                     </SelectItem>
//                   ))}
//                 </SelectContent>
//               </Select>
//             </div>

//             <div>
//               <Label htmlFor="session">Academic Session</Label>
//               <Select
//                 onValueChange={(value) => setValue('session', value)}
//                 defaultValue={SESSION_OPTIONS[1].value}
//               >
//                 <SelectTrigger>
//                   <SelectValue placeholder="Select session" />
//                 </SelectTrigger>
//                 <SelectContent>
//                   {SESSION_OPTIONS.map((session) => (
//                     <SelectItem key={session.value} value={session.value}>
//                       {session.label}
//                     </SelectItem>
//                   ))}
//                 </SelectContent>
//               </Select>
//             </div>

//             <div>
//               <Label htmlFor="taxPercentage">Tax Percentage</Label>
//               <Input
//                 id="taxPercentage"
//                 type="number"
//                 step="0.01"
//                 {...register('taxPercentage', { valueAsNumber: true })}
//                 placeholder="0%"
//               />
//             </div>
//           </div>

//           {/* Application Scope */}
//           <div className="space-y-4">
//             <div>
//               <Label htmlFor="scope">Apply To</Label>
//               <Select
//                 onValueChange={(value) => {
//                   setScope(value)
//                   setValue('appliesTo.scope', value)
//                 }}
//                 defaultValue="all"
//               >
//                 <SelectTrigger>
//                   <SelectValue placeholder="Select scope" />
//                 </SelectTrigger>
//                 <SelectContent>
//                   {FEE_SCOPE_OPTIONS.map((option) => (
//                     <SelectItem key={option.value} value={option.value}>
//                       {option.label}
//                     </SelectItem>
//                   ))}
//                 </SelectContent>
//               </Select>
//             </div>

//             {/* Conditional fields based on scope */}
//             {scope === 'class' && (
//               <div>
//                 <Label htmlFor="class">Class</Label>
//                 <Select
//                   onValueChange={(value) => setValue('appliesTo.class', value)}
//                 >
//                   <SelectTrigger>
//                     <SelectValue placeholder="Select class" />
//                   </SelectTrigger>
//                   <SelectContent>
//                     {classes.map((cls) => (
//                       <SelectItem key={cls._id} value={cls._id}>
//                         {cls.name}
//                       </SelectItem>
//                     ))}
//                   </SelectContent>
//                 </Select>
//               </div>
//             )}

//             {scope === 'section' && (
//               <div className="grid grid-cols-2 gap-4">
//                 <div>
//                   <Label htmlFor="class">Class</Label>
//                   <Select
//                     onValueChange={(value) => setValue('appliesTo.class', value)}
//                   >
//                     <SelectTrigger>
//                       <SelectValue placeholder="Select class" />
//                     </SelectTrigger>
//                     <SelectContent>
//                       <SelectItem value="class-1">Class 1</SelectItem>
//                       <SelectItem value="class-2">Class 2</SelectItem>
//                     </SelectContent>
//                   </Select>
//                 </div>
//                 <div>
//                   <Label htmlFor="section">Section</Label>
//                   <Select
//                     onValueChange={(value) => setValue('appliesTo.section', value)}
//                   >
//                     <SelectTrigger>
//                       <SelectValue placeholder="Select section" />
//                     </SelectTrigger>
//                     <SelectContent>
//                       <SelectItem value="section-a">Section A</SelectItem>
//                       <SelectItem value="section-b">Section B</SelectItem>
//                     </SelectContent>
//                   </Select>
//                 </div>
//               </div>
//             )}

//             {scope === 'individual' && (
//               <div>
//                 <Label htmlFor="individualStudent">Student</Label>
//                 <Input
//                   id="individualStudent"
//                   placeholder="Search or select student..."
//                   // In real app, use a student search/select component
//                 />
//               </div>
//             )}
//           </div>

//           {/* Additional Options */}
//           <div className="flex items-center space-x-2">
//             <input
//               type="checkbox"
//               id="isActive"
//               {...register('isActive')}
//               className="rounded"
//             />
//             <Label htmlFor="isActive">Active (Can be applied to students)</Label>
//           </div>

//           {/* Submit Button */}
//           <div className="flex justify-end">
//             <Button type="submit" disabled={isLoading}>
//               {isLoading ? 'Creating...' : 'Create Fee Template'}
//             </Button>
//           </div>
//         </form>
//       </CardContent>
//     </Card>
//   )
// }

// export default FeeTemplateForm
