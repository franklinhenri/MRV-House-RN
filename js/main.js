// Configuração - VOCÊ MANTÉM ESTE ARQUIVO ATUALIZADO MANUALMENTE
// CONFIGURACAO CENTRAL - Edite este objeto conforme suas pastas
const CONFIG = {
    years: [2026],  // Adicione mais anos aqui: [2025, 2026, 2027]
    data: {
        2026: {
            months: {
                0: { name: "Janeiro", hasContent: false, pieces: [] },
                1: { name: "Fevereiro", hasContent: false, pieces: [] },
                2: { name: "Março", hasContent: false, pieces: [] },
                3: { name: "Abril", hasContent: true, pieces: [] },  // Marque como true se tem conteúdo
                4: { name: "Maio", hasContent: false, pieces: [] },
                5: { name: "Junho", hasContent: false, pieces: [] },
                6: { name: "Julho", hasContent: false, pieces: [] },
                7: { name: "Agosto", hasContent: false, pieces: [] },
                8: { name: "Setembro", hasContent: false, pieces: [] },
                9: { name: "Outubro", hasContent: false, pieces: [] },
                10: { name: "Novembro", hasContent: false, pieces: [] },
                11: { name: "Dezembro", hasContent: false, pieces: [] }
            }
        }
    }
};

// Estado da aplicação
let currentYear = 2026;
let currentMonth = null;

// Mapeamento de meses para nomes de pastas
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

// Inicializar
async function init() {
    console.log("Iniciando aplicação...");
    renderYears();
    renderMonths();
    
    // Selecionar primeiro mês com conteúdo
    const yearData = CONFIG.data[currentYear];
    if (yearData) {
        for (let i = 0; i < 12; i++) {
            if (yearData.months[i] && yearData.months[i].hasContent) {
                currentMonth = i;
                await loadPieces(currentYear, currentMonth);
                break;
            }
        }
    }
    
    console.log("Aplicação iniciada!");
}

// Renderizar anos
function renderYears() {
    const yearsNav = document.getElementById('yearsNav');
    if (!yearsNav) {
        console.error("Elemento yearsNav não encontrado");
        return;
    }
    
    yearsNav.innerHTML = CONFIG.years.map(year => `
        <button class="year-btn ${currentYear === year ? 'active' : ''}" onclick="selectYear(${year})">
            ${year}
        </button>
    `).join('');
}

// Renderizar meses
function renderMonths() {
    const monthsNav = document.getElementById('monthsNav');
    if (!monthsNav) {
        console.error("Elemento monthsNav não encontrado");
        return;
    }
    
    const yearData = CONFIG.data[currentYear];
    if (!yearData) {
        monthsNav.innerHTML = '<p>Ano não configurado</p>';
        return;
    }
    
    monthsNav.innerHTML = monthNames.map((month, index) => {
        const hasContent = yearData.months[index] && yearData.months[index].hasContent;
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
    renderMonths();
    
    // Encontrar primeiro mês com conteúdo
    const yearData = CONFIG.data[currentYear];
    if (yearData) {
        for (let i = 0; i < 12; i++) {
            if (yearData.months[i] && yearData.months[i].hasContent) {
                currentMonth = i;
                await loadPieces(currentYear, currentMonth);
                break;
            }
        }
    }
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

// Carregar peças
async function loadPieces(year, month) {
    console.log(`Carregando peças para ${year} - ${monthNames[month]}`);
    
    const monthFolder = monthFolders[month];
    const metadataPath = `pecas/${year}/${monthFolder}/metadata.json`;
    
    try {
        const response = await fetch(metadataPath);
        console.log(`Fetch ${metadataPath}:`, response.status);
        
        if (response.ok) {
            const data = await response.json();
            console.log("Dados carregados:", data);
            renderPieces(data.pieces, year, monthFolder);
        } else {
            console.error("metadata.json não encontrado");
            renderError(metadataPath);
        }
    } catch (error) {
        console.error("Erro ao carregar:", error);
        renderError(metadataPath);
    }
}

// Renderizar peças
function renderPieces(pieces, year, monthFolder) {
    const piecesGrid = document.getElementById('piecesGrid');
    
    if (!pieces || pieces.length === 0) {
        piecesGrid.innerHTML = `
            <div style="text-align: center; padding: 60px; color: #999; grid-column: 1/-1;">
                <p>📭 Nenhuma peça encontrada</p>
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
                        `<video src="${filePath}" preload="metadata"></video>` :
                        `<img src="${filePath}" alt="${piece.title}" 
                              onerror="this.onerror=null; this.src='https://via.placeholder.com/400x300/ff6b6b/white?text=Imagem+não+encontrada'">`
                    }
                    <span class="piece-type">${fileExt.toUpperCase()}</span>
                </div>
                <div class="piece-info">
                    <div class="piece-title">${piece.title}</div>
                    <div class="piece-description">${piece.description || ''}</div>
                    <button class="download-btn" onclick="downloadPiece('${filePath}', '${piece.title}.${fileExt}')">
                        📥 Baixar
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Renderizar erro
function renderError(metadataPath) {
    const piecesGrid = document.getElementById('piecesGrid');
    piecesGrid.innerHTML = `
        <div style="text-align: center; padding: 60px; color: #999; grid-column: 1/-1;">
            <p>⚠️ Arquivo não encontrado</p>
            <p style="font-size: 0.9em; margin-top: 10px;">
                Verifique se o arquivo existe:<br>
                <code>${metadataPath}</code>
            </p>
            <details style="margin-top: 20px;">
                <summary style="cursor: pointer; color: #667eea;">📖 Exemplo de metadata.json</summary>
                <pre style="text-align: left; background: #f5f5f5; padding: 15px; border-radius: 8px; margin-top: 10px;">
{
    "pieces": [
        {
            "title": "Nome da Arte",
            "description": "Descrição da peça",
            "file": "nome-do-arquivo.jpg"
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
    showToast(`Download: ${fileName}`);
};

// Modal
window.openModal = function(filePath, isVideo) {
    const modal = document.getElementById('modal');
    const modalContent = modal.querySelector('.modal-content');
    
    if (isVideo) {
        modalContent.innerHTML = `
            <button class="close-modal" onclick="closeModal()">×</button>
            <video controls autoplay style="max-width: 100%; max-height: 90vh;">
                <source src="${filePath}" type="video/mp4">
            </video>
        `;
    } else {
        modalContent.innerHTML = `
            <button class="close-modal" onclick="closeModal()">×</button>
            <img src="${filePath}" alt="Visualização" style="max-width: 100%; max-height: 90vh;">
        `;
    }
    
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
    document.getElementById('loading').style.display = 'block';
    document.getElementById('piecesGrid').style.display = 'none';
}

function hideLoading() {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('piecesGrid').style.display = 'grid';
}

// Fechar modal ao clicar fora
document.getElementById('modal')?.addEventListener('click', function(e) {
    if (e.target === this) closeModal();
});

// Iniciar
init();