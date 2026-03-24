const cardGrid = document.getElementById("cardGrid");

function renderProjects() {
  cardGrid.innerHTML = "";

  projects.forEach((project) => {
    const card = document.createElement("article");
    card.className = "project-card";

    card.innerHTML = `
      <div class="card-image-wrap">
        <img src="${project.image}" alt="${project.code}" class="card-image" />
        <div class="price-tag">${project.price}</div>
      </div>

      <div class="card-body">
        <p class="card-label">MÃ DỰ ÁN</p>
        <h3 class="card-code">${project.code}</h3>
        <p class="card-desc">${project.description}</p>
        <button class="detail-btn">XEM CHI TIẾT</button>
      </div>
    `;

    cardGrid.appendChild(card);
  });
}

renderProjects();