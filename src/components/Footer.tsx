export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row justify-between gap-6">
          {/* Brand */}
          <div>
            <div className="font-heading font-bold text-green-700 text-lg tracking-widest mb-1">CARBON X</div>
            <p className="text-xs text-gray-500">© 2024 VIETNAM CARBON CREDIT SYSTEM. ALL RIGHTS RESERVED.</p>
          </div>

          <div className="flex gap-12">
            {/* Legal */}
            <div>
              <div className="font-heading text-xs font-bold tracking-widest text-gray-400 mb-3">PHÁP LÝ</div>
              <div className="flex flex-col gap-2">
                <a href="#" className="text-sm text-gray-600 hover:text-green-700 hover:underline transition-colors cursor-pointer">Điều khoản</a>
                <a href="#" className="text-sm text-gray-600 hover:text-green-700 hover:underline transition-colors cursor-pointer">Bảo mật</a>
              </div>
            </div>
            {/* Contact */}
            <div>
              <div className="font-heading text-xs font-bold tracking-widest text-gray-400 mb-3">LIÊN HỆ</div>
              <div className="flex flex-col gap-2">
                <a href="#" className="text-sm text-gray-600 hover:text-green-700 hover:underline transition-colors cursor-pointer">Hỗ trợ</a>
                <a href="#" className="text-sm text-gray-600 hover:text-green-700 hover:underline transition-colors cursor-pointer">Văn phòng</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
