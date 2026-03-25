import type { Project, Transaction, PurchasedCredit, Certificate } from '../types'


export const CERTIFICATES: Certificate[] = [
  {
    id: 'CERT-001',
    projectId: '2',
    projectName: 'Phục hồi rừng ngập mặn Cần Giờ Giai đoạn II',
    projectCode: 'VN-RE-2024- 001',
    date: '03/09/2025',
    quantity: 200,
  },
  {
    id: 'CERT-002',
    projectId: '2',
    projectName: 'Phục hồi rừng ngập mặn Cần Giờ Giai đoạn II',
    projectCode: 'VN-RE-2024- 001',
    date: '03/09/2025',
    quantity: 150,
  },
]


// ─── Landscape images using Picsum Photos ───────────────────────────────────
const THUMBNAILS = [
  'https://images.unsplash.com/photo-1448375240586-882707db888b?w=600&q=80', // forest
  'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=600&q=80', // river/canal
  'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&q=80', // mountains
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80', // wind
  'https://images.unsplash.com/photo-1473773508845-188df298d2d1?w=600&q=80', // solar
  'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=600&q=80', // jungle
]

const baseRep = {
  company: 'Công ty EcoSustain Tech Ltd',
  taxId: '03142988XX',
  contact: 'Nguyễn Văn A',
  phone: '+84 901 234 XXX',
  email: 'contact@ecosustain.vn',
  walletAddress: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
}

export const PROJECTS: Project[] = [
  {
    id: '1',
    code: 'VN-RE-2024-001',
    name: 'Dự án tái trồng rừng Tây Nguyên',
    description: 'Dự án tái trồng rừng tại Tây Nguyên tập trung vào các loài cây bản địa họ Dầu.',
    domain: 'Trồng rừng và sử dụng đất',
    location: 'Việt Nam, Tây Nguyên',
    startDate: '01/01/2023',
    endDate: '31/12/2030',
    metadataLink: 'ipfs:////taynguyen',
    co2Reduction: 12500,
    tokenCount: 12500,
    status: 'token-issued',
    priceMin: 0.5,
    priceMax: 1.25,
    thumbnail: THUMBNAILS[0],
    representative: baseRep,
    tokens: [
      { year: 2023, tokenCode: '0x882a...b291c9e3', quantity: 100, available: 100, price: 0.5 },
      { year: 2024, tokenCode: '0x882a...b291c9e3', quantity: 100, available: 100 },
    ],
    issuedYear: 2024,
    tokenCode: 'kjadghijhuiau',
  },
  {
    id: '2',
    code: 'VN-CDM-2024-042',
    name: 'Phục hồi rừng ngập mặn Cần Giờ Giai đoạn II',
    description: 'Phục hồi hệ sinh thái rừng ngập mặn tại TP. Hồ Chí Minh thông qua các biện pháp bảo tồn đa dạng sinh học.',
    domain: 'Lâm nghiệp & Sử dụng đất',
    location: 'Việt Nam, TP. Hồ Chí Minh, Huyện Cần Giờ',
    startDate: '01/01/2024',
    endDate: '31/12/2034',
    metadataLink: 'ipfs:////dagioiahgio',
    co2Reduction: 12500,
    tokenCount: 12500,
    status: 'approved',
    thumbnail: THUMBNAILS[1],
    representative: { ...baseRep, company: 'Công ty GreenForest VN' },
    issuedYear: 2024,
    tokenCode: 'kjadghijhuiau',
    tokens: [
      { year: 2024, tokenCode: '0x882a...b291c9e3', quantity: 150, available: 150 },
    ],
  },
  {
    id: '3',
    code: 'VN-CDM-2024-001',
    name: 'Điện mặt trời mái nhà công nghiệp Đồng Nai',
    description: 'Lắp đặt hệ thống điện mặt trời áp mái cho các nhà máy khu công nghiệp Đồng Nai.',
    domain: 'Năng lượng tái tạo',
    location: 'Việt Nam, Đồng Nai',
    startDate: '15/03/2024',
    endDate: '14/03/2034',
    metadataLink: 'ipfs:////dongnai-solar',
    co2Reduction: 8000,
    tokenCount: 8000,
    status: 'pending',
    thumbnail: THUMBNAILS[4],
    representative: { ...baseRep, company: 'Solar VN Corp' },
    tokens: [
      { year: 2024, tokenCode: '0xabc1...def3', quantity: 200, available: 200 },
    ],
  },
  {
    id: '4',
    code: 'VN-CDM-2023-118',
    name: 'Hệ thống thu hồi nhiệt thải xi măng Hà Nam',
    description: 'Thu hồi và tái sử dụng nhiệt thải từ lò nung xi măng, giảm tiêu thụ năng lượng hóa thạch.',
    domain: 'Tiết kiệm năng lượng',
    location: 'Việt Nam, Hà Nam',
    startDate: '01/06/2023',
    endDate: '31/05/2033',
    metadataLink: 'ipfs:////hanam-cement',
    co2Reduction: 15000,
    tokenCount: 15000,
    status: 'token-issued',
    priceMin: 1.0,
    priceMax: 2.5,
    thumbnail: THUMBNAILS[2],
    representative: { ...baseRep, company: 'Công ty Xi Măng Hà Nam' },
    tokens: [
      { year: 2023, tokenCode: '0xabc1...def2', quantity: 5000, available: 2000, price: 1.0 },
      { year: 2024, tokenCode: '0xabc1...def3', quantity: 5000, available: 5000, price: 1.5 },
    ],
  },
  {
    id: '5',
    code: 'VN-CDM-2024-089',
    name: 'Trang trại phong điện ngoài khơi Bạc Liêu 3',
    description: 'Dự án điện gió ngoài khơi tại vùng biển Bạc Liêu, công suất 200MW.',
    domain: 'Năng lượng tái tạo',
    location: 'Việt Nam, Bạc Liêu',
    startDate: '01/09/2024',
    endDate: '31/08/2044',
    metadataLink: 'ipfs:////baclieu-wind',
    co2Reduction: 50000,
    tokenCount: 50000,
    status: 'token-issued',
    priceMin: 0.8,
    priceMax: 1.8,
    thumbnail: THUMBNAILS[3],
    representative: { ...baseRep, company: 'WindPower Bạc Liêu JSC' },
    tokens: [
      { year: 2024, tokenCode: '0xfed9...1234', quantity: 10000, available: 8000, price: 0.8 },
    ],
  },
  {
    id: '6',
    code: 'VN-FOR-2024-012',
    name: 'Trồng tre lâu đời tại Thanh Hóa',
    description: 'Dự án trồng tre lâu đời tại Thanh Hóa. Đã hoàn thành thẩm định Q4 2023.',
    domain: 'Lâm nghiệp & Sử dụng đất',
    location: 'Việt Nam, Thanh Hóa',
    startDate: '01/01/2022',
    endDate: '31/12/2032',
    metadataLink: 'ipfs:////thanhhoa-bamboo',
    co2Reduction: 6000,
    tokenCount: 6000,
    status: 'token-issued',
    priceMin: 0.6,
    priceMax: 1.0,
    thumbnail: THUMBNAILS[5],
    representative: { ...baseRep, company: 'Thanh Hóa Green JSC' },
    tokens: [
      { year: 2022, tokenCode: '0x112b...aacd', quantity: 2000, available: 2000, price: 0.6 },
      { year: 2023, tokenCode: '0x112b...aadd', quantity: 2000, available: 2000, price: 0.8 },
    ],
  },
]

export const TRANSACTIONS: Transaction[] = [
  {
    id: '1',
    date: '24/10/2023',
    txHash: '0x882a...b291c9e3',
    activity: 'Phát hành Tín chỉ (VN-RE-2024-001)',
    projectCode: 'VN-RE-2024-001',
    amount: 5000,
    type: 'mint',
  },
  {
    id: '2',
    date: '21/10/2023',
    txHash: '0x11fa...d0112f45',
    activity: 'Gửi Đơn Đề Nghị (VN-MG-2024-042)',
    projectCode: 'VN-MG-2024-042',
    type: 'request',
  },
  {
    id: '3',
    date: '15/10/2023',
    txHash: '0x34bc...e92100bb',
    activity: 'Bán Tín chỉ cho Global Airways Corp',
    projectCode: 'VN-RE-2024-001',
    amount: -2000,
    type: 'sell',
  },
]

export const PURCHASED_CREDITS: PurchasedCredit[] = [
  {
    project: PROJECTS[5], // Thanh Hóa
    quantity: 200,
    pricePerToken: 0.8,
    purchaseDate: '20/10/2023',
  },
  {
    project: PROJECTS[5],
    quantity: 150,
    pricePerToken: 0.8,
    purchaseDate: '18/10/2023',
  },
]
