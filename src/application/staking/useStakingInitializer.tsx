import { Program, web3 } from '@project-serum/anchor'
import useStaking from './useStaking'
import { Staking, IDL } from '@/programs/types/staking'
import { useAnchorWallet, useConnection, useWallet } from '@solana/wallet-adapter-react'
import { useEffect } from 'react'
import { setProgram } from '@/programs/staking/instructions'

export const STAKING_PROGRAM_ID = "3wVzFJf6hMWgwY8hcZS9EBFTmubTTbUuPxAATR3MxeXf"
export const STAKING_PROGRAM_PUBKEY = new web3.PublicKey("3wVzFJf6hMWgwY8hcZS9EBFTmubTTbUuPxAATR3MxeXf")
export const YEARLY_SECOND = 31536000

export default function useStakingInitializer() {
  const { connection } = useConnection()
  const { connected: walletConnected } = useWallet()
  const adapter = useAnchorWallet()
  useEffect(() => {
    const program = new Program<Staking>(IDL, STAKING_PROGRAM_ID, { connection })
    useStaking.setState({ program: program })
    setProgram(program)
  }, [connection, walletConnected])


  useStaking.setState({ adapter: adapter })
}
