# Tokenization Of Carbon Credits

Ứng dụng quản lý và giao dịch tín chỉ carbon gồm:

- Frontend: React + TypeScript + Vite
- Smart contracts: Hardhat + Solidity (ERC1155 CarbonToken, Marketplace, MockUSDT)
- Database: Supabase (lưu dự án, listing, giao dịch, burn/retirement, IPFS metadata)

## Chức năng chính

- Kết nối ví (MetaMask)
- Xem danh mục dự án/tín chỉ carbon
- Đăng bán và mua tín chỉ
- Tiêu hủy tín chỉ (burn) và sinh chứng nhận
- Upload chứng nhận lên IPFS (Pinata)

## Yêu cầu môi trường

- Node.js 18+
- npm
- MetaMask
- Tài khoản Supabase
- (Tuỳ chọn) RPC Sepolia để deploy/testnet ổn định

## Cấu hình biến môi trường

Tạo file `.env` từ `.env.example`:

```bash
cp .env.example .env
```

Điền các biến:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_PINATA_JWT=
PRIVATE_KEY=
```

Lưu ý:

- `VITE_PINATA_JWT` dùng cho upload IPFS từ frontend.
- `PRIVATE_KEY` và `SEPOLIA_RPC_URL` dùng cho deploy Hardhat.

## Cài đặt và chạy local

```bash
npm install
npm run dev
```

Mặc định Vite chạy tại `http://localhost:5173`.

## Build production

```bash
npm run build
npm run preview
```

## Smart contract (Hardhat)

Compile:

```bash
npm run hh:compile
```

Deploy Sepolia:

```bash
npm run deploy:sepolia
```

Scripts này deploy:

- `MockUSDT`
- `CarbonToken`
- `CarbonMarketplace`

và tự cập nhật địa chỉ vào `src/contracts/contractConfig.ts`.

## Cấu trúc thư mục

```text
tokenizationofcarboncredits/
├─ contracts/
│  ├─ token.sol                 # ERC1155 CarbonToken (mint/burn/token info)
│  ├─ market.sol                # Marketplace (listing/buy/cancel)
│  └─ mockusdt.sol              # Mock USDT cho test
├─ src/
│  ├─ pages/
│  │  ├─ buyer/                 # Giao diện buyer
│  │  ├─ seller/                # Giao diện seller (sell/burn/certificate)
│  │  └─ moderator/             # Giao diện moderator
│  ├─ components/               # UI components + modals
│  ├─ repositories/             # Truy vấn Supabase theo domain
│  ├─ services/                 # Contract service, IPFS service, DB service
│  ├─ hooks/                    # Hooks nghiệp vụ (portfolio, listings, wallet...)
│  ├─ contracts/                # ABI + địa chỉ contract frontend
│  ├─ database/                 # Supabase schema + SQL scripts
│  └─ contexts/                 # React contexts (wallet)
├─ scripts/
│  ├─ deploy.cjs                # Deploy contract chính
│  ├─ deployment/               # Biến thể script deploy
│  ├─ sync/                     # Script sync state DB/on-chain
│  ├─ maintenance/              # Script bảo trì/check/fix
│  ├─ testing/                  # Script test thủ công
│  └─ archive/                  # Script nháp
├─ hardhat.config.cjs
├─ package.json
└─ .env.example
```
## UI/UX

<div style="display:flex;flex-direction:column;gap:24px"> 
	<figure style="margin:0">
		<img src="public/Tài sản.png" alt="Tài sản" style="width:100%;height:auto;max-width:100vw;display:block" />
		<figcaption style="text-align:center">Giao diện Danh mục tài sản</figcaption>
	</figure>

	<figure style="margin:0">
		<img src="public/Thị trường.png" alt="Thị trường" style="width:100%;height:auto;max-width:100vw;display:block" />
		<figcaption style="text-align:center">Giao diện Tài sản được niêm yết trên thị trường</figcaption>
	</figure>

	<figure style="margin:0">
		<img src="public/Phát hành token.png" alt="Phát hành token" style="width:100%;height:auto;max-width:100vw;display:block" />
		<figcaption style="text-align:center">Giao diện Phát hành token</figcaption>
	</figure>

	<figure style="margin:0">
		<img src="public/Tiêu huỷ token.png" alt="Tiêu huỷ token" style="width:100%;height:auto;max-width:100vw;display:block" />
		<figcaption style="text-align:center">Giao diện Tiêu huỷ token</figcaption>
	</figure>
</div>

