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
- Không commit `.env`.

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

## Cấu trúc thư mục chính

- `src/`: frontend app
- `contracts/`: solidity contracts
- `scripts/deploy.cjs`: deploy contracts
- `scripts/sync/`, `scripts/maintenance/`: script vận hành/sync dữ liệu
- `scripts/archive/`: script cũ đã lưu trữ
- `src/database/`: schema SQL và cấu hình Supabase

