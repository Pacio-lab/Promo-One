// --- CONFIGURAZIONE E STATO INIZIALE ---
let jobs = JSON.parse(localStorage.getItem('productionJobs')) || [];
let archive = JSON.parse(localStorage.getItem('productionArchive')) || [];

const jobForm = document.getElementById('jobForm');
const dtfFields = document.getElementById('dtfFields');
const prodRadios = document.getElementsByName('prodType');

// --- GESTIONE INTERFACCIA (UI) ---

// Mostra/Nascondi campi DTF in base alla selezione
prodRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
        if (e.target.value === 'DTF') {
            dtfFields.classList.remove('hidden');
        } else {
            dtfFields.classList.add('hidden');
            document.getElementById('dtfLogos').value = '';
            document.getElementById('dtfMeters').value = '';
        }
    });
});

// --- LOGICA CORE ---

// Aggiungi un nuovo lavoro
jobForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const newJob = {
        id: Date.now(),
        name: document.getElementById('jobName').value,
        startDate: document.getElementById('startDate').value,
        endDate: document.getElementById('endDate').value,
        setupTime: document.getElementById('setupTime').value,
        pieces: document.getElementById('jobPieces').value,
        type: document.querySelector('input[name="prodType"]:checked').value,
        dtfLogos: document.getElementById('dtfLogos').value || '-',
        dtfMeters: document.getElementById('dtfMeters').value || '-',
        status: 'in_coda',
        createdAt: new Date().toLocaleString('it-IT')
    };

    jobs.push(newJob);
    saveAndRender();
    jobForm.reset();
    dtfFields.classList.add('hidden');
});

// Sposta in Archivio
function completeJob(id) {
    const index = jobs.findIndex(j => j.id === id);
    if (index !== -1) {
        const completedJob = jobs.splice(index, 1)[0];
        completedJob.completedAt = new Date().toLocaleString('it-IT');
        archive.push(completedJob);
        saveAndRender();
    }
}

// Elimina lavoro
function deleteJob(id, isArchive = false) {
    if (confirm('Sei sicuro di voler eliminare questo record?')) {
        if (isArchive) {
            archive = archive.filter(j => j.id !== id);
        } else {
            jobs = jobs.filter(j => j.id !== id);
        }
        saveAndRender();
    }
}

// --- RENDERIZZAZIONE ---

function render() {
    const jobList = document.getElementById('jobList');
    const archiveList = document.getElementById('archiveList');
    const activeCount = document.getElementById('activeCount');

    jobList.innerHTML = '';
    archiveList.innerHTML = '';
    activeCount.innerText = jobs.length;

    // Render Coda Attiva
    jobs.forEach(job => {
        jobList.innerHTML += `
            <div class="bg-white p-4 rounded-xl shadow-sm border-l-4 border-blue-500 flex justify-between items-center animate-fade-in">
                <div>
                    <h3 class="font-bold text-lg text-gray-900">${job.name} <span class="text-xs font-normal bg-gray-100 px-2 py-1 rounded ml-2">${job.type}</span></h3>
                    <p class="text-sm text-gray-600">Pezzi: <b>${job.pieces}</b> | Consegna: <span class="text-red-600 font-semibold">${job.endDate}</span></p>
                    ${job.type === 'DTF' ? `<p class="text-xs text-blue-600 font-medium">DTF: ${job.dtfLogos} loghi / ${job.dtfMeters}m</p>` : ''}
                </div>
                <div class="flex gap-2">
                    <button onclick="completeJob(${job.id})" class="bg-green-100 text-green-700 p-2 rounded-lg hover:bg-green-200 transition">✅ Fine</button>
                    <button onclick="deleteJob(${job.id})" class="bg-red-50 text-red-400 p-2 rounded-lg hover:bg-red-100 transition">🗑️</button>
                </div>
            </div>
        `;
    });

    // Render Archivio
    archive.slice().reverse().forEach(job => {
        archiveList.innerHTML += `
            <div class="bg-gray-100 p-3 rounded-lg flex justify-between items-center border border-gray-200">
                <div class="text-sm">
                    <span class="font-semibold">${job.name}</span> - ${job.type} (${job.pieces} pz)
                    <div class="text-[10px] text-gray-500">Chiuso il: ${job.completedAt}</div>
                </div>
                <button onclick="deleteJob(${job.id}, true)" class="text-gray-400 hover:text-red-500 text-xs">Rimuovi</button>
            </div>
        `;
    });
}

// --- UTILITY E EXPORT ---

function saveAndRender() {
    localStorage.setItem('productionJobs', JSON.stringify(jobs));
    localStorage.setItem('productionArchive', JSON.stringify(archive));
    render();
}

function hardReset() {
    if (confirm("⚠️ ATTENZIONE: Questo cancellerà TUTTI i dati (coda e archivio). Procedere?")) {
        localStorage.clear();
        location.reload();
    }
}

// Export PDF (Richiede jsPDF caricato nell'HTML)
window.exportPDF = function() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    doc.text("Report Produzione - Promo One", 14, 15);
    
    const tableData = archive.map(j => [j.name, j.type, j.pieces, j.startDate, j.endDate, j.completedAt]);
    
    doc.autoTable({
        head: [['Cliente', 'Tipo', 'Pezzi', 'Inizio', 'Consegna', 'Chiuso il']],
        body: tableData,
        startY: 25,
        theme: 'grid',
        headStyles: { fillColor: [17, 24, 39] }
    });
    
    doc.save(`Produzione_Export_${new Date().toLocaleDateString()}.pdf`);
}

// Inizializzazione
render();
