import { useEffect } from 'react'

import useFarms from '@/application/farms/useFarms'

import useStaking from './useStaking'

export default function useStealDataFromFarm() {
  useEffect(() => {
    useStaking.setState({ stakeDialogInfo: undefined })
  }, [])
}
