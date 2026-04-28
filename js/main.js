// ============================================
// CONFIGURAÇÃO INICIAL (só os anos disponíveis)
// ============================================
const YEARS = [2026];  // Adicione os anos que existem

// Mapeamento de meses (não precisa mudar)
const monthFolders = {
    0: "01-janeiro",
    1: "02-fevereiro", 
    2: "03-marco",
    3: "04-abril",
    4: "05-maio",
    5: "06-junho",
    6: "07-julho",
    7: "08-agosto",
    8: "09-setembro",
    9: "10-outubro",
    10: "11-novembro",
    11: "12-dezembro"
};

const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

// Estado da aplicação
let currentYear = 2026;
let currentMonth = null;
let monthsCache = {};  // Cache para não recarregar toda hora

// ============================================
// FUNÇÕES PRINCIPAIS
// ============================================

async function init() {
    console.log("Iniciando aplicação...");
    renderYears();
    
    // Tentar carregar meses disponíveis
    await detectAvailableMonths();
    renderMonths();
    
    // Selecionar primeiro mês com conteúdo
    if (monthsCache[currentYear] && monthsCache[currentYear].length > 0) {
        currentMonth = monthsCache[currentYear][0];
        await loadPieces(currentYear, currentMonth);
    } else {
        showNoContentMessage();
    }
}

// Detectar quais meses têm metadata.json
async function detectAvailableMonths() {
    monthsCache[currentYear] = [];
    
    for (let month = 0; month < 12; month++) {
        const monthFolder = monthFolders[month];
        const metadataPath = `pecas/${currentYear}/${monthFolder}/metadata.json`;
        
        try {
            const response = await fetch(metadataPath);
            if (response.ok) {
                monthsCache[currentYear].push(month);
                console.log(`✅ Mês encontrado: ${monthNames[month]}`);
            }
        } catch (error) {
            // Pasta não existe, continua
        }
    }
    
    console.log("Meses disponíveis:", monthsCache[currentYear].map(m => monthNames[m]));
}

// Renderizar anos
function renderYears() {
    const yearsNav = document.getElementById('yearsNav');
    if (!yearsNav) return;
    
    yearsNav.innerHTML = YEARS.map(year => `
        <button class="year-btn ${currentYear === year ? 'active' : ''}" onclick="selectYear(${year})">
            ${year}
        </button>
    `).join('');
}

// Renderizar meses
function renderMonths() {
    const monthsNav = document.getElementById('monthsNav');
    if (!monthsNav) return;
    
    const availableMonths = monthsCache[currentYear] || [];
    
    monthsNav.innerHTML = monthNames.map((month, index) => {
        const hasContent = availableMonths.includes(index);
        return `
            <button class="month-btn ${currentMonth === index ? 'active' : ''} ${!hasContent ? 'disabled' : ''}" 
                    onclick="${hasContent ? `selectMonth(${index})` : ''}"
                    ${!hasContent ? 'disabled' : ''}>
                ${month}
            </button>
        `;
    }).join('');
}

// Selecionar ano
window.selectYear = async function(year) {
    console.log("Selecionando ano:", year);
    currentYear = year;
    currentMonth = null;
    
    renderYears();
    showLoading();
    
    // Recarregar meses do ano
    await detectAvailableMonths();
    renderMonths();
    
    if (monthsCache[currentYear] && monthsCache[currentYear].length > 0) {
        currentMonth = monthsCache[currentYear][0];
        await loadPieces(currentYear, currentMonth);
    } else {
        showNoContentMessage();
    }
    
    hideLoading();
};

// Selecionar mês
window.selectMonth = async function(month) {
    console.log("Selecionando mês:", month);
    currentMonth = month;
    renderMonths();
    showLoading();
    await loadPieces(currentYear, month);
    hideLoading();
};

// Carregar peças do metadata.json
async function loadPieces(year, month) {
    console.log(`Carregando ${monthNames[month]} de ${year}`);
    
    const monthFolder = monthFolders[month];
    const metadataPath = `pecas/${year}/${monthFolder}/metadata.json`;
    
    try {
        const response = await fetch(metadataPath + '?t=' + Date.now()); // Evitar cache
        console.log(`Fetch status:`, response.status);
        
        if (response.ok) {
            const data = await response.json();
            console.log("Peças encontradas:", data.pieces?.length || 0);
            renderPieces(data.pieces || [], year, monthFolder);
        } else {
            throw new Error(`HTTP ${response.status}`);
        }
    } catch (error) {
        console.error("Erro ao carregar:", error);
        renderError(metadataPath);
    }
}

// Renderizar as peças
function renderPieces(pieces, year, monthFolder) {
    const piecesGrid = document.getElementById('piecesGrid');
    
    if (!pieces || pieces.length === 0) {
        piecesGrid.innerHTML = `
            <div style="text-align: center; padding: 60px; color: #999; grid-column: 1/-1;">
                <p>📭 Nenhuma peça encontrada neste mês</p>
            </div>
        `;
        return;
    }
    
    piecesGrid.innerHTML = pieces.map((piece, index) => {
        const filePath = `pecas/${year}/${monthFolder}/${piece.file}`;
        const fileExt = piece.file.split('.').pop().toLowerCase();
        const isVideo = ['mp4', 'webm', 'mov'].includes(fileExt);
        
        return `
            <div class="piece-card">
                <div class="piece-preview" onclick="openModal('${filePath}', '${isVideo}')">
                    ${isVideo ? 
                        `<video src="${filePath}" preload="metadata" style="width:100%; height:100%; object-fit:cover;"></video>` :
                        `<img src="${filePath}" alt="${piece.title}" 
                              style="width:100%; height:100%; object-fit:cover;"
                              onerror="this.onerror=null; this.src='data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'400\' height=\'300\' viewBox=\'0 0 400 300\'%3E%3Crect width=\'400\' height=\'300\' fill=\'%23f0f0f0\'/%3E%3Ctext x=\'50%%\' y=\'50%%\' text-anchor=\'middle\' dy=\'.3em\' fill=\'%23999\' font-family=\'Arial\'%3E${piece.file} não encontrado%3C/text%3E%3C/svg%3E'">`
                    }
                    <span class="piece-type">${fileExt.toUpperCase()}</span>
                </div>
                <div class="piece-info">
                    <div class="piece-title">${escapeHtml(piece.title)}</div>
                    <div class="piece-description">${escapeHtml(piece.description || '')}</div>
                    <button class="download-btn" onclick="downloadPiece('${filePath}', '${piece.title}.${fileExt}')">
                        📥 Baixar
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Mensagem quando não há conteúdo
function showNoContentMessage() {
    const piecesGrid = document.getElementById('piecesGrid');
    piecesGrid.innerHTML = `
        <div style="text-align: center; padding: 60px; color: #999; grid-column: 1/-1;">
            <p>📁 Nenhum mês encontrado para ${currentYear}</p>
            <p style="font-size: 0.9em; margin-top: 10px;">
                Crie pastas com o formato:<br>
                <code>pecas/${currentYear}/04-abril/</code>
            </p>
            <p style="font-size: 0.9em; margin-top: 10px;">
                E adicione o arquivo <code>metadata.json</code> dentro da pasta
            </p>
        </div>
    `;
}

// Mensagem de erro
function renderError(metadataPath) {
    const piecesGrid = document.getElementById('piecesGrid');
    piecesGrid.innerHTML = `
        <div style="text-align: center; padding: 60px; color: #999; grid-column: 1/-1;">
            <p>⚠️ Arquivo metadata.json não encontrado</p>
            <p style="font-size: 0.9em; margin-top: 10px;">
                Crie o arquivo:<br>
                <code>${metadataPath}</code>
            </p>
            <details style="margin-top: 20px;">
                <summary style="cursor: pointer; color: #667eea;">📖 Conteúdo mínimo do metadata.json</summary>
                <pre style="text-align: left; background: #f5f5f5; padding: 15px; border-radius: 8px; margin-top: 10px;">
{
    "pieces": [
        {
            "title": "Nome da Arte",
            "description": "Descrição da peça",
            "file": "nome-do-arquivo.png"
        }
    ]
}
                </pre>
            </details>
        </div>
    `;
}

// Download
window.downloadPiece = function(filePath, fileName) {
    const link = document.createElement('a');
    link.href = filePath;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`📥 Download: ${fileName}`);
};

// Modal de visualização
// Modal apenas para imagens (sem vídeo)
window.openModal = function(filePath, isVideo) {
    // Se for vídeo, apenas faz download em vez de abrir modal
    if (isVideo) {
        // Extrair nome do arquivo para download
        const fileName = filePath.split('/').pop();
        downloadPiece(filePath, fileName);
        showToast(`🎬 Vídeo não pode ser pré-visualizado. Download iniciado: ${fileName}`);
        return;
    }
    
    // Para imagens, abre o modal normalmente
    const modal = document.getElementById('modal');
    const modalContent = modal.querySelector('.modal-content');
    
    modalContent.innerHTML = `
        <button class="close-modal" onclick="closeModal()">×</button>
        <img src="${filePath}" alt="Visualização" 
             style="max-width: 100%; max-height: 90vh; display: block; margin: 0 auto;"
             onerror="this.onerror=null; this.src='data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'400\' height=\'300\' viewBox=\'0 0 400 300\'%3E%3Crect width=\'400\' height=\'300\' fill=\'%23f0f0f0\'/%3E%3Ctext x=\'50%%\' y=\'50%%\' text-anchor=\'middle\' dy=\'.3em\' fill=\'%23999\'%3EErro ao carregar imagem%3C/text%3E%3C/svg%3E'">
    `;
    
    modal.classList.add('active');
};

window.closeModal = function() {
    document.getElementById('modal').classList.remove('active');
};

function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

function showLoading() {
    const loading = document.getElementById('loading');
    const grid = document.getElementById('piecesGrid');
    if (loading) loading.style.display = 'block';
    if (grid) grid.style.display = 'none';
}

function hideLoading() {
    const loading = document.getElementById('loading');
    const grid = document.getElementById('piecesGrid');
    if (loading) loading.style.display = 'none';
    if (grid) grid.style.display = 'grid';
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Fechar modal ao clicar fora
document.getElementById('modal')?.addEventListener('click', function(e) {
    if (e.target === this) closeModal();
});

// Iniciar
init();
