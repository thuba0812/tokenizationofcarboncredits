import { useState, useCallback } from 'react'

/** Error shape from ethers.js / MetaMask RPC */
interface EthersError extends Error {
  code?: number | string
  reason?: string
}

export type TransactionStatus =
  | 'idle'
  | 'approving'
  | 'confirming'
  | 'mining'
  | 'success'
  | 'error'

export interface ContractTransactionState {
  status: TransactionStatus
  txHash: string | null
  error: string | null
  statusText: string
}

export function useContractTransaction() {
  const [state, setState] = useState<ContractTransactionState>({
    status: 'idle',
    txHash: null,
    error: null,
    statusText: '',
  })

  const reset = useCallback(() => {
    setState({
      status: 'idle',
      txHash: null,
      error: null,
      statusText: '',
    })
  }, [])

  const execute = useCallback(
    async (
      steps: { label: string; run: () => Promise<string | void> }[]
    ): Promise<{ success: boolean; txHash: string | null }> => {
      try {
        let lastTxHash: string | null = null

        for (let i = 0; i < steps.length; i++) {
          const step = steps[i]

          setState({
            status: i === 0 ? 'approving' : 'confirming',
            txHash: null,
            error: null,
            statusText: `${step.label}... Vui lòng xác nhận trên MetaMask`,
          })

          setState((prev) => ({
            ...prev,
            status: 'mining',
            statusText: `${step.label}... Đang xử lý giao dịch`,
          }))

          const result = await step.run()
          if (typeof result === 'string') {
            lastTxHash = result
          }
        }

        setState({
          status: 'success',
          txHash: lastTxHash,
          error: null,
          statusText: 'Giao dịch thành công!',
        })

        return { success: true, txHash: lastTxHash }
      } catch (thrown: unknown) {
        const err = thrown as EthersError
        let errorMessage = 'Lỗi không xác định'

        if (err.code === 4001 || err.code === 'ACTION_REJECTED') {
          errorMessage = 'Bạn đã từ chối giao dịch trên MetaMask'
        } else if (err.code === -32002) {
          errorMessage = 'Yêu cầu MetaMask đang pending. Vui lòng mở MetaMask'
        } else if (err.code === -32603) {
          errorMessage = 'Lỗi nội bộ từ blockchain. Kiểm tra lại dữ liệu'
        } else if (err.reason) {
          errorMessage = `Smart contract lỗi: ${err.reason}`
        } else if (err.message) {
          const revertMatch = err.message.match(/reason="([^"]+)"/)
          if (revertMatch) {
            errorMessage = `Lỗi contract: ${revertMatch[1]}`
          } else if (err.message.length < 200) {
            errorMessage = err.message
          }
        }

        setState({
          status: 'error',
          txHash: null,
          error: errorMessage,
          statusText: errorMessage,
        })

        return { success: false, txHash: null }
      }
    },
    []
  )

  return {
    ...state,
    execute,
    reset,
    isLoading: ['approving', 'confirming', 'mining'].includes(state.status),
  }
}
