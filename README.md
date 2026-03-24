## Cấu trúc thư mục
```
project/
├─ assets/
│  ├─ models/                   # Mô hình hoá đối tượng
│  │
│  ├─ views/                    # Thư mục giao diện css và htlm
│  │  ├─ css/               
│  │  │
│  │  ├─ html/
│  │  │
│  │  ├─ js/                    # Thư mục component (nếu có)
│  │
│  ├─ controllers/              # Thư mục js chưa các script func của giao diện
│  │  ├─ ProjectController.js
│  │  ├─ CreditController.js
│  │  └─ CertificateController.js
│  │
│  ├─ services/                 # Thư mục liên quan đế api, service ngoài
│  │  ├─ SupabaseService.js
│  │  ├─ IpfsService.js
│  │  └─ ContractService.js
│  │
│  └─ utils/                    # Thư mục chứa func helper nếu có
│     ├─ helpers.js
│     └─ validators.js
│
├─ contracts/                   # Thư mục code smart contract
│  ├─ CarbonCredit.sol
│  └─ abi.json
│
├─ database/                    # Thư mục chứa sql
│  ├─ schema.sql
│  ├─ seed.sql
│  └─ supabase.js
│
└─ main.js                      # File main chạy dự án or kéo index là frame đăng nhập ra
```