import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  Loader2,
  RotateCcw,
  Search,
  ShieldCheck,
  Tag,
} from "lucide-react";
import Footer from "../../components/Footer";
import { useWallet } from "../../contexts/WalletContext";
import { useContractTransaction } from "../../hooks/useContractTransaction";
import { usePortfolio } from "../../hooks/usePortfolio";
import { useWalletIdentity } from "../../hooks/useWalletIdentity";
import * as contractService from "../../services/contractService";
import { isContractConfigured } from "../../contracts/contractConfig";

interface SellRow {
  projectId: string;
  projectName: string;
  projectCode: string;
  vintageId: number;
  year: number;
  tokenId: number;
  available: number;
  listedAmount: number;
  price: number | null;
  currentListingId: number | null;
  onchainListingId: number | null;
}

type RowErrors = {
  quantity?: string;
  price?: string;
};

export default function SellPage() {
  const navigate = useNavigate();
  const { wallet } = useWallet();
  const { walletId, loading: identityLoading } = useWalletIdentity(
    wallet.address,
  );
  const { credits, loading, refetch } = usePortfolio(walletId ?? 0);
  const [search, setSearch] = useState("");
  const [quantityInputs, setQuantityInputs] = useState<Record<number, string>>(
    {},
  );
  const [priceInputs, setPriceInputs] = useState<Record<number, string>>({});
  const [showConfirmSell, setShowConfirmSell] = useState(false);
  const [showSuccessSell, setShowSuccessSell] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sellTxHash, setSellTxHash] = useState<string | null>(null);
  const txState = useContractTransaction();
  const submitLockRef = useRef(false);

  const rows = useMemo<SellRow[]>(
    () =>
      credits.flatMap((credit) =>
        (credit.project.tokens || [])
          .filter(
            (token) =>
              token.status === "MINTED" && token.tokenId && token.vintageId,
          )
          .map((token) => ({
            projectId: credit.project.id,
            projectName: credit.project.name,
            projectCode: credit.project.code,
            vintageId: token.vintageId as number,
            year: token.year,
            tokenId: token.tokenId as number,
            available: token.available,
            listedAmount: token.listedAmount || 0,
            price: token.price ?? null,
            currentListingId: token.currentListingId ?? null,
            onchainListingId: token.onchainListingId ?? null,
          })),
      ),
    [credits],
  );

  const filtered = rows.filter(
    (row) =>
      row.projectCode.toLowerCase().includes(search.toLowerCase()) ||
      row.projectName.toLowerCase().includes(search.toLowerCase()) ||
      String(row.tokenId).includes(search),
  );

  const getQuantityInput = (row: SellRow) => quantityInputs[row.tokenId] ?? "";
  const getPriceInput = (row: SellRow) => priceInputs[row.tokenId] ?? "";

  const parseWholeNumber = (value: string) => {
    const trimmed = value.trim();
    if (trimmed === "") return { value: 0, invalid: false, empty: true };
    if (!/^-?\d+$/.test(trimmed))
      return { value: 0, invalid: true, empty: false };
    return { value: Number(trimmed), invalid: false, empty: false };
  };

  const parseDecimal = (value: string) => {
    const trimmed = value.trim();
    if (trimmed === "") return { value: 0, invalid: false, empty: true };
    if (!/^-?\d+(\.\d+)?$/.test(trimmed))
      return { value: 0, invalid: true, empty: false };
    return { value: Number(trimmed), invalid: false, empty: false };
  };

  const actionableRows = useMemo(
    () =>
      filtered.filter((row) => {
        const quantityRaw = getQuantityInput(row).trim();
        const priceRaw = getPriceInput(row).trim();
        return quantityRaw !== "" || priceRaw !== "";
      }),
    [filtered, priceInputs, quantityInputs],
  );

  const rowErrors = useMemo<Record<number, RowErrors>>(() => {
    const next: Record<number, RowErrors> = {};

    for (const row of actionableRows) {
      const quantityRaw = getQuantityInput(row).trim();
      const priceRaw = getPriceInput(row).trim();
      const quantityParsed = parseWholeNumber(quantityRaw);
      const priceParsed = parseDecimal(priceRaw);
      const errors: RowErrors = {};
      const hasExistingListing =
        row.listedAmount > 0 ||
        Boolean(row.currentListingId || row.onchainListingId);
      const effectiveQuantity =
        quantityRaw === "" ? row.listedAmount : quantityParsed.value;
      const effectivePrice =
        priceRaw === "" ? row.price ?? 0 : priceParsed.value;
      const maxSellable = row.available + row.listedAmount;

      if (quantityParsed.invalid) {
        errors.quantity = "Vui lòng nhập số nguyên hợp lệ.";
      } else if (hasExistingListing && !row.onchainListingId) {
        errors.quantity =
          "Listing hiện tại chưa có onchain_listing_id, cần đồng bộ dữ liệu trước khi sửa.";
      } else if (effectiveQuantity < 0) {
        errors.quantity = "Số lượng đang bán không được nhỏ hơn 0.";
      } else if (effectiveQuantity === 0 && !hasExistingListing) {
        errors.quantity = "Token này chưa có listing để hủy.";
      } else if (effectiveQuantity > maxSellable) {
        errors.quantity = `Số lượng đang bán không được vượt quá ${maxSellable}.`;
      }

      if (effectiveQuantity > 0) {
        if (priceParsed.invalid) {
          errors.price = "Vui lòng nhập số hợp lệ.";
        } else if (effectivePrice <= 0) {
          errors.price = "Giá phải lớn hơn 0.";
        }
      }

      if (errors.quantity || errors.price) {
        next[row.tokenId] = errors;
      }
    }

    return next;
  }, [actionableRows, priceInputs, quantityInputs]);

  const totalTokens = actionableRows.reduce((sum, row) => {
    const quantityRaw = getQuantityInput(row).trim();
    const quantity =
      quantityRaw === ""
        ? row.listedAmount
        : parseWholeNumber(quantityRaw).value;
    return sum + Math.max(quantity, 0);
  }, 0);

  const canSubmit =
    actionableRows.length > 0 &&
    Object.keys(rowErrors).length === 0 &&
    !isSubmitting &&
    !txState.isLoading;

  const handleQuantityChange = (tokenId: number, rawValue: string) => {
    setQuantityInputs((prev) => ({
      ...prev,
      [tokenId]: rawValue,
    }));
  };

  const handlePriceChange = (tokenId: number, rawValue: string) => {
    setPriceInputs((prev) => ({
      ...prev,
      [tokenId]: rawValue,
    }));
  };

  const handleReset = (row: SellRow) => {
    setQuantityInputs((prev) => ({
      ...prev,
      [row.tokenId]: "",
    }));
    setPriceInputs((prev) => ({
      ...prev,
      [row.tokenId]: "",
    }));
  };

  const submitListings = async () => {
    if (!wallet.address || !canSubmit || submitLockRef.current) return;

    submitLockRef.current = true;
    setIsSubmitting(true);

    try {
      const actions = actionableRows.map((row) => {
        const quantityRaw = getQuantityInput(row).trim();
        const priceRaw = getPriceInput(row).trim();

        return {
          row,
          quantity:
            quantityRaw === ""
              ? row.listedAmount
              : parseWholeNumber(quantityRaw).value,
          price:
            priceRaw === "" ? row.price ?? 0 : parseDecimal(priceRaw).value,
        };
      });

      console.group("[SellPage] Payload before blockchain submit");
      console.table(
        actions.map((action) => ({
          projectId: action.row.projectId,
          vintageId: action.row.vintageId,
          tokenId: action.row.tokenId,
          quantity: action.quantity,
          price: action.price,
          onchainListingId: action.row.onchainListingId,
        })),
      );
      console.groupEnd();

      let txHash: string | null = null;
      const metadataByVintageId: Record<
        number,
        {
          txHash?: string | null;
          onchainListingId?: number | null;
          walletBalanceAfter?: number | null;
          listedAmountAfter?: number | null;
          isActiveOnChain?: boolean | null;
        }
      > = {};

      if (isContractConfigured()) {
        const steps = [];
        const isApproved = await contractService.isMarketplaceApproved();
        const needsApproval = actions.some(
          (item) => item.quantity > item.row.listedAmount,
        );

        if (!isApproved && needsApproval) {
          steps.push({
            label: "Cap quyen cho Marketplace",
            run: () => contractService.approveMarketplace(),
          });
        }

        for (const action of actions) {
          if (action.quantity === 0 && action.row.onchainListingId) {
            steps.push({
              label: `Hủy niêm yết token ${action.row.tokenId}`,
              run: async () => {
                const result = await contractService.cancelListingDetailed(
                  action.row.onchainListingId as number,
                );
                const listingSnapshot = await contractService.getListingOnChain(
                  result.listingId,
                );
                const walletBalanceAfter =
                  await contractService.getCarbonTokenBalance(
                    listingSnapshot.tokenId,
                    listingSnapshot.seller,
                  );
                txHash = result.txHash;
                metadataByVintageId[action.row.vintageId] = {
                  txHash: result.txHash,
                  onchainListingId: result.listingId,
                  walletBalanceAfter,
                  listedAmountAfter: listingSnapshot.availableAmount,
                  isActiveOnChain: listingSnapshot.active,
                };
                return result.txHash;
              },
            });
            continue;
          }

          if (action.row.onchainListingId) {
            steps.push({
              label: `Cập nhật token ${action.row.tokenId}`,
              run: async () => {
                const result = await contractService.updateListingDetailed(
                  action.row.onchainListingId as number,
                  action.price,
                  action.quantity,
                );
                const listingSnapshot = await contractService.getListingOnChain(
                  result.listingId,
                );
                const walletBalanceAfter =
                  await contractService.getCarbonTokenBalance(
                    listingSnapshot.tokenId,
                    listingSnapshot.seller,
                  );
                txHash = result.txHash;
                metadataByVintageId[action.row.vintageId] = {
                  txHash: result.txHash,
                  onchainListingId: result.listingId,
                  walletBalanceAfter,
                  listedAmountAfter: listingSnapshot.availableAmount,
                  isActiveOnChain: listingSnapshot.active,
                };
                return result.txHash;
              },
            });
            continue;
          }

          steps.push({
            label: `Đăng bán token ${action.row.tokenId}`,
            run: async () => {
              const result = await contractService.createListingsBatchDetailed([
                {
                  tokenId: action.row.tokenId,
                  pricePerUnit: action.price,
                  amount: action.quantity,
                },
              ]);
              const listingSnapshot = await contractService.getListingOnChain(
                result.listingIds[0] as number,
              );
              const walletBalanceAfter =
                await contractService.getCarbonTokenBalance(
                  listingSnapshot.tokenId,
                  listingSnapshot.seller,
                );
              txHash = result.txHash;
              metadataByVintageId[action.row.vintageId] = {
                txHash: result.txHash,
                onchainListingId: result.listingIds[0] ?? null,
                walletBalanceAfter,
                listedAmountAfter: listingSnapshot.availableAmount,
                isActiveOnChain: listingSnapshot.active,
              };
              return result.txHash;
            },
          });
        }

        const result = await txState.execute(steps);
        if (!result.success) return;
        txHash = result.txHash;
      }

      const { listingRepository } = await import(
        "../../repositories/ListingRepository"
      );
      const success = await listingRepository.createListings(
        wallet.address,
        actions.map((action) => ({
          vintageId: action.row.vintageId,
          quantity: action.quantity,
          price: action.price,
        })),
        metadataByVintageId,
      );

      if (!success) {
        alert("Không thể lưu dữ liệu đăng bán vào cơ sở dữ liệu.");
        return;
      }

      await refetch();
      setSellTxHash(txHash);
      setShowConfirmSell(false);
      setShowSuccessSell(true);
    } catch (error) {
      console.error("Lỗi quá trình đăng bán:", error);
      alert(
        error instanceof Error ? error.message : "Thao tác không thành công.",
      );
    } finally {
      setIsSubmitting(false);
      submitLockRef.current = false;
      txState.reset();
    }
  };

  if (identityLoading || loading) {
    return <div className="p-10 text-center">Đang tải dữ liệu...</div>;
  }

  return (
    <div className="relative flex min-h-screen flex-col bg-white">
      {showConfirmSell && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 text-center backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden rounded-lg bg-white shadow-2xl">
            <div className="flex flex-col items-center p-10">
              <div className="mb-10 flex h-24 w-24 items-center justify-center bg-gray-100">
                <div className="flex h-12 w-12 items-center justify-center border-2 border-black">
                  <Tag className="h-6 w-6 text-black" />
                </div>
              </div>

              <h2 className="mb-2 font-heading text-3xl font-bold uppercase tracking-tight text-gray-900">
                XÁC NHẬN ĐĂNG BÁN
              </h2>
              <div className="mb-10 h-1 w-32 bg-green-700" />

              <p className="mb-2 max-w-xs font-heading text-xl font-bold uppercase leading-tight text-gray-900">
                BẠN CÓ CHẮC CHẮN MUỐN CẬP NHẬT {totalTokens.toLocaleString()}{" "}
                TOKEN KHÔNG?
              </p>
              <p className="mb-12 text-sm text-gray-500">
                Giá niêm yết sẽ được hiển thị công khai trên thị trường.
              </p>

              <div className="mb-10 flex w-full gap-4">
                <button
                  onClick={() => {
                    if (isSubmitting || txState.isLoading) return;
                    setShowConfirmSell(false);
                    submitLockRef.current = false;
                    txState.reset();
                  }}
                  className="flex-1 cursor-pointer border-2 border-black py-5 font-heading text-base font-bold uppercase tracking-widest text-black transition-colors hover:bg-gray-50"
                >
                  HỦY
                </button>
                <button
                  disabled={!canSubmit}
                  onClick={() => void submitListings()}
                  className={`flex-1 py-5 font-heading text-base font-bold uppercase tracking-widest transition-colors ${
                    canSubmit
                      ? "cursor-pointer bg-black text-white hover:bg-gray-900"
                      : "cursor-not-allowed bg-gray-300 text-white"
                  }`}
                >
                  {txState.isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {txState.statusText || "ĐANG XỬ LÝ..."}
                    </span>
                  ) : isSubmitting ? (
                    "ĐANG LƯU DỮ LIỆU..."
                  ) : (
                    "XÁC NHẬN"
                  )}
                </button>
              </div>

              {Object.keys(rowErrors).length > 0 ? (
                <p className="mb-2 rounded bg-red-50 px-3 py-2 text-xs text-red-600">
                  Vui lòng sửa các dòng đang có lỗi trước khi xác nhận.
                </p>
              ) : null}

              {txState.status === "error" ? (
                <p className="mb-2 rounded bg-red-50 px-3 py-2 text-xs text-red-600">
                  {txState.error}
                </p>
              ) : null}

              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                THAO TÁC NÀY SẼ GHI NHẬN TRỰC TIẾP VÀO BLOCKCHAIN VÀ DATABASE
              </p>
            </div>
          </div>
        </div>
      )}

      {showSuccessSell && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 text-center backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden rounded-lg bg-white shadow-2xl">
            <div className="flex flex-col items-center p-10">
              <div className="mb-10 flex h-24 w-24 items-center justify-center bg-green-200">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-800">
                  <Check className="h-8 w-8 stroke-[3px] text-white" />
                </div>
              </div>

              <h2 className="mb-2 font-heading text-3xl font-bold uppercase tracking-tight text-gray-900">
                CẬP NHẬT THÀNH CÔNG
              </h2>
              <div className="mb-10 h-1 w-32 bg-green-700" />

              <p className="mb-12 max-w-xs font-heading text-xl font-bold uppercase leading-tight text-gray-900">
                BẠN ĐÃ CẬP NHẬT THÀNH CÔNG{" "}
                {actionableRows.length.toLocaleString()} TOKEN ID.
              </p>

              <div className="relative mb-12 w-full overflow-hidden border-l-4 border-green-700 bg-gray-50/50 p-6 text-left">
                <div className="mb-6 flex items-start gap-4">
                  <ShieldCheck className="mt-0.5 h-5 w-5 text-gray-400" />
                  <p className="text-sm leading-relaxed text-gray-600">
                    Giao dịch niêm yết đã được ghi nhận. Tài sản của bạn sẽ được
                    đồng bộ lại trên hệ thống.
                  </p>
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <div className="mb-1 text-[10px] font-bold uppercase text-gray-400">
                      {sellTxHash ? "TX HASH (BLOCKCHAIN)" : "MÃ GIAO DỊCH"}
                    </div>
                    <div className="break-all font-mono text-xs font-bold text-gray-900">
                      {sellTxHash
                        ? `${sellTxHash.slice(0, 10)}...${sellTxHash.slice(-8)}`
                        : "DB-ONLY"}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="mb-1 text-[10px] font-bold uppercase text-gray-400">
                      THỜI GIAN
                    </div>
                    <div className="font-mono text-xs font-bold uppercase text-gray-900">
                      {new Date()
                        .toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })
                        .toUpperCase()}{" "}
                      {new Date().toLocaleTimeString("en-GB", {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false,
                      })}
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  setShowSuccessSell(false);
                  navigate("/seller");
                  submitLockRef.current = false;
                }}
                className="w-full cursor-pointer bg-black py-5 font-heading text-base font-bold uppercase tracking-widest text-white transition-colors hover:bg-gray-900"
              >
                ĐÓNG
              </button>
            </div>
            <div className="h-1.5 w-full bg-green-700" />
          </div>
        </div>
      )}

      <div className="sticky top-0 z-10 border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/seller")}
              className="cursor-pointer text-gray-900 transition-colors hover:text-gray-600"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="font-heading text-base font-bold uppercase tracking-widest text-gray-900">
              HOẠT ĐỘNG BÁN
            </h1>
          </div>
          {wallet.isConnected ? (
            <div className="flex items-center gap-3 rounded-md border border-gray-200 bg-white px-3 py-1.5 shadow-sm">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span className="font-heading text-sm tracking-widest text-gray-600">
                {wallet.address
                  ? `${wallet.address.slice(0, 6)}...${wallet.address.slice(
                      -4,
                    )}`
                  : "0x742..."}
              </span>
              <span className="border-l border-gray-300 pl-3 font-heading text-sm tracking-widest text-gray-600">
                {wallet.balance || "1.25"} ETH
              </span>
            </div>
          ) : null}
        </div>
      </div>

      <div className="mx-auto w-full max-w-7xl flex-1 px-6 py-8">
        <div className="mb-8 flex gap-2">
          <div className="flex flex-1 items-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 shadow-sm transition-all focus-within:border-green-500 focus-within:ring-2 focus-within:ring-green-500/20">
            <input
              type="text"
              placeholder="Tìm kiếm mã dự án, tên dự án hoặc token id..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-sm focus:outline-none"
            />
            <Search className="h-5 w-5 text-gray-400" />
          </div>
        </div>

        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Nếu đây là lần đầu dùng ví này để đăng bán, MetaMask có thể yêu cầu
          xác nhận 2 giao dịch: cấp quyền cho Marketplace và tạo/cập nhật lệnh
          đăng bán.
        </div>

        <div className="mb-6 border-b border-gray-100 bg-white py-2">
          <div className="grid grid-cols-12 items-center gap-4 px-6">
            <div className="col-span-3">
              <span className="font-heading text-xs font-bold uppercase tracking-[0.15em] text-gray-500">
                DỰ ÁN
              </span>
            </div>
            <div className="col-span-1">
              <span className="font-heading text-xs font-bold uppercase tracking-[0.15em] text-gray-500">
                NĂM
              </span>
            </div>
            <div className="col-span-1 text-center">
              <span className="font-heading text-xs font-bold uppercase tracking-[0.15em] text-gray-500">
                ID
              </span>
            </div>
            <div className="col-span-1 text-center">
              <span className="font-heading text-xs font-bold uppercase tracking-[0.15em] text-gray-500">
                CÓ SẴN
              </span>
            </div>
            <div className="col-span-3">
              <span className="font-heading text-xs font-bold uppercase tracking-[0.15em] text-green-700">
                ĐANG BÁN
              </span>
            </div>
            <div className="col-span-2 text-center">
              <span className="font-heading text-xs font-bold uppercase tracking-[0.15em] text-green-700">
                ĐƠN GIÁ
              </span>
            </div>
            <div className="col-span-1 text-right">
              <span className="font-heading text-xs font-bold uppercase tracking-[0.15em] text-gray-500">
                THAO TÁC
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {filtered.length > 0 ? (
            filtered.map((row) => {
              const quantityInput = getQuantityInput(row);
              const priceInput = getPriceInput(row);
              const errors = rowErrors[row.tokenId];

              return (
                <div
                  key={row.vintageId}
                  className="rounded-xl border border-gray-100 bg-white px-6 py-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all duration-300 hover:border-green-200 hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)]"
                >
                  <div className="grid grid-cols-12 items-start gap-4">
                    <div className="col-span-3 pt-1">
                      <div className="font-heading text-sm font-bold tracking-widest text-gray-900 line-clamp-1" title={row.projectName}>
                        {row.projectName}
                      </div>
                      <div className="mt-1 text-xs tracking-wider text-gray-400">
                        {row.projectCode}
                      </div>
                    </div>

                    <div className="col-span-1 pt-1.5 border-l border-gray-100 pl-4">
                      <div className="inline-flex items-center rounded bg-gray-50 px-2 py-1">
                        <span className="font-heading text-xs font-bold text-gray-600">
                          {row.year}
                        </span>
                      </div>
                    </div>

                    <div className="col-span-1 pt-2 text-center font-mono text-sm font-medium text-gray-500">
                      #{row.tokenId}
                    </div>

                    <div className="col-span-1 pt-2 text-center">
                      <span className="font-heading text-sm font-black text-gray-800">
                        {row.available}
                      </span>
                    </div>

                    {/* Quantity Input */}
                    <div className="col-span-3 pl-2">
                      <div className="group relative">
                        <div className="absolute -inset-0.5 rounded-lg bg-gradient-to-r from-green-500/0 to-emerald-500/0 opacity-0 blur transition duration-300 group-focus-within:from-green-500/20 group-focus-within:to-emerald-500/20 group-focus-within:opacity-100"></div>
                        <div className={`relative flex items-center overflow-hidden rounded-lg border bg-white shadow-sm transition-all focus-within:border-green-500 focus-within:ring-1 focus-within:ring-green-500 hover:border-green-300 ${errors?.quantity ? 'border-red-300' : 'border-gray-200'}`}>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={quantityInput}
                            placeholder={row.listedAmount > 0 ? "Tổng lượng bán mới" : "Nhập số lượng bán"}
                            onChange={(e) => handleQuantityChange(row.tokenId, e.target.value)}
                            className={`w-full bg-transparent py-2.5 pl-3 pr-20 text-sm font-semibold outline-none placeholder:font-normal placeholder:text-gray-300 ${errors?.quantity ? 'text-red-700' : 'text-gray-900'}`}
                          />
                          <div className="absolute right-1.5 flex items-center gap-1.5">
                            <button
                              onClick={() => handleQuantityChange(row.tokenId, String(row.available))}
                              className="rounded px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-green-700 bg-green-50 hover:bg-green-100 transition-colors"
                              title="Bán Tối Đa"
                            >
                              MAX
                            </button>
                            <span className="text-xs font-medium text-gray-400 select-none">tCO2</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-1.5 flex items-center justify-between px-1">
                        <span className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">Hiện tại: <span className="text-gray-900 font-bold">{row.listedAmount || 0}</span></span>
                        {errors?.quantity ? (
                          <span className="text-xs font-semibold text-red-600 truncate max-w-[120px]" title={errors.quantity}>{errors.quantity}</span>
                        ) : (
                          <span className="text-[10px] uppercase tracking-wider text-green-600 font-medium opacity-0 group-focus-within:opacity-100 transition-opacity">Số lượng hợp lệ</span>
                        )}
                      </div>
                    </div>

                    {/* Price Input */}
                    <div className="col-span-2 pl-2 border-l border-gray-100">
                      <div className="group relative">
                        <div className="absolute -inset-0.5 rounded-lg bg-gradient-to-r from-green-500/0 to-emerald-500/0 opacity-0 blur transition duration-300 group-focus-within:from-green-500/20 group-focus-within:to-emerald-500/20 group-focus-within:opacity-100"></div>
                        <div className={`relative flex items-center overflow-hidden rounded-lg border bg-white shadow-sm transition-all focus-within:border-green-500 focus-within:ring-1 focus-within:ring-green-500 hover:border-green-300 ${errors?.price ? 'border-red-300' : 'border-gray-200'}`}>
                          <div className="flex h-full items-center justify-center bg-gray-50 px-3 text-gray-500 border-r border-gray-100">
                            <span className="text-sm font-medium">$</span>
                          </div>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={priceInput}
                            placeholder={typeof row.price === "number" ? "Giá mới" : "Đơn giá"}
                            onChange={(e) => handlePriceChange(row.tokenId, e.target.value)}
                            className={`w-full bg-transparent py-2.5 pl-3 pr-12 text-sm font-semibold outline-none placeholder:font-normal placeholder:text-gray-300 ${errors?.price ? 'text-red-700' : 'text-gray-900'}`}
                          />
                          <div className="absolute right-3 flex items-center">
                            <span className="text-[10px] font-bold text-gray-400 select-none uppercase tracking-wider">USDT</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-1.5 flex items-center justify-between px-1">
                        <span className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">N/T: <span className="text-green-700 font-bold">{typeof row.price === "number" ? row.price : "-"}</span></span>
                        {errors?.price && (
                          <span className="text-[10px] font-semibold text-red-600 truncate max-w-[80px]" title={errors.price}>{errors.price}</span>
                        )}
                      </div>
                    </div>

                    {/* Action Button & Expected Revenue */}
                    <div className="col-span-1 flex flex-col items-end gap-2 pt-1">
                      <button
                        onClick={() => handleReset(row)}
                        className="group flex h-8 w-8 items-center justify-center rounded-full bg-gray-50 text-gray-400 transition-all hover:bg-gray-200 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-300"
                        title="Khôi phục giá trị"
                      >
                        <RotateCcw className="h-4 w-4 transition-transform duration-300 group-hover:-rotate-90 group-hover:scale-110" />
                      </button>
                      
                      {/* Live Expected Revenue Indicator */}
                      {(() => {
                        const qty = quantityInput ? parseFloat(quantityInput.replace(/,/g, '')) : 0;
                        const prc = priceInput ? parseFloat(priceInput.replace(/,/g, '')) : 0;
                        const revenue = !isNaN(qty) && !isNaN(prc) ? (qty * prc).toLocaleString('en-US') : '0';
                        const isActive = qty > 0 && prc > 0 && !errors?.quantity && !errors?.price;
                        
                        return (
                          <div className={`flex flex-col items-end transition-all duration-300 ${isActive ? 'opacity-100 translate-y-0' : 'opacity-30 -translate-y-1'}`}>
                            <span className="text-[9px] uppercase tracking-[0.2em] text-gray-400 font-semibold mb-0.5 whitespace-nowrap">Dự thu</span>
                            <span className={`text-sm font-black tracking-tight ${isActive ? 'text-green-600' : 'text-gray-300'}`}>
                              ${revenue}
                            </span>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="rounded-md border border-gray-200 bg-white py-20 text-center text-gray-400 shadow-sm">
              <p className="font-heading text-sm font-bold tracking-widest">
                Không có token đã mint để đăng bán.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="sticky bottom-0 z-10 border-t border-gray-200 bg-white py-6 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-8 px-6">
          <div className="flex flex-1 items-center gap-10">
            <div className="flex-1" />
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-end text-right">
                <span className="font-heading text-sm font-bold uppercase tracking-widest text-gray-600">
                  TỔNG CẬP NHẬT
                </span>
                <span className="text-xs font-bold uppercase text-gray-400">
                  ({actionableRows.length} token id):
                </span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-baseline gap-2">
                  <span className="font-heading text-4xl font-bold leading-none text-green-700">
                    {totalTokens}
                  </span>
                  <span className="font-heading text-sm font-bold text-gray-500">
                    Token
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <button
              disabled={!canSubmit}
              onClick={() => {
                submitLockRef.current = false;
                txState.reset();
                setShowConfirmSell(true);
              }}
              className={`rounded px-12 py-4 font-heading text-base font-bold uppercase tracking-widest shadow-md transition-all active:scale-95 ${
                canSubmit
                  ? "cursor-pointer bg-green-700 text-white hover:bg-green-800"
                  : "cursor-not-allowed bg-gray-200 text-gray-400"
              }`}
            >
              XÁC NHẬN BÁN
            </button>
            {Object.keys(rowErrors).length > 0 ? (
              <p className="text-sm text-red-600">
                Vui lòng sửa các dòng đang có lỗi trước khi xác nhận.
              </p>
            ) : null}
            {showConfirmSell || isSubmitting || txState.isLoading ? (
              <p className="text-sm text-amber-700">
                Đang chờ MetaMask, vui lòng không bấm xác nhận lặp lại.
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
