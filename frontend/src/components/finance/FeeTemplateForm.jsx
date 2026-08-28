
// src/components/fees/FeeTemplateForm.jsx

import { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'

import {
  FEE_SCOPE_OPTIONS,
  FREQUENCY_OPTIONS,
} from '@/utils/constants'

import {
  useCreateFeeTemplateMutation,
  useUpdateFeeTemplateMutation,
} from '@/features/apis/finance/feeApi'

import { useAppSelector } from '@/features/store'


// ============================================================
// Validation Schema
// ============================================================

const feeTemplateSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required'),

  description: z
    .string()
    .optional(),

  amount: z
    .number({
      message: 'Amount is required',
    })
    .min(0, 'Amount cannot be negative'),

  currency: z
    .string()
    .default('BDT'),

  frequency: z.enum([
    'one_time',
    'monthly',
    'quarterly',
    'yearly',
    'custom',
  ]),

  appliesTo: z.object({
    scope: z.enum([
      'all',
      'class',
      'section',
      'individual',
    ]),

    class: z
      .string()
      .nullable()
      .optional(),

    section: z
      .string()
      .nullable()
      .optional(),

    individualStudent: z
      .string()
      .nullable()
      .optional(),

    grade: z
      .string()
      .nullable()
      .optional(),
  }),

  isActive: z
    .boolean()
    .default(true),

  dueDay: z
    .number()
    .min(1)
    .max(31)
    .optional(),

  taxPercentage: z
    .number()
    .min(0)
    .max(100)
    .default(0),

  lateFee: z
    .object({
      amount: z
        .number()
        .min(0)
        .optional(),

      percentage: z
        .number()
        .min(0)
        .max(100)
        .optional(),

      afterDays: z
        .number()
        .min(0)
        .optional(),
    })
    .optional(),

  session: z
    .string()
    .min(1, 'Academic session is required'),

  installmentPlan: z
    .string()
    .optional(),

  allowPartialPayments: z
    .boolean()
    .default(true),
})


// ============================================================
// Component
// ============================================================

const FeeTemplateForm = ({
  template,
  classes,
  onSuccess,
  onCancel,
}) => {
  const { user } = useAppSelector(
    (state) => state.user
  )

  const [scope, setScope] = useState(
    template?.appliesTo?.scope || 'all'
  )

  const [createFeeTemplate] =
    useCreateFeeTemplateMutation()

  const [updateFeeTemplate] =
    useUpdateFeeTemplateMutation()


  // ==========================================================
  // Default Values
  // ==========================================================

  const defaultValues = {
    title: template?.title || '',

    description: template?.description || '',

    amount:
      template?.amount !== undefined
        ? Number(template.amount)
        : 0,

    currency:
      template?.currency || 'BDT',

    // IMPORTANT:
    // This fixes the original frequency problem.
    frequency:
      template?.frequency || 'one_time',

    appliesTo: {
      scope:
        template?.appliesTo?.scope || 'all',

      class:
        template?.appliesTo?.class || null,

      section:
        template?.appliesTo?.section || null,

      individualStudent:
        template?.appliesTo?.individualStudent || null,

      grade:
        template?.appliesTo?.grade || null,
    },

    isActive:
      template?.isActive ?? true,

    dueDay:
      template?.dueDay !== undefined
        ? Number(template.dueDay)
        : undefined,

    taxPercentage:
      template?.taxPercentage !== undefined
        ? Number(template.taxPercentage)
        : 0,

    lateFee: {
      amount:
        template?.lateFee?.amount !== undefined
          ? Number(template.lateFee.amount)
          : undefined,

      percentage:
        template?.lateFee?.percentage !== undefined
          ? Number(template.lateFee.percentage)
          : undefined,

      afterDays:
        template?.lateFee?.afterDays !== undefined
          ? Number(template.lateFee.afterDays)
          : undefined,
    },

    session:
      template?.session ||
      `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,

    installmentPlan:
      template?.installmentPlan || '',

    allowPartialPayments:
      template?.allowPartialPayments ?? true,
  }


  // ==========================================================
  // React Hook Form
  // ==========================================================

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    control,
  } = useForm({
    resolver: zodResolver(feeTemplateSchema),
    defaultValues,
  })


  // ==========================================================
  // Watched Values
  // ==========================================================

  const feeAmount = watch('amount')

  const lateFeeAmount =
    watch('lateFee.amount')

  const lateFeePercentage =
    watch('lateFee.percentage')


  // ==========================================================
  // Late Fee Calculation
  //
  // Fee Amount = 1000
  //
  // Late Fee Amount = 50
  // Percentage = 50 / 1000 * 100 = 5%
  //
  // OR
  //
  // Percentage = 5%
  // Amount = 1000 * 5 / 100 = 50
  // ==========================================================

  const calculatePercentageFromAmount = () => {
    const fee = Number(feeAmount)
    const lateAmount = Number(lateFeeAmount)

    if (
      !Number.isFinite(fee) ||
      fee <= 0 ||
      !Number.isFinite(lateAmount) ||
      lateAmount < 0
    ) {
      return
    }

    const percentage =
      (lateAmount / fee) * 100

    setValue(
      'lateFee.percentage',
      Number(percentage.toFixed(2)),
      {
        shouldValidate: true,
      }
    )
  }


  const calculateAmountFromPercentage = () => {
    const fee = Number(feeAmount)
    const percentage = Number(lateFeePercentage)

    if (
      !Number.isFinite(fee) ||
      fee <= 0 ||
      !Number.isFinite(percentage) ||
      percentage < 0
    ) {
      return
    }

    const amount =
      (fee * percentage) / 100

    setValue(
      'lateFee.amount',
      Number(amount.toFixed(2)),
      {
        shouldValidate: true,
      }
    )
  }


  // ==========================================================
  // Keep Late Fee Percentage in Sync when Fee Amount Changes
  //
  // Example:
  //
  // Fee = 1000
  // Late fee = 50
  //
  // Change fee to 2000
  // Percentage remains 5%
  // Late fee automatically becomes 100
  // ==========================================================

  useEffect(() => {
    const fee = Number(feeAmount)
    const percentage = Number(lateFeePercentage)

    if (
      !Number.isFinite(fee) ||
      fee <= 0 ||
      !Number.isFinite(percentage) ||
      percentage < 0
    ) {
      return
    }

    const calculatedAmount =
      (fee * percentage) / 100

    const currentAmount =
      Number(lateFeeAmount)

    if (
      !Number.isFinite(currentAmount) ||
      Math.abs(
        currentAmount - calculatedAmount
      ) > 0.001
    ) {
      setValue(
        'lateFee.amount',
        Number(calculatedAmount.toFixed(2))
      )
    }
  }, [
    feeAmount,
    lateFeePercentage,
  ])


  // ==========================================================
  // Scope Change
  // ==========================================================

  const handleScopeChange = (value) => {
    setScope(value)

    setValue(
      'appliesTo.scope',
      value,
      {
        shouldValidate: true,
      }
    )

    if (
      value !== 'class' &&
      value !== 'section'
    ) {
      setValue(
        'appliesTo.class',
        null
      )

      setValue(
        'appliesTo.section',
        null
      )
    }

    if (value !== 'individual') {
      setValue(
        'appliesTo.individualStudent',
        null
      )
    }
  }


  // ==========================================================
  // Submit
  // ==========================================================

  const onSubmit = async (data) => {
    console.log(
      '✅ on submit fees template'
    )

    try {
      // const payload = {
      //   ...data,

      //   // Only create should have createdBy
      //   ...(template
      //     ? {}
      //     : {
      //         createdBy: user?._id,
      //       }),

      //   // Update always gets updatedBy
      //   updatedBy: user?._id,
      // }

      const payload = {
        ...data,

        ...(data.installmentPlan
          ? {
            installmentPlan: data.installmentPlan,
          }
          : {
            installmentPlan: undefined,
          }),

        ...(template
          ? {}
          : {
            createdBy: user?._id,
          }),

        updatedBy: user?._id,
      }

      console.log(
        '📦 Fee template payload:',
        payload
      )

      if (template) {
        await updateFeeTemplate({
          id: template._id,
          ...payload,
        }).unwrap()
      } else {
        await createFeeTemplate(
          payload
        ).unwrap()
      }

      onSuccess?.()
    } catch (error) {
      console.error(
        '❌ Failed to save fee template:',
        error
      )
    }
  }


  // ==========================================================
  // Validation Error
  // ==========================================================

  const onInvalid = (formErrors) => {
    console.error(
      '❌ Fee template validation errors:',
      formErrors
    )
  }


  // ==========================================================
  // Render
  // ==========================================================

  return (
    <Card>
      <CardContent className="pt-6">

        <form
          onSubmit={handleSubmit(
            onSubmit,
            onInvalid
          )}
          className="space-y-6"
        >

          {/* ==================================================
              BASIC INFORMATION
          ================================================== */}

          <div className="space-y-4">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* Title */}

              <div>
                <Label htmlFor="title">
                  Fee Title *
                </Label>

                <Input
                  id="title"
                  {...register('title')}
                  placeholder="e.g., Tuition Fee, Admission Fee"
                />

                {errors.title && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.title.message}
                  </p>
                )}
              </div>


              {/* Amount */}

              <div>
                <Label htmlFor="amount">
                  Amount (BDT) *
                </Label>

                <Input
                  id="amount"
                  type="number"
                  min="0"
                  step="0.01"
                  {...register(
                    'amount',
                    {
                      valueAsNumber: true,
                    }
                  )}
                  placeholder="0.00"
                />

                {errors.amount && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.amount.message}
                  </p>
                )}
              </div>

            </div>


            {/* Description */}

            <div>
              <Label htmlFor="description">
                Description
              </Label>

              <Textarea
                id="description"
                {...register('description')}
                placeholder="Fee description and details..."
                rows={3}
              />
            </div>

          </div>


          {/* ==================================================
              FREQUENCY / SESSION / TAX
          ================================================== */}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            {/* Frequency */}

            <div>
              <Label>
                Frequency *
              </Label>

              <Controller
                name="frequency"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>

                    <SelectContent>
                      {FREQUENCY_OPTIONS.map(
                        (option) => (
                          <SelectItem
                            key={option.value}
                            value={option.value}
                          >
                            {option.label}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                )}
              />

              {errors.frequency && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.frequency.message}
                </p>
              )}
            </div>


            {/* Session */}

            <div>
              <Label htmlFor="session">
                Academic Session *
              </Label>

              <Input
                id="session"
                {...register('session')}
                placeholder="e.g., 2024-2025"
              />

              {errors.session && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.session.message}
                </p>
              )}
            </div>


            {/* Tax */}

            <div>
              <Label htmlFor="taxPercentage">
                Tax Percentage (%)
              </Label>

              <Input
                id="taxPercentage"
                type="number"
                min="0"
                max="100"
                step="0.01"
                {...register(
                  'taxPercentage',
                  {
                    valueAsNumber: true,
                  }
                )}
                placeholder="0"
              />

              {errors.taxPercentage && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.taxPercentage.message}
                </p>
              )}
            </div>

          </div>


          {/* ==================================================
              LATE FEE
          ================================================== */}

          <div className="space-y-4">

            <div>
              <Label>
                Late Fee Settings (Optional)
              </Label>

              <p className="text-sm text-muted-foreground mt-1">
                Enter either the fixed amount or percentage.
                The other value will be calculated automatically.
              </p>
            </div>


            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

              {/* Late Fee Amount */}

              <div>
                <Label htmlFor="lateFeeAmount">
                  Fixed Amount
                </Label>

                <Input
                  id="lateFeeAmount"
                  type="number"
                  min="0"
                  step="0.01"
                  {...register(
                    'lateFee.amount',
                    {
                      valueAsNumber: true,
                      onBlur:
                        calculatePercentageFromAmount,
                    }
                  )}
                  placeholder="0.00"
                />

                {errors.lateFee?.amount && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.lateFee.amount.message}
                  </p>
                )}
              </div>


              {/* Late Fee Percentage */}

              <div>
                <Label htmlFor="lateFeePercentage">
                  Percentage (%)
                </Label>

                <Input
                  id="lateFeePercentage"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  {...register(
                    'lateFee.percentage',
                    {
                      valueAsNumber: true,
                      onBlur:
                        calculateAmountFromPercentage,
                    }
                  )}
                  placeholder="0%"
                />

                {errors.lateFee?.percentage && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.lateFee.percentage.message}
                  </p>
                )}
              </div>


              {/* After Days */}

              <div>
                <Label htmlFor="lateFeeAfterDays">
                  Apply After (Days)
                </Label>

                <Input
                  id="lateFeeAfterDays"
                  type="number"
                  min="0"
                  {...register(
                    'lateFee.afterDays',
                    {
                      valueAsNumber: true,
                    }
                  )}
                  placeholder="30"
                />

                {errors.lateFee?.afterDays && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.lateFee.afterDays.message}
                  </p>
                )}
              </div>

            </div>

          </div>


          {/* ==================================================
              APPLICATION SCOPE
          ================================================== */}

          <div className="space-y-4">

            <div>
              <Label>
                Apply To *
              </Label>

              <Controller
                name="appliesTo.scope"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={handleScopeChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select scope" />
                    </SelectTrigger>

                    <SelectContent>
                      {FEE_SCOPE_OPTIONS.map(
                        (option) => (
                          <SelectItem
                            key={option.value}
                            value={option.value}
                          >
                            {option.label}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                )}
              />

              {errors.appliesTo?.scope && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.appliesTo.scope.message}
                </p>
              )}
            </div>


            {/* Class */}

            {(scope === 'class' ||
              scope === 'section') && (
                <div>
                  <Label>
                    Class *
                  </Label>

                  <Controller
                    name="appliesTo.class"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value || ''}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select class" />
                        </SelectTrigger>

                        <SelectContent>
                          {classes.map(
                            (cls) => (
                              <SelectItem
                                key={cls._id}
                                value={cls._id}
                              >
                                {cls.name}
                                {cls?.section?.name
                                  ? ` (${cls.section.name})`
                                  : ''}
                              </SelectItem>
                            )
                          )}
                        </SelectContent>
                      </Select>
                    )}
                  />

                  {errors.appliesTo?.class && (
                    <p className="text-sm text-red-500 mt-1">
                      {errors.appliesTo.class.message}
                    </p>
                  )}
                </div>
              )}


            {/* Individual Student */}

            {scope === 'individual' && (
              <div>
                <Label htmlFor="individualStudent">
                  Student *
                </Label>

                <Input
                  id="individualStudent"
                  placeholder="Search or select student..."
                  {...register(
                    'appliesTo.individualStudent'
                  )}
                />

                {errors.appliesTo?.individualStudent && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.appliesTo.individualStudent.message}
                  </p>
                )}
              </div>
            )}

          </div>


          {/* ==================================================
              ADDITIONAL OPTIONS
          ================================================== */}

          <div className="space-y-4">

            {/* Active */}

            <div className="flex items-center space-x-2">

              <Controller
                name="isActive"
                control={control}
                render={({ field }) => (
                  <Switch
                    id="isActive"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />

              <Label htmlFor="isActive">
                Active (Can be applied to students)
              </Label>

            </div>


            {/* Partial Payments */}

            <div className="flex items-center space-x-2">

              <Controller
                name="allowPartialPayments"
                control={control}
                render={({ field }) => (
                  <Switch
                    id="allowPartialPayments"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />

              <Label htmlFor="allowPartialPayments">
                Allow partial payments
              </Label>

            </div>

          </div>


          {/* ==================================================
              SUBMIT BUTTONS
          ================================================== */}

          <div className="flex justify-end space-x-4">

            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? 'Saving...'
                : template
                  ? 'Update Template'
                  : 'Create Template'}
            </Button>

          </div>

        </form>
      </CardContent>
    </Card>
  )
}

export default FeeTemplateForm


// // src/components/fees/FeeTemplateForm.jsx - UPDATED VERSION
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
// import { Switch } from '@/components/ui/switch'
// import { FEE_SCOPE_OPTIONS, FREQUENCY_OPTIONS } from '@/utils/constants'
// import { useCreateFeeTemplateMutation, useUpdateFeeTemplateMutation } from '@/features/apis/finance/feeApi'
// import { useAppSelector } from '@/features/store'

// // Complete schema matching backend model
// const feeTemplateSchema = z.object({
//   title: z.string().min(1, 'Title is required'),
//   description: z.string().optional(),
//   amount: z.number().min(0, 'Amount must be positive'),
//   currency: z.string().default('BDT'),
//   frequency: z.enum(['one_time', 'monthly', 'quarterly', 'yearly', 'custom']),
//   appliesTo: z.object({
//     scope: z.enum(['all', 'class', 'section', 'individual']),
//     class: z.string().nullable().optional(),
//     section: z.string().nullable().optional(),
//     individualStudent: z.string().nullable().optional(),
//     grade: z.string().nullable().optional(),
//   }),
//   isActive: z.boolean().default(true),
//   dueDay: z.number().min(1).max(31).optional(),
//   taxPercentage: z.number().min(0).max(100).optional().default(0),
//   lateFee: z.object({
//     amount: z.number().optional(),
//     percentage: z.number().optional(),
//     afterDays: z.number().optional(),
//   }).optional(),
//   session: z.string(),
//   installmentPlan: z.string().optional(),
//   allowPartialPayments: z.boolean().default(true),
//   // createdBy and updatedBy will be added from user context
// })

// const FeeTemplateForm = ({ template, classes, onSuccess, onCancel }) => {
//   const [scope, setScope] = useState(template?.appliesTo?.scope || 'all')
//   const { user } = useAppSelector((state) => state.user)
//   const [createFeeTemplate] = useCreateFeeTemplateMutation()
//   const [updateFeeTemplate] = useUpdateFeeTemplateMutation()

//   const {
//     register,
//     handleSubmit,
//     formState: { errors },
//     setValue,
//     watch,
//     reset,
//   } = useForm({
//     resolver: zodResolver(feeTemplateSchema),
//     defaultValues: template || {
//       session: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
//       isActive: true,
//       currency: 'BDT',
//       allowPartialPayments: true,
//       taxPercentage: 0,
//       appliesTo: {
//         scope: 'all',
//         class: null,
//         section: null,
//         individualStudent: null,
//         grade: null,
//       },
//     },
//   })

//   const onSubmit = async (data) => {
//     console.log("on submit fees template")
//     try {
//       const payload = {
//         ...data,
//         createdBy: template ? undefined : user._id, // Only set on create
//         updatedBy: user._id, // Always set on update
//       }

//       console.log("creating fee template:", payload)
//       if (template) {
//         await updateFeeTemplate({ id: template._id, ...payload }).unwrap()
//       } else {
//         await createFeeTemplate(payload).unwrap()
//       }

//       onSuccess?.()
//     } catch (error) {
//       console.error('Failed to save fee template:', error)
//     }
//   }

//   return (
//     <Card>
//       <CardContent className="pt-6">
//         <form
//           onSubmit={handleSubmit(
//             onSubmit,
//             (errors) => {
//               console.log('❌ Fee template validation errors:', errors)
//             }
//           )}
//           className="space-y-6"
//         >
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

//           {/* Frequency, Session, and Tax */}
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//             <div>
//               <Label htmlFor="frequency">Frequency</Label>
//               <Select
//                 onValueChange={(value) => setValue('frequency', value)}
//                 defaultValue={template?.frequency || 'one_time'}
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
//               <Label htmlFor="session">Academic Session *</Label>
//               <Input
//                 id="session"
//                 {...register('session')}
//                 placeholder="e.g., 2024-2025"
//               />
//               {errors.session && (
//                 <p className="text-sm text-red-500">{errors.session.message}</p>
//               )}
//             </div>

//             <div>
//               <Label htmlFor="taxPercentage">Tax Percentage (%)</Label>
//               <Input
//                 id="taxPercentage"
//                 type="number"
//                 step="0.01"
//                 {...register('taxPercentage', { valueAsNumber: true })}
//                 placeholder="0"
//               />
//             </div>
//           </div>

//           {/* Late Fee Settings */}
//           <div className="space-y-4">
//             <Label>Late Fee Settings (Optional)</Label>
//             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//               <div>
//                 <Label htmlFor="lateFeeAmount">Fixed Amount</Label>
//                 <Input
//                   id="lateFeeAmount"
//                   type="number"
//                   step="0.01"
//                   {...register('lateFee.amount', { valueAsNumber: true })}
//                   placeholder="0.00"
//                 />
//               </div>
//               <div>
//                 <Label htmlFor="lateFeePercentage">Percentage</Label>
//                 <Input
//                   id="lateFeePercentage"
//                   type="number"
//                   step="0.01"
//                   {...register('lateFee.percentage', { valueAsNumber: true })}
//                   placeholder="0%"
//                 />
//               </div>
//               <div>
//                 <Label htmlFor="lateFeeAfterDays">Apply After (Days)</Label>
//                 <Input
//                   id="lateFeeAfterDays"
//                   type="number"
//                   {...register('lateFee.afterDays', { valueAsNumber: true })}
//                   placeholder="30"
//                 />
//               </div>
//             </div>
//           </div>

//           {/* Application Scope */}
//           <div className="space-y-4">
//             <div>
//               <Label htmlFor="scope">Apply To *</Label>
//               <Select
//                 onValueChange={(value) => {
//                   setScope(value)
//                   setValue('appliesTo.scope', value)
//                   // Clear dependent fields when scope changes
//                   if (value !== 'class' && value !== 'section') {
//                     setValue('appliesTo.class', null)
//                     setValue('appliesTo.section', null)
//                   }
//                   if (value !== 'individual') {
//                     setValue('appliesTo.individualStudent', null)
//                   }
//                 }}
//                 defaultValue={template?.appliesTo?.scope || 'all'}
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
//             {(scope === 'class' || scope === 'section') && (
//               <div>
//                 <Label htmlFor="class">Class *</Label>
//                 <Select
//                   onValueChange={(value) => setValue('appliesTo.class', value)}
//                   defaultValue={template?.appliesTo?.class || ''}
//                 >
//                   <SelectTrigger>
//                     <SelectValue placeholder="Select class" />
//                   </SelectTrigger>
//                   <SelectContent>
//                     {classes.map((cls) => (
//                       <SelectItem key={cls._id} value={cls._id}>
//                         {cls.name} ({cls?.section?.name || ""})
//                       </SelectItem>
//                     ))}
//                   </SelectContent>
//                 </Select>
//               </div>
//             )}

//             {/* {scope === 'section' && (
//               <div>
//                 <Label htmlFor="section">Section *</Label>
//                 <Select
//                   onValueChange={(value) => setValue('appliesTo.section', value)}
//                   defaultValue={template?.appliesTo?.section || ''}
//                 >
//                   <SelectTrigger>
//                     <SelectValue placeholder="Select section" />
//                   </SelectTrigger>
//                   <SelectContent>
//                     <SelectItem value="section-a">Section A</SelectItem>
//                     <SelectItem value="section-b">Section B</SelectItem>
//                   </SelectContent>
//                 </Select>
//               </div>
//             )} */}

//             {scope === 'individual' && (
//               <div>
//                 <Label htmlFor="individualStudent">Student *</Label>
//                 <Input
//                   id="individualStudent"
//                   placeholder="Search or select student..."
//                   // TODO: Implement student search/select component
//                   {...register('appliesTo.individualStudent')}
//                 />
//               </div>
//             )}
//           </div>

//           {/* Additional Options */}
//           <div className="space-y-4">
//             <div className="flex items-center space-x-2">
//               <Switch
//                 id="isActive"
//                 checked={watch('isActive')}
//                 onCheckedChange={(checked) => setValue('isActive', checked)}
//               />
//               <Label htmlFor="isActive">Active (Can be applied to students)</Label>
//             </div>

//             <div className="flex items-center space-x-2">
//               <Switch
//                 id="allowPartialPayments"
//                 checked={watch('allowPartialPayments')}
//                 onCheckedChange={(checked) => setValue('allowPartialPayments', checked)}
//               />
//               <Label htmlFor="allowPartialPayments">Allow partial payments</Label>
//             </div>
//           </div>

//           {/* Submit Buttons */}
//           <div className="flex justify-end space-x-4">
//             <Button type="button" variant="outline" onClick={onCancel}>
//               Cancel
//             </Button>
//             <Button type="submit">
//               {template ? 'Update Template' : 'Create Template'}
//             </Button>
//           </div>
//         </form>
//       </CardContent>
//     </Card>
//   )
// }

// export default FeeTemplateForm