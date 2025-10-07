let currentPage = 1;
const itemsPerPage = 10;
let totalSorties = 0;
let allSorties = [];

document.addEventListener('DOMContentLoaded', () => {
  loadSorties();

  // Boutons de navigation
  document.getElementById('refreshBtn').addEventListener('click', loadSorties);
  document.getElementById('prevPage').addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      renderSorties();
    }
  });

  document.getElementById('nextPage').addEventListener('click', () => {
    if (currentPage < Math.ceil(totalSorties / itemsPerPage)) {
      currentPage++;
      renderSorties();
    }
  });

  // Recherche
  document.getElementById('searchBtn').addEventListener('click', () => {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    if (searchTerm) {
      const filtered = allSorties.filter(sortie =>
        sortie.title.toLowerCase().includes(searchTerm) ||
        sortie.channelName.toLowerCase().includes(searchTerm)
      );
      renderSorties(filtered);
    } else {
      renderSorties();
    }
  });

  document.getElementById('searchInput').addEventListener('keyup', (e) => {
    if (e.key === 'Enter') {
      document.getElementById('searchBtn').click();
    }
  });
});

async function loadSorties() {
  showLoading(true);
  try {
    const response = await fetch(`/api/sorties?page=${currentPage}&limit=${itemsPerPage}`);
    const data = await response.json();

    if (data.success) {
      allSorties = data.data;
      totalSorties = data.pagination.total;
      renderSorties();
    } else {
      showError("Impossible de charger les sorties");
    }
  } catch (error) {
    showError(`Erreur: ${error.message}`);
  } finally {
    showLoading(false);
  }
}

function renderSorties(sorties = null) {
  const tableBody = document.getElementById('sortiesTableBody');
  tableBody.innerHTML = '';

  const sortiesToRender = sorties || allSorties;

  if (sortiesToRender.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="5" class="text-center py-4">Aucune sortie trouvée</td>
      </tr>
    `;
  } else {
    sortiesToRender.forEach(sortie => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${escapeHtml(sortie.title)}</td>
        <td>${escapeHtml(sortie.channelName)}</td>
        <td>${sortie.messageCount || sortie.messages?.length || 0}</td>
        <td>${new Date(sortie.createdAt).toLocaleString()}</td>
        <td>
          <a href="/sortie.html?id=${sortie._id}" class="btn btn-sm btn-primary">Voir</a>
        </td>
      `;
      tableBody.appendChild(row);
    });
  }

  // Mise à jour de la pagination
  document.getElementById('pageInfo').textContent =
    `Page ${currentPage}/${Math.ceil(totalSorties / itemsPerPage)}`;

  document.getElementById('prevPage').disabled = currentPage <= 1;
  document.getElementById('nextPage').disabled =
    currentPage >= Math.ceil(totalSorties / itemsPerPage);
}

function showLoading(show) {
  document.getElementById('loadingSpinner').style.display = show ? 'block' : 'none';
}

function showError(message) {
  const tableBody = document.getElementById('sortiesTableBody');
  tableBody.innerHTML = `
    <tr>
      <td colspan="5" class="text-center text-danger py-4">${message}</td>
    </tr>
  `;
}

function escapeHtml(unsafe) {
  return unsafe
    ? unsafe.toString()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;")
    : '';
}
