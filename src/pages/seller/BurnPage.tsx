import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Search,
  AlertTriangle,
  RotateCcw,
  Trash2,
  Check,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import Footer from "../../components/Footer";
import { useWallet } from "../../contexts/WalletContext";
import { usePortfolio } from "../../hooks/usePortfolio";
import { useWalletIdentity } from "../../hooks/useWalletIdentity";
import { useContractTransaction } from "../../hooks/useContractTransaction";
import * as contractService from "../../services/contractService";
import { isContractConfigured } from "../../contracts/contractConfig";
import { portfolioRepository } from "../../repositories/PortfolioRepository";
import IPFSAutoUploader from "../../components/IPFSAutoUploader";
import { useCarbonQuota } from "../../hooks/useCarbonQuota";

export default function BurnPage() {
  const navigate = useNavigate();
  const { wallet } = useWallet();
  const [search, setSearch] = useState("");
  const [selectedTokens, setSelectedTokens] = useState<Record<string, number>>(
    {},
  );
  const [showWarning, setShowWarning] = useState(false);
  const [showConfirmBurn, setShowConfirmBurn] = useState(false);
  const [showSuccessBurn, setShowSuccessBurn] = useState(false);
  const [burnTxHash, setBurnTxHash] = useState<string | null>(null);
  const [lastRetirementId, setLastRetirementId] = useState<number | null>(null);
  const [lastBurntItems, setLastBurntItems] = useState<
    { project: { name?: string; code?: string } | undefined; qty: number; creditCode: string }[]
  >([]);
  const txState = useContractTransaction();

  const {
    walletId,
    organizationId,
    loading: identityLoading,
  } = useWalletIdentity(wallet.address);
  const { allocatedQuota, loading: quotaLoading } =
    useCarbonQuota(organizationId);
  const { credits, loading: portfolioLoading } = usePortfolio(walletId ?? 0);

  const [totalBurned, setTotalBurned] = useState<number>(0);

  useEffect(() => {
    async function fetchTotalBurned() {
      if (organizationId) {
        try {
          const burned = await portfolioRepository.getTotalRetiredAmount(
            organizationId,
          );
          setTotalBurned(burned);
        } catch (e) {
          console.error("Failed to fetch total burned from DB", e);
        }
      }
    }
    fetchTotalBurned();
  }, [organizationId]);

  const quota = allocatedQuota;
  const maxBurn = quota * 0.1;

  const userProjects = credits.reduce<(typeof credits)[number]["project"][]>(
    (acc, item) => {
      const existing = acc.find((project) => project.id === item.project.id);
      if (!existing) {
        acc.push({
          ...item.project,
          tokens: [...(item.project.tokens || [])],
        });
        return acc;
      }

      existing.tokenCount += item.project.tokenCount;
      existing.co2Reduction += item.project.co2Reduction;
      existing.tokens = [
        ...(existing.tokens || []),
        ...(item.project.tokens || []),
      ];
      return acc;
    },
    [],
  );

  const loading = identityLoading || portfolioLoading || quotaLoading;

  const filtered = userProjects
    .filter(
      (p) =>
        p.code.toLowerCase().includes(search.toLowerCase()) ||
        p.name.toLowerCase().includes(search.toLowerCase()),
    )
    .map((p) => ({
      ...p,
      tableTokens: p.tokens?.length
        ? p.tokens
        : [
            {
              year: p.issuedYear || 2024,
              quantity: p.tokenCount,
              available: p.tokenCount,
              price: p.priceMin,
              tokenCode: p.tokenCode || "",
            },
          ],
    }));

  const totalSelected = Object.values(selectedTokens).reduce(
    (sum, q) => sum + q,
    0,
  );

  const allTokensList = filtered.flatMap((p) =>
    p.tableTokens.map((t) => ({
      projectId: p.id,
      year: t.year,
      max: t.available || t.quantity,
    })),
  );
  const isGlobalAllSelected =
    allTokensList.length > 0 &&
    allTokensList.every(
      (t) => selectedTokens[`${t.projectId}-${t.year}`] === t.max,
    );
  const isGlobalPartiallySelected =
    !isGlobalAllSelected &&
    allTokensList.some(
      (t) => (selectedTokens[`${t.projectId}-${t.year}`] || 0) > 0,
    );

  const handleSelectAllGlobal = (checked: boolean) => {
    if (checked) {
      const newSelections = { ...selectedTokens };
      allTokensList.forEach((t) => {
        newSelections[`${t.projectId}-${t.year}`] = t.max;
      });
      setSelectedTokens(newSelections);
    } else {
      setSelectedTokens({});
    }
  };

  const handleQuantityChange = (
    projectId: string,
    year: number,
    quantity: number,
    max: number,
  ) => {
    const key = `${projectId}-${year}`;
    if (quantity <= 0) {
      const newSelections = { ...selectedTokens };
      delete newSelections[key];
      setSelectedTokens(newSelections);
    } else {
      setSelectedTokens((prev) => ({
        ...prev,
        [key]: Math.min(quantity, max),
      }));
    }
  };

  const handleSelectAllProject = (
    project: (typeof filtered)[0],
    checked: boolean,
  ) => {
    if (checked) {
      const newSelections = { ...selectedTokens };
      project.tableTokens.forEach((t) => {
        newSelections[`${project.id}-${t.year}`] = t.available || t.quantity;
      });
      setSelectedTokens(newSelections);
    } else {
      const newSelections = { ...selectedTokens };
      project.tableTokens.forEach((t) => {
        delete newSelections[`${project.id}-${t.year}`];
      });
      setSelectedTokens(newSelections);
    }
  };

  const handleTokenCheckbox = (
    projectId: string,
    year: number,
    checked: boolean,
    max: number,
  ) => {
    if (checked) {
      handleQuantityChange(projectId, year, max, max);
    } else {
      handleQuantityChange(projectId, year, 0, max);
    }
  };

  if (loading)
    return <div className="p-10 text-center">Đang tải dữ liệu...</div>;

  return (
    <div className="min-h-screen bg-white flex flex-col relative font-sans">
      {/* Warning Modal */}
      {showWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 text-center">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-8 flex flex-col items-center">
              <div className="w-20 h-20 bg-green-700/10 rounded-lg flex items-center justify-center mb-6">
                <div className="w-16 h-16 bg-green-700 rounded flex items-center justify-center">
                  <AlertTriangle className="w-10 h-10 text-white" />
                </div>
              </div>

              <h2 className="font-heading font-bold text-2xl tracking-tight text-gray-900 mb-2 border-b-4 border-green-700 pb-1 uppercase">
                CẢNH BÁO QUY ĐỊNH
              </h2>
              <p className="font-heading font-bold text-base text-gray-800 uppercase tracking-tight mb-8">
                VUI LÒNG GIẢM SỐ LƯỢNG BURN TOKEN PHÙ HỢP THEO QUY ĐỊNH
              </p>

              <div className="w-full bg-gray-50 rounded-md border-l-4 border-green-700 p-6 mb-8 text-left">
                <p className="text-sm text-gray-700 mb-4">
                  <span className="font-bold">Luật:</span> Tổng lượng token tiêu
                  hủy (hiện tại + trước đây) không được vượt quá 10% hạn ngạch.
                  Bạn đã tiêu hủy{" "}
                  <span className="font-bold text-red-600">
                    {totalBurned.toLocaleString("en-US")}
                  </span>{" "}
                  token.
                </p>
                <div className="flex justify-between gap-4">
                  <div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase mb-1">
                      HẠN NGẠCH HIỆN TẠI
                    </div>
                    <div className="font-heading font-bold text-sm text-gray-900 tracking-wider">
                      {quota.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                      })}{" "}
                      <span className="text-[10px]">tC02e</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-bold text-green-700 uppercase mb-1">
                      GIỚI HẠN TỐI ĐA (10%)
                    </div>
                    <div className="font-heading font-bold text-sm text-green-700 tracking-wider">
                      {maxBurn.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                      })}{" "}
                      <span className="text-[10px]">tC02e</span>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowWarning(false)}
                className="w-full bg-black hover:bg-gray-900 text-white font-heading font-bold py-4 rounded-sm transition-colors text-sm tracking-widest uppercase cursor-pointer"
              >
                ĐÃ HIỂU
              </button>
            </div>
            <div className="h-1.5 w-full bg-gradient-to-r from-green-700 to-green-500"></div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmBurn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="p-10 flex flex-col items-center text-center">
              <div className="w-24 h-24 bg-gray-100 flex items-center justify-center mb-10">
                <div className="w-12 h-12 border-2 border-black flex items-center justify-center relative">
                  <Trash2 className="w-6 h-6 text-black" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-4 h-0.5 bg-black rotate-45 absolute"></div>
                  </div>
                </div>
              </div>

              <h2 className="font-heading font-bold text-3xl tracking-tight text-gray-900 mb-2 uppercase">
                XÁC NHẬN TIÊU HỦY
              </h2>
              <div className="w-32 h-1 bg-green-700 mb-10"></div>

              <p className="font-heading font-bold text-xl text-gray-900 uppercase tracking-tight mb-2 max-w-xs leading-tight">
                BẠN CÓ CHẮC CHẮN MUỐN TIÊU HỦY {totalSelected.toLocaleString()}{" "}
                TOKEN KHÔNG?
              </p>
              <p className="text-sm text-gray-500 mb-12">
                Hành động này không thể hoàn tác trên blockchain.
              </p>

              <div className="flex gap-4 w-full mb-10">
                <button
                  onClick={() => setShowConfirmBurn(false)}
                  className="flex-1 py-5 border-2 border-black font-heading font-bold text-base tracking-widest text-black uppercase hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  HỦY
                </button>
                <button
                  disabled={txState.isLoading}
                  onClick={async () => {
                    // Chuẩn bị dữ liệu burn
                    const tokenIds: number[] = [];
                    const amounts: number[] = [];

                    for (const [key, qty] of Object.entries(selectedTokens)) {
                      if (qty > 0) {
                        const [projectId, yearStr] = key.split("-");
                        const proj = filtered.find((p) => p.id === projectId);
                        const token = proj?.tableTokens.find(
                          (t) => t.year === Number(yearStr),
                        );
                        if (token?.vintageId) {
                          const onChainId = token.tokenId
                            ? Number(token.tokenId)
                            : token.vintageId;
                          tokenIds.push(onChainId);
                          amounts.push(qty);
                        }
                      }
                    }

                    if (isContractConfigured() && tokenIds.length > 0) {
                      const itemsObj: {
                        vintageId: number;
                        quantity: number;
                      }[] = [];
                      for (const [key, qty] of Object.entries(selectedTokens)) {
                        if (qty > 0) {
                          const [projectId, yearStr] = key.split("-");
                          const proj = filtered.find((p) => p.id === projectId);
                          const token = proj?.tableTokens.find(
                            (t) => t.year === Number(yearStr),
                          );
                          if (token?.vintageId) {
                            itemsObj.push({
                              vintageId: token.vintageId,
                              quantity: qty,
                            });
                          }
                        }
                      }

                      let localTxHash = "0x00";
                      let retirementId: number | null = null;
                      const result = await txState.execute([
                        {
                          label: "Tiêu hủy token trên blockchain",
                          run: async () => {
                            const hash = await contractService.burnCarbonBatch(
                              tokenIds,
                              amounts,
                            );
                            localTxHash = hash;
                            return hash;
                          },
                        },
                        {
                          label: "Cập nhật sổ cái hệ thống",
                          run: async () => {
                            const id = await portfolioRepository.retireTokens(
                              wallet.address || "",
                              itemsObj,
                              localTxHash,
                            );
                            retirementId = id;
                          },
                        },
                      ]);

                      if (result.success) {
                        setBurnTxHash(result.txHash);

                        // Collect details for IPFS upload
                        const burntDetails = itemsObj.map((item) => {
                          const proj = filtered.find((p) =>
                            p.tableTokens.some(
                              (t) => t.vintageId === item.vintageId,
                            ),
                          );
                          const token = proj?.tableTokens.find(
                            (t) => t.vintageId === item.vintageId,
                          );
                          return {
                            project: proj,
                            qty: item.quantity,
                            creditCode: token?.tokenCode || "UNKNOWN",
                          };
                        });
                        setLastBurntItems(burntDetails);
                        setLastRetirementId(retirementId);

                        setShowConfirmBurn(false);
                        setShowSuccessBurn(true);
                        // Refresh total burned count locally
                        setTotalBurned((prev) => prev + totalSelected);
                      }
                      // Nếu lỗi, txState.error sẽ hiển thị
                    } else {
                      // Chưa config contract → chỉ chuyển modal
                      setShowConfirmBurn(false);
                      setShowSuccessBurn(true);
                    }
                  }}
                  className={`flex-1 py-5 font-heading font-bold text-base tracking-widest uppercase transition-colors cursor-pointer ${
                    txState.isLoading
                      ? "bg-gray-400 text-white cursor-wait"
                      : "bg-black text-white hover:bg-gray-900"
                  }`}
                >
                  {txState.isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {txState.statusText || "ĐANG XỬ LÝ..."}
                    </span>
                  ) : (
                    "XÁC NHẬN"
                  )}
                </button>
              </div>

              {txState.status === "error" && (
                <p className="text-xs text-red-600 mb-2 bg-red-50 px-3 py-2 rounded">
                  ⚠ {txState.error}
                </p>
              )}

              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                THAO TÁC NÀY SẼ GHI NHẬN TRỰC TIẾP VÀO BLOCKCHAIN
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessBurn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="p-10 flex flex-col items-center text-center">
              <div className="w-24 h-24 bg-green-200 flex items-center justify-center mb-10">
                <div className="w-14 h-14 bg-green-800 rounded-full flex items-center justify-center">
                  <Check className="w-8 h-8 text-white stroke-[3px]" />
                </div>
              </div>

              <h2 className="font-heading font-bold text-3xl tracking-tight text-gray-900 mb-2 uppercase">
                TIÊU HỦY THÀNH CÔNG
              </h2>
              <div className="w-32 h-1 bg-green-700 mb-10"></div>

              <p className="font-heading font-bold text-xl text-gray-900 uppercase tracking-tight mb-8 max-w-xs leading-tight">
                BẠN ĐÃ TIÊU HỦY THÀNH CÔNG {totalSelected.toLocaleString()}{" "}
                TOKEN.
              </p>

              {/* IPFS Auto Uploaders */}
              {lastRetirementId && lastBurntItems.length > 0 && (
                <div className="w-full max-w-md mb-10 space-y-2">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-left mb-2">
                    TỈNH TRẠNG LƯU TRỮ IPFS
                  </p>
                  {lastBurntItems.map((item, idx) => (
                    <IPFSAutoUploader
                      key={idx}
                      retirementId={lastRetirementId}
                      projectName={item.project?.name || "Loading..."}
                      projectCode={item.project?.code || "Loading..."}
                      creditCode={item.creditCode}
                      quantity={item.qty}
                      date={new Date().toLocaleDateString("vi-VN")}
                    />
                  ))}
                </div>
              )}

              <div className="w-full bg-gray-50/50 border-l-4 border-green-700 p-6 mb-12 text-left relative overflow-hidden">
                <div className="flex items-start gap-4 mb-6">
                  <ShieldCheck className="w-5 h-5 text-gray-400 mt-0.5" />
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Giao dịch đã được ghi nhận trên sổ cái và hạn ngạch carbon
                    đã được cập nhật.
                  </p>
                </div>
                <div className="flex justify-between items-end">
                  <div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase mb-1">
                      {burnTxHash ? "TX HASH (BLOCKCHAIN)" : "MÃ GIAO DỊCH"}
                    </div>
                    <div className="font-mono text-xs font-bold text-gray-900 break-all">
                      {burnTxHash
                        ? `${burnTxHash.slice(0, 10)}...${burnTxHash.slice(-8)}`
                        : "LOCAL"}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-bold text-gray-400 uppercase mb-1">
                      THỜI GIAN
                    </div>
                    <div className="font-mono text-xs font-bold text-gray-900 uppercase">
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
                  setShowSuccessBurn(false);
                  setSelectedTokens({});
                  navigate("/seller/burn/certificates");
                }}
                className="w-full py-5 bg-black font-heading font-bold text-base tracking-widest text-white uppercase hover:bg-gray-900 transition-colors cursor-pointer"
              >
                ĐÓNG
              </button>
            </div>
            <div className="h-1.5 w-full bg-green-700"></div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="border-b border-gray-200 bg-white sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/seller")}
              className="text-gray-900 hover:text-gray-600 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="font-heading font-bold text-base tracking-widest text-gray-900 uppercase">
              HOẠT ĐỘNG TIÊU HỦY
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/seller/burn/certificates")}
              className="bg-black text-white font-heading font-bold text-xs tracking-widest px-4 py-2.5 rounded-sm uppercase transition-colors hover:bg-gray-900 cursor-pointer"
            >
              CHỨNG NHẬN TIÊU HỦY
            </button>
            {wallet.isConnected && (
              <div className="flex items-center gap-3 border border-gray-200 rounded-md bg-white px-3 py-1.5 shadow-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-heading tracking-widest text-gray-600">
                  {wallet.address
                    ? `${wallet.address.slice(0, 6)}...`
                    : "0x742..."}
                </span>
                <span className="text-sm font-heading tracking-widest text-gray-600 border-l border-gray-300 pl-3">
                  {wallet.balance || "1.25"} ETH
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-7xl mx-auto w-full px-6 py-8">
        {/* Search & Filter */}
        <div className="flex gap-2 mb-8">
          <div className="flex-1 flex items-center border border-gray-300 rounded-lg px-4 py-2.5 bg-white shadow-sm focus-within:ring-2 focus-within:ring-green-500/20 focus-within:border-green-500 transition-all">
            <input
              type="text"
              placeholder="Tìm kiếm mã dự án..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 text-sm bg-transparent focus:outline-none"
            />
            <Search className="w-5 h-5 text-gray-400" />
          </div>
          <button className="px-5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer flex items-center justify-center bg-white shadow-sm">
            <span className="text-xl leading-none">Ξ</span>
          </button>
        </div>

        {/* Global Select All and Column Headers */}
        <div className="bg-white border-b border-gray-100 mb-6 py-2">
          {/* Select all checkbox row */}
          <div className="flex items-center gap-3 mb-6 px-2">
            <input
              type="checkbox"
              checked={isGlobalAllSelected}
              ref={(input) => {
                if (input) input.indeterminate = isGlobalPartiallySelected;
              }}
              onChange={(e) => handleSelectAllGlobal(e.target.checked)}
              className="w-5 h-5 cursor-pointer accent-green-700 focus:ring-green-500 rounded border-gray-300"
            />
            <span className="font-heading font-bold text-sm tracking-widest text-gray-700 uppercase">
              CHỌN TẤT CẢ DỰ ÁN
            </span>
          </div>

          {/* Column Titles Row - Aligned with token rows */}
          <div className="grid grid-cols-12 gap-4 px-6 items-center">
            <div className="col-span-3">
              <span className="font-heading font-bold text-base tracking-widest text-black uppercase">
                TÊN DỰ ÁN
              </span>
            </div>
            <div className="col-span-2">
              <span className="font-heading font-bold text-base tracking-widest text-black uppercase">
                NĂM
              </span>
            </div>
            <div className="col-span-2 text-center">
              <span className="font-heading font-bold text-base tracking-widest text-black uppercase">
                TOKEN HIỆN CÓ
              </span>
            </div>
            <div className="col-span-4 text-center">
              <span className="font-heading font-bold text-base tracking-widest text-green-700 uppercase">
                TOKEN TIÊU HỦY
              </span>
            </div>
            <div className="col-span-1 text-right">
              <span className="font-heading font-bold text-base tracking-widest text-black uppercase">
                THAO TÁC
              </span>
            </div>
          </div>
        </div>

        {/* Project Cards List */}
        <div className="space-y-12 mb-8">
          {filtered.length > 0 ? (
            filtered.map((project) => {
              const totalAvailable = project.tableTokens.reduce(
                (sum, t) => sum + (t.available || t.quantity),
                0,
              );
              const totalSelectedForProject = project.tableTokens.reduce(
                (sum, t) =>
                  sum + (selectedTokens[`${project.id}-${t.year}`] || 0),
                0,
              );
              const isAllSelected =
                project.tableTokens.length > 0 &&
                totalSelectedForProject === totalAvailable;
              const isPartiallySelected =
                !isAllSelected && totalSelectedForProject > 0;

              return (
                <div
                  key={project.id}
                  className="animate-in fade-in slide-in-from-bottom-2 duration-300"
                >
                  {/* Project Header - Aligned horizontally with columns */}
                  <div className="flex items-center gap-3 mb-5 px-2">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      ref={(input) => {
                        if (input) input.indeterminate = isPartiallySelected;
                      }}
                      onChange={(e) =>
                        handleSelectAllProject(project, e.target.checked)
                      }
                      className="w-5 h-5 cursor-pointer accent-green-700 focus:ring-green-500 rounded border-gray-300"
                    />
                    <h3 className="font-heading font-bold text-sm text-gray-900 uppercase tracking-widest">
                      {project.name} ({project.code})
                    </h3>
                  </div>

                  {/* Tokens Card Box */}
                  <div className="bg-white rounded-md border border-gray-200 overflow-hidden shadow-sm">
                    {project.tableTokens.map((token, idx) => {
                      const tKey = `${project.id}-${token.year}`;
                      const maxQty = token.available || token.quantity;
                      const selectedQty = selectedTokens[tKey] || 0;
                      return (
                        <div
                          key={idx}
                          className="grid grid-cols-12 gap-4 px-6 py-5 hover:bg-gray-50/50 items-center transition-colors border-t border-gray-100 first:border-t-0"
                        >
                          {/* Col 1: Project Code + Checkbox (Matched to Col 1-3) */}
                          <div className="col-span-3 flex items-center gap-4">
                            <input
                              type="checkbox"
                              checked={selectedQty > 0}
                              onChange={(e) =>
                                handleTokenCheckbox(
                                  project.id,
                                  token.year,
                                  e.target.checked,
                                  maxQty,
                                )
                              }
                              className="w-4 h-4 cursor-pointer accent-green-700 focus:ring-green-500"
                            />
                            <div className="font-heading font-bold text-sm text-gray-900 truncate tracking-tight">
                              {project.code}
                            </div>
                          </div>

                          {/* Col 2: Year (Matched to Col 4-5) */}
                          <div className="col-span-2">
                            <span className="font-heading font-bold text-sm text-green-700">
                              {token.year}
                            </span>
                          </div>

                          {/* Col 3: Existing Quantity (Matched to Col 6-7) */}
                          <div className="col-span-2 text-center">
                            <span className="font-heading font-bold text-sm text-gray-900">
                              {maxQty}
                            </span>
                          </div>

                          {/* Col 4: Burn Quantity Control (Matched to Col 8-11) */}
                          <div className="col-span-4 flex justify-center">
                            <div className="flex items-center border border-gray-200 rounded overflow-hidden bg-white shadow-sm w-full max-w-[130px]">
                              <button
                                onClick={() =>
                                  handleQuantityChange(
                                    project.id,
                                    token.year,
                                    selectedQty - 1,
                                    maxQty,
                                  )
                                }
                                className="px-3 py-1.5 text-gray-500 hover:bg-gray-100 transition-colors cursor-pointer font-bold border-r border-gray-200 w-1/3"
                              >
                                −
                              </button>
                              <input
                                type="number"
                                value={selectedQty || ""}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value) || 0;
                                  handleQuantityChange(
                                    project.id,
                                    token.year,
                                    val,
                                    maxQty,
                                  );
                                }}
                                className="w-1/3 text-center text-sm font-bold text-green-700 bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              />
                              <button
                                onClick={() =>
                                  handleQuantityChange(
                                    project.id,
                                    token.year,
                                    selectedQty + 1,
                                    maxQty,
                                  )
                                }
                                className="px-3 py-1.5 text-gray-500 hover:bg-gray-100 transition-colors cursor-pointer font-bold border-l border-gray-200 w-1/3"
                              >
                                +
                              </button>
                            </div>
                          </div>

                          {/* Col 5: Delete Action (Matched to Col 12) */}
                          <div className="col-span-1 text-right flex justify-end">
                            <button
                              onClick={() =>
                                handleQuantityChange(
                                  project.id,
                                  token.year,
                                  0,
                                  maxQty,
                                )
                              }
                              className="text-gray-400 hover:text-green-700 transition-colors cursor-pointer"
                              title="Làm mới"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-20 text-center text-gray-400 bg-white border border-gray-200 rounded-md shadow-sm">
              <p className="font-heading font-bold text-sm tracking-widest uppercase">
                KHÔNG TÌM THẤY DỰ ÁN PHÙ HỢP
              </p>
            </div>
          )}
        </div>

        {/* Burn Summary Section */}
        <div className="border-t border-gray-200 bg-white py-6 sticky bottom-0 z-10 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
          <div className="max-w-7xl mx-auto px-6 flex items-center justify-between gap-8">
            {/* Hạn ngạch gốc */}
            <div className="flex flex-col flex-1">
              <div className="font-heading font-bold text-xs tracking-widest text-gray-500 mb-1">
                HẠN NGẠCH GỐC
              </div>
              <div className="font-heading font-bold text-4xl text-gray-900">
                {quota.toLocaleString()}
              </div>
              <div className="text-xs text-gray-500 mt-1 uppercase text-[10px] font-bold">
                tCO2e
              </div>
            </div>

            <div className="w-px h-16 bg-gray-200"></div>

            {/* Max burn */}
            <div className="flex flex-col flex-1 pl-6">
              <div className="font-heading font-bold text-xs tracking-widest text-[#1b5e20] mb-1">
                MAX BURN (10%)
              </div>
              <div className="font-heading font-bold text-4xl text-[#1b5e20]">
                {maxBurn.toLocaleString()}
              </div>
              <div className="text-xs text-[#1b5e20] mt-1 uppercase text-[10px] font-bold">
                tCO2e
              </div>
            </div>

            <div className="w-px h-16 bg-gray-200"></div>

            {/* Đã tiêu hủy */}
            <div className="flex flex-col flex-1 pl-6">
              <div className="font-heading font-bold text-xs tracking-widest text-red-600 mb-1">
                ĐÃ TIÊU HỦY
              </div>
              <div className="font-heading font-bold text-4xl text-red-600">
                {totalBurned.toLocaleString()}
              </div>
              <div className="text-xs text-red-600 mt-1 uppercase text-[10px] font-bold">
                tCO2e
              </div>
            </div>

            <div className="w-px h-16 bg-gray-200"></div>

            {/* Tổng tiêu hủy */}
            <div className="flex flex-1 items-center gap-6 pl-6">
              <div className="flex flex-col items-end text-right">
                <span className="font-heading font-bold text-sm tracking-widest text-gray-600 uppercase">
                  ĐANG CHỌN
                </span>
                <span className="text-[10px] font-bold text-gray-400 uppercase">
                  ({Object.keys(selectedTokens).length} TOKEN):
                </span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-baseline gap-2">
                  <span className="font-heading font-bold text-4xl text-[#1b5e20]">
                    {totalSelected}
                  </span>
                  <span className="text-sm font-heading font-bold text-gray-500">
                    Token
                  </span>
                </div>
                <div className="text-[10px] font-bold uppercase text-gray-400">
                  ≈ <span className="text-[#1b5e20]">{totalSelected}</span>{" "}
                  <span className="text-[#1b5e20]">tCO2e</span>
                </div>
              </div>
            </div>

            {/* Burn button */}
            <div className="pl-6">
              <button
                disabled={totalSelected === 0}
                onClick={() => {
                  if (totalSelected + totalBurned > maxBurn) {
                    setShowWarning(true);
                  } else {
                    setShowConfirmBurn(true);
                  }
                }}
                className={`font-heading font-bold text-base tracking-[0.2em] px-12 py-4 border-none rounded-md transition-all duration-150 uppercase shadow-md active:scale-95
                  ${
                    totalSelected > 0
                      ? "bg-[#1b5e20] hover:bg-[#144f19] text-white cursor-pointer"
                      : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  }
                `}
              >
                TIÊU HỦY
              </button>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
