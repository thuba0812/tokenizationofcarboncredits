const reviewerProjects = [
  {
    code: "VN-CDM-2024-001",
    name: "Điện mặt trời mái nhà công nghiệp Đồng Nai",
    category: "Năng lượng tái tạo",
    status: "pending"
  },
  {
    code: "VN-CDM-2024-042",
    name: "Phục hồi rừng ngập mặn Cần Giờ Giai đoạn II",
    category: "Lâm nghiệp & sử dụng đất",
    status: "pending"
  },
  {
    code: "VN-CDM-2023-118",
    name: "Hệ thống thu hồi nhiệt thải xi măng Hà Nam",
    category: "Tiết kiệm năng lượng",
    status: "verified"
  },
  {
    code: "VN-CDM-2024-089",
    name: "Trang trại phong điện ngoài khơi Bạc Liêu 3",
    category: "Năng lượng tái tạo",
    status: "issued"
  }
];

function getStatusHTML(status) {
  if (status === "pending") {
    return `
      <span class="status-badge status-pending">
        <span class="status-dot"></span>
        Chờ duyệt
      </span>
    `;
  }

  if (status === "verified") {
    return `
      <span class="status-badge status-verified">
        <span class="status-dot"></span>
        Đã xác thực
      </span>
    `;
  }

  return `
    <span class="status-badge status-issued">
      <span class="status-dot"></span>
      Đã cấp token
    </span>
  `;
}

function renderProjects(list) {
  const projectRows = document.getElementById("projectRows");
  if (!projectRows) return;

  projectRows.innerHTML = "";

  list.forEach((project) => {
    const row = document.createElement("div");
    row.className = "table-row";

    row.innerHTML = `
      <div class="code-cell">${project.code}</div>

      <div class="name-cell">
        <h3>${project.name}</h3>
        <p>${project.category}</p>
      </div>

      <div>${getStatusHTML(project.status)}</div>

      <div>
        <button class="action-btn">XEM CHI TIẾT</button>
      </div>
    `;

    projectRows.appendChild(row);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  renderProjects(reviewerProjects);

  const searchInput = document.getElementById("projectSearch");

  if (searchInput) {
    searchInput.addEventListener("input", () => {
      const value = searchInput.value.toLowerCase().trim();

      const filtered = reviewerProjects.filter((project) => {
        return (
          project.code.toLowerCase().includes(value) ||
          project.name.toLowerCase().includes(value)
        );
      });

      renderProjects(filtered);
    });
  }
});