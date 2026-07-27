// src/hooks/use-finance.js
import { useState, useCallback } from 'react';
import { useToast } from './use-toast';

export const useFinance = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleFinanceError = useCallback((error) => {
    console.error('Finance error:', error);

    toast({
      title: 'Error',
      description: error?.message || 'An error occurred',
      variant: 'destructive',
    });
  }, [toast]);

  const handleFinanceSuccess = useCallback((message) => {
    toast({
      title: 'Success',
      description: message,
    });
  }, [toast]);

  return {
    loading,
    setLoading,
    handleFinanceError,
    handleFinanceSuccess,
  };
};
