/**
 * useContractTransaction Hook
 * 
 * Quản lý trạng thái giao dịch blockchain:
 * idle → approving → confirming → mining → success / error
 * 
 * Giúp UI hiển thị loading states và tx hash chính xác.
 */

import { useState, useCallback } from 'react';

export type TransactionStatus =
  | 'idle'        // Chưa bắt đầu
  | 'approving'   // Đang chờ approve (MetaMask popup)
  | 'confirming'  // User đã approve, đang chờ tx submit
  | 'mining'      // Tx đã submit, đang chờ mine
  | 'success'     // Giao dịch thành công
  | 'error';      // Lỗi

export interface ContractTransactionState {
  status: TransactionStatus;
  txHash: string | null;
  error: string | null;
  statusText: string;
}

export function useContractTransaction() {
  const [state, setState] = useState<ContractTransactionState>({
    status: 'idle',
    txHash: null,
    error: null,
    statusText: '',
  });

  const reset = useCallback(() => {
    setState({
      status: 'idle',
      txHash: null,
      error: null,
      statusText: '',
    });
  }, []);

  /**
   * Thực thi một chuỗi giao dịch blockchain
   * 
   * @param steps - Array các bước, mỗi bước là một async function trả về txHash hoặc void
   * @example
   * execute([
   *   { label: 'Approve USDT', run: () => approveUSDT(100) },
   *   { label: 'Mua token', run: () => buyByProject('VN-001', [1], [5]) },
   * ])
   */
  const execute = useCallback(
    async (
      steps: { label: string; run: () => Promise<string | void> }[]
    ): Promise<{ success: boolean; txHash: string | null }> => {
      try {
        let lastTxHash: string | null = null;

        for (let i = 0; i < steps.length; i++) {
          const step = steps[i];

          // Bước đầu tiên = approving, các bước sau = confirming
          setState({
            status: i === 0 ? 'approving' : 'confirming',
            txHash: null,
            error: null,
            statusText: step.label + '... Vui lòng xác nhận trên MetaMask',
          });

          // Chờ user approve trên MetaMask + tx mine
          setState((prev) => ({
            ...prev,
            status: 'mining',
            statusText: step.label + '... Đang xử lý giao dịch',
          }));

          const result = await step.run();
          if (typeof result === 'string') {
            lastTxHash = result;
          }
        }

        setState({
          status: 'success',
          txHash: lastTxHash,
          error: null,
          statusText: 'Giao dịch thành công!',
        });

        return { success: true, txHash: lastTxHash };
      } catch (err: any) {
        let errorMessage = 'Lỗi không xác định';

        if (err.code === 4001 || err.code === 'ACTION_REJECTED') {
          errorMessage = 'Bạn đã từ chối giao dịch trên MetaMask';
        } else if (err.code === -32002) {
          errorMessage = 'Yêu cầu MetaMask đang pending. Vui lòng mở MetaMask';
        } else if (err.code === -32603) {
          errorMessage = 'Lỗi nội bộ từ blockchain. Kiểm tra lại dữ liệu';
        } else if (err.reason) {
          errorMessage = `Smart contract lỗi: ${err.reason}`;
        } else if (err.message) {
          // Trích xuất lỗi revert reason nếu có
          const revertMatch = err.message.match(/reason="([^"]+)"/);
          if (revertMatch) {
            errorMessage = `Lỗi contract: ${revertMatch[1]}`;
          } else if (err.message.length < 200) {
            errorMessage = err.message;
          }
        }

        setState({
          status: 'error',
          txHash: null,
          error: errorMessage,
          statusText: errorMessage,
        });

        return { success: false, txHash: null };
      }
    },
    []
  );

  return {
    ...state,
    execute,
    reset,
    isLoading: ['approving', 'confirming', 'mining'].includes(state.status),
  };
}
