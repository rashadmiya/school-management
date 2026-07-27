import { useEffect } from 'react'
import { useLazySearchStudentsLazyQuery } from '@/features/apis/studentsApi'

export function useStudentSearch(
    searchTerm,
    {
        minLength = 2,
        delay = 500,
        limit = 10,
        fields = 'name,rollNumber'
    } = {}
) {
    const [triggerSearch, { data, isLoading, isFetching, error }] =
        useLazySearchStudentsLazyQuery()

    useEffect(() => {
        if (!searchTerm || searchTerm.length < minLength) return

        const timer = setTimeout(() => {
            triggerSearch({
                search: searchTerm,
                limit,
                fields,
            })
        }, delay)

        return () => clearTimeout(timer)
    }, [searchTerm, minLength, delay, limit, fields, triggerSearch])

    return {
        results: data?.students || [],
        isLoading: isLoading || isFetching,
        error,
    }
}
