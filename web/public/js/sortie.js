document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const sortieId = urlParams.get('id');

  if (!sortieId) {
    document.getElementById('sortieContent').innerHTML = `
      <div class="alert alert-danger">ID de sortie manquant</div>
    `;
    document.getElementById('loadingSpinner').style.display = 'none';
    return;
  }

  loadSortieDetails(sortieId);
});

async function loadSortieDetails(id) {
  try {
    const response = await fetch(`/api/sorties/${id}`);
    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || "Sortie non trouvée");
    }

    const sortie = data.data;
    renderSortieDetails(sortie);
  } catch (error) {
    document.getElementById('sortieContent').innerHTML = `
      <div class="alert alert-danger">${error.message}</div>
    `;
  } finally {
    document.getElementById('loadingSpinner').style.display = 'none';
    document.getElementById('sortieContent').style.display = 'block';
  }
}

function renderSortieDetails(sortie) {
  // Header
  document.getElementById('sortieTitle').textContent = sortie.title;
  document.getElementById('channelName').textContent = sortie.channelName;
  document.getElementById('sortieDate').textContent =
    `Créé le ${new Date(sortie.createdAt).toLocaleString()}`;
  document.getElementById('messageCount').textContent = `${sortie.messageCount || sortie.messages.length} messages`;
  document.getElementById('totalMessages').textContent = sortie.messageCount || sortie.messages.length;

  // Message principal
  if (sortie.mainMessage) {
    document.getElementById('mainMessage').innerHTML = renderMessage(sortie.mainMessage, true);
  }

  // Tous les messages
  const messagesContainer = document.getElementById('messagesContainer');
  messagesContainer.innerHTML = '';

  sortie.messages.forEach(message => {
    const messageElement = document.createElement('div');
    messageElement.className = 'message-card';
    messageElement.innerHTML = renderMessage(message);
    messagesContainer.appendChild(messageElement);
  });
}

function renderMessage(message, isMain = false) {
  const attachmentsHtml = message.attachments?.map(attach => {
    if (attach.type === 'image') {
      return `<div class="attachment mt-2">
                <a href="${attach.url}" target="_blank">
                  <img src="${attach.url}" alt="${attach.name}"
                       class="img-fluid rounded" style="max-height: 200px;">
                </a>
                <div class="text-muted small">${attach.name}</div>
              </div>`;
    } else {
      return `<div class="attachment mt-2">
                📎 <a href="${attach.url}" target="_blank">${attach.name}</a>
              </div>`;
    }
  }).join('') || '';

  const reactionsHtml = message.reactions?.map(reaction => {
    return `<span class="reaction-badge reaction me-1">
              ${reaction.emoji} ${reaction.count}
            </span>`;
  }).join('') || '';

  return `
    <div class="d-flex mb-2">
      <img src="${message.author.avatar}" alt="${message.author.username}"
           class="message-avatar me-2" onerror="this.src='/default-avatar.png'">
      <div>
        <div class="message-author">${message.author.username}#${message.author.discriminator}
          <span class="message-date ms-2">${new Date(message.createdAt).toLocaleString()}</span>
        </div>
        <div class="message-content mt-1">${message.content || '<i>[Message sans texte]</i>'}</div>
        ${attachmentsHtml}
        ${reactionsHtml ? `<div class="mt-2">${reactionsHtml}</div>` : ''}
      </div>
    </div>
  `;
}
