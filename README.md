# 🌍 Carbon CDM - Nền Tảng Giao Dịch Tín Chỉ Carbon

Carbon CDM là một ứng dụng phi tập trung (dApp) trên nền tảng Web3 nhằm mục đích số hóa (tokenize) các tín chỉ carbon trên blockchain. Ứng dụng cho phép người dùng đăng bán, mua và giao dịch các tín chỉ carbon một cách minh bạch, an toàn thông qua Smart Contract (Hợp đồng thông minh).

---

## 🚀 Tính Năng Nổi Bật

- **Thị Trường Phi Tập Trung**: Giao dịch chứng chỉ carbon thông qua hợp đồng thông minh.
- **Phân Quyền Chi Tiết**: Hỗ trợ nhiều vai trò bao gồm Người mua (Buyer), Người bán (Seller), và Quản trị viên (Moderator).
- **Giao Dịch An Toàn**: Tích hợp trực tiếp với ví MetaMask để ký giao dịch. Thanh toán được thực hiện bằng đồng MockUSDT (Stablecoin mô phỏng).
- **Đồng Bộ Dữ Liệu Thời Gian Thực**: Sử dụng Supabase để lưu trữ và truy vấn dữ liệu off-chain nhanh chóng.

---

## 🛠 Công Nghệ Sử Dụng

- **Frontend**: React 19, Vite, TypeScript, Tailwind CSS, React Router v7
- **Web3**: Ethers.js v6
- **Smart Contracts**: Solidity ^0.8.28, Hardhat, OpenZeppelin Contracts
- **Backend / Cơ Sở Dữ Liệu**: Supabase

---

## 📋 Yêu Cầu Cài Đặt Ban Đầu

Trước khi bắt đầu, hãy đảm bảo bạn đã cài đặt các phần mềm sau trên máy:
- [Node.js](https://nodejs.org/) (Phiên bản v18 trở lên)
- [Git](https://git-scm.com/)
- [MetaMask](https://metamask.io/) (Tiện ích mở rộng trên trình duyệt web)

---

## 🦊 Hướng Dẫn Cài Đặt VÀ Thiết Lập MetaMask (Rất Quan Trọng)

Để tương tác với ứng dụng, bạn bắt buộc phải có ví MetaMask và kết nối nó với mạng Blockchain nội bộ (Localhost) của dự án.

### Bước 1: Cài đặt tiện ích MetaMask
1. Truy cập [MetaMask.io](https://metamask.io/download/) và tải tiện ích mở rộng cho trình duyệt của bạn (Chrome/Edge/Firefox).
2. Tạo một ví mới và **Lưu lại 12 từ khôi phục (Secret Recovery Phrase)** ở nơi an toàn (nếu bạn chưa có ví).

### Bước 2: Thêm Mạng Localhost (Hardhat) vào MetaMask
1. Mở MetaMask, nhấn vào nút chọn mạng ở góc trên cùng bên trái.
2. Chọn **"Add network"** (Thêm mạng) -> Kéo xuống dưới cùng và chọn **"Add a network manually"** (Thêm mạng thủ công).
3. Điền thông tin mạng Hardhat Localhost như sau:
   - **Network Name (Tên mạng):** Hardhat Localhost
   - **New RPC URL (URL RPC mới):** `http://127.0.0.1:8545/`
   - **Chain ID (ID chuỗi):** `31337`
   - **Currency Symbol (Ký hiệu tiền tệ):** `ETH`
4. Nhấn **Save** (Lưu) và chuyển sang mạng vừa tạo.

### Bước 3: Nạp tiền ảo (Fake ETH) vào ví bằng Hardhat
Khi bạn chạy nền tảng Hardhat Localhost (ở phần dưới), hệ thống sẽ cung cấp cho bạn 20 tài khoản có sẵn 10,000 ETH ảo để test.
1. Gõ `npx hardhat node` ở Terminal. Bạn sẽ thấy danh sách các thẻ `Account #0`, `Account #1` kèm theo `Private Key`.
2. Mở lại MetaMask -> Nhấn vào Avatar tài khoản ở giữa màn hình (hoặc góc trên) -> **"Import account"** (Nhập tài khoản).
3. Dán 1 chuỗi **Private Key** bạn vừa copy từ terminal vào.
4. Nhấn **Import**. Lúc này ví MetaMask của bạn sẽ hiện số dư là 10,000 ETH ảo để thử nghiệm dự án.

---

## ⚙️ Hướng Dẫn Cài Đặt Code Dự Án

### 1. Clone Source Code

```bash
git clone <đường-dẫn-repo-của-bạn>
cd tokenizationofcarboncredits
```

### 2. Cài Đặt Thư Viện (Dependencies)

Cài đặt tất cả các gói NPM cần thiết cho cả Frontend (React) và Smart Contracts (Hardhat):

```bash
npm install
```

### 3. Cấu Hình Biến Môi Trường (Environment Variables)

Dự án đã có sẵn file mẫu `.env.example`. Hãy tự động nhân bản nó thành file `.env` (file `.env` chứa khóa bảo mật nên đã được git tự động bỏ qua, còn `.env.example` thì sẽ được nén cùng code lên web):

```bash
cp .env.example .env
```

Sau đó, hãy mở file `.env` vừa sinh ra và điền thông tin Supabase của bạn:

```env
# Cấu hình kết nối Supabase
VITE_SUPABASE_URL=link-dự-án-supabase-của-bạn
VITE_SUPABASE_ANON_KEY=chuỗi-khóa-anon-key-của-bạn

# (Tùy chọn) Cấu hình để deploy lên mạng thật/testnet sau này
# SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/your-api-key
# SEPOLIA_PRIVATE_KEY=your-wallet-private-key
```

---

## ⛓️ Cài Đặt Smart Contracts & Deploy (Dưới Local)

Bạn cần biên dịch Smart Contracts và triển khai (Deploy) chúng lên máy chủ blockchain cá nhân (Hardhat node).

### Bước 1: Biên dịch Smart Contract
```bash
npx hardhat compile
```

### Bước 2: Khởi động Blockchain ảo nội bộ (Local Node)
Mở một cửa sổ Terminal/CMD **mới** và giữ nó luôn chạy:
```bash
npx hardhat node
```
*Lưu ý: Màn hình này chính là nơi cung cấp Account và Private Key cho Blockchain như đã đề cập trong phần MetaMask.*

### Bước 3: Deploy Smart Contracts lên Node
Mở một cửa sổ Terminal/CMD **khác** (để giữ cho cửa sổ node ở Bước 2 tiếp tục chạy), gõ lệnh:
```bash
npx hardhat run scripts/deploy.ts --network localhost
```

**⚠️ CỰC KỲ QUAN TRỌNG:** 
Sau khi deploy thành công, terminal sẽ in ra các địa chỉ hợp đồng (Ví dụ: `MockUSDT deployed to: 0x5FbDB...`).
Bạn **bắt buộc** phải copy các địa chỉ hợp đồng sinh ra (`CarbonToken`, `MockUSDT`, `CarbonMarketplace`) và cập nhật lại chúng vào trong file cấu hình Frontend của dự án (thường nằm ở `src/config/contracts.ts` hoặc nơi định nghĩa địa chỉ tương ứng). 
Nếu không, Web Frontend sẽ không tương tác được với Smart Contract vừa sinh ra!

---

## 💻 Khởi Chạy Frontend Giao Diện Người Dùng

Sau khi Smart Contract đã deploy thành công và file biến môi trường đầy đủ:

1. Khởi động máy chủ giao diện Vite trong Terminal:
   ```bash
   npm run dev
   ```
2. Mở trình duyệt web của bạn và truy cập: `http://localhost:5173` (Hoặc đường link hiển thị trong console).
3. Trên trang web, chọn **Connect Wallet** (Kết nối ví) và chấp nhận kết nối với tài khoản đã import trên MetaMask ở mạng nội bộ `Hardhat Localhost`.

## 🧪 Các Lệnh Kiểm Tra Bổ Sung

**Chạy Tester nội bộ cho Smart Contract:**
```bash
npx hardhat test
```

**Chạy Linter chuẩn hóa Code:**
```bash
npm run lint
```

**Build Production:**
```bash
npm run build
```

---

## 📜 Giấy Phép (License)

Dự án này được cấp phép theo giấy phép MIT. Phân phối và sử dụng miễn phí. Tôn trọng quyền của các bên liên quan.
