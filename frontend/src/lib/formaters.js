// src/lib/formatters.js
import { format, formatDistanceToNow } from 'date-fns'

export const formatCurrency = (amount, currency = 'BDT') => {
  return new Intl.NumberFormat('en-BD', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export const formatDate = (date, formatStr = 'dd MMM yyyy') => {
  if (!date) return 'N/A'
  try {
    return format(new Date(date), formatStr)
  } catch (error) {
    return 'Invalid Date'
  }
}

export const formatDateTime = (date) => {
  return formatDate(date, 'dd MMM yyyy, hh:mm a')
}

export const formatRelativeTime = (date) => {
  if (!date) return 'N/A'
  try {
    return formatDistanceToNow(new Date(date), { addSuffix: true })
  } catch (error) {
    return 'Invalid Date'
  }
}

export const getStatusColor = (status, type = 'fee') => {
  const statusColors = {
    fee: {
      unpaid: 'bg-red-100 text-red-800 border-red-200',
      partial: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      paid: 'bg-green-100 text-green-800 border-green-200',
      waived: 'bg-blue-100 text-blue-800 border-blue-200',
      overdue: 'bg-red-100 text-red-800 border-red-200',
      pending: 'bg-gray-100 text-gray-800 border-gray-200',
      cancelled: 'bg-gray-100 text-gray-800 border-gray-200',
    },
    payment: {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      completed: 'bg-green-100 text-green-800 border-green-200',
      failed: 'bg-red-100 text-red-800 border-red-200',
      reversed: 'bg-gray-100 text-gray-800 border-gray-200',
    },
    waiver: {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      approved: 'bg-green-100 text-green-800 border-green-200',
      rejected: 'bg-red-100 text-red-800 border-red-200',
      revoked: 'bg-gray-100 text-gray-800 border-gray-200',
    },
    refund: {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      processed: 'bg-green-100 text-green-800 border-green-200',
      rejected: 'bg-red-100 text-red-800 border-red-200',
      cancelled: 'bg-gray-100 text-gray-800 border-gray-200',
    },
  }

  return statusColors[type]?.[status] || 'bg-gray-100 text-gray-800 border-gray-200'
}

export const truncateText = (text, maxLength = 50) => {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

export const getInitials = (name) => {
  if (!name) return '??'
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .substring(0, 2)
}

export const calculateDueAmount = (fee) => {
  if (!fee) return 0
  const { totalAmount = 0, paidAmount = 0, waivedAmount = 0, advanceUsed = 0 } = fee
  return Math.max(0, totalAmount - paidAmount - waivedAmount - advanceUsed)
}

export const getCurrentSession = () => {
  const currentYear = new Date().getFullYear()
  return `${currentYear}-${currentYear + 1}`
}

export const parseServerError = (error) => {
  if (!error) return 'An unknown error occurred'
  
  if (error.data?.message) {
    return error.data.message
  }
  
  if (error.error) {
    return error.error
  }
  
  if (typeof error === 'string') {
    return error
  }
  
  return 'An error occurred. Please try again.'
}