import { useContext } from 'react'
import { Ctx } from '@/context/AuthContext'

export const useAuth = () => useContext(Ctx)
