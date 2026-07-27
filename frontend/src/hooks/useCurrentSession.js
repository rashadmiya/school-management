import { useEffect, useState, useCallback } from "react"
import {
    useGetCurrentSessionQuery,
    useSetSessionMutation
} from "@/features/apis/finance/feeApi"

export const useCurrentSession = () => {

    const [selectedSession, setSelectedSession] = useState("")

    const {
        data,
        isLoading,
        refetch
    } = useGetCurrentSessionQuery()

    const [setSession, { isLoading: isSetting }] = useSetSessionMutation()

    // Auto-set current session once
    useEffect(() => {
        if (data?.data?.currentSession && !selectedSession) {
            setSelectedSession(data.data.currentSession)
        }
    }, [data, selectedSession])

    const updateSession = async (newSession) => {
        await setSession({ session: newSession }).unwrap()
        setSelectedSession(newSession)
        refetch()
    }

    return {
        selectedSession,
        setSelectedSession,   // manual override if needed
        updateSession,        // backend + frontend update
        isLoading,
        isSetting,
        refetch
    }
}

// hooks/useAcademicSession.js
// import { useEffect } from "react"
// import { useAppDispatch, useAppSelector } from "@/features/store"
// import {
//   useGetCurrentSessionQuery,
//   useSetSessionMutation
// } from "@/features/apis/sessionApi"
// import { setCurrentSession } from "@/features/globalReducer"

// export const useAcademicSession = () => {
//   const dispatch = useAppDispatch()
//   const currentSession = useAppSelector(s => s.global.currentSession)

//   const { data, isLoading } = useGetCurrentSessionQuery()
//   const [setSessionApi, { isLoading: isSetting }] = useSetSessionMutation()

//   // initial load
//   useEffect(() => {
//     if (data?.data?.currentSession && !currentSession) {
//       dispatch(setCurrentSession(data.data.currentSession))
//     }
//   }, [data, currentSession, dispatch])

//   const updateSession = async (newSession) => {
//     await setSessionApi({ session: newSession }).unwrap()
//     dispatch(setCurrentSession(newSession))
//   }

//   return {
//     session: currentSession,
//     isLoading,
//     isSetting,
//     updateSession
//   }
// }
