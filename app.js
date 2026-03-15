// --- STATO DELL'APPLICAZIONE ---
let jobs = JSON.parse(localStorage.getItem('promo_one_db_jobs')) || [];
let archive = JSON.parse(localStorage.getItem('promo_one_db_archive')) || [];

const jobForm = document.getElementById('jobForm');
const dtfFields = document.getElementById('dtfFields');
const prodRadios = document.getElementsByName('prodType');

// --- GESTIONE CAMPI DINAMICI ---
prodRadios.forEach(radio => {
    radio.addEventListener('change', () => {
        if (document.getElementById('dtf').checked) {
            dtfFields.classList.remove('hidden');
        } else {
            dtfFields.classList.add('hidden');
        }
    });
});

// --- AGGIUNTA NUOVO LAVORO ---
jobForm.onsubmit = (e) => {
    e.preventDefault();

    const newJob = {
        id: Date.now(),
        name: document.getElementById('jobName').value.toUpperCase(),
        start: document.getElementById('startDate').value,
        end: document.getElementById('endDate').value,
        setup: document.getElementById('setupTime').value,
        pieces: document.getElementById('jobPieces').value,
        type: document.querySelector('input[name="prodType"]:checked').value,
        dtfLogos: document.getElementById('dtfLogos').value || '-',
        dtfMeters: document.getElementById('dtfMeters').value || '-',
        createdAt: new Date().toLocaleString('it-IT')
    };

    jobs.push(newJob);
    saveData();
    jobForm.reset();
    dtfFields.classList.add('hidden');
};

// --- FUNZIONI DI AZIONE ---
function completeJob(id) {
    const index = jobs.findIndex(j => j.id === id);
    if (index !== -1) {
        const item = jobs.splice(index, 1)[0];
        item.completedAt = new Date().toLocaleString('it-IT');
        archive.push(item);
        saveData();
    }
}

function deleteJob(id, isArchive = false) {
    if (confirm("Sei sicuro di voler eliminare definitivamente?")) {
        if (isArchive) {
            archive = archive.filter(j => j.id !== id);
        } else {
            jobs = jobs.filter(j => j.id !== id);
        }
        saveData();
    }
}

function saveData() {
    localStorage.setItem('promo_one_db_jobs', JSON.stringify(jobs));
    localStorage.setItem('promo_one_db_archive', JSON.stringify(archive));
    render();
}

// --- RENDERIZZAZIONE INTERFACCIA ---
function render() {
    const jobList = document.getElementById('jobList');
    const archiveList = document.getElementById('archiveList');
    const activeCount = document.getElementById('activeCount');

    jobList.innerHTML = '';
    archiveList.innerHTML = '';
    activeCount.innerText = jobs.length;

    // Rendering Lavori Attivi
    jobs.forEach(job => {
        jobList.innerHTML += `
            <div class="bg-white p-5 rounded-xl border-l-8 border-blue-600 shadow-sm animate-job flex justify-between items-center">
                <div class="space-y-1">
                    <h3 class="font-black text-gray-900 text-lg">${job.name}</h3>
                    <div class="flex gap-3 text-xs font-bold text-gray-500 uppercase">
                        <span class="bg-gray-100 px-2 py-0.5 rounded">${job.type}</span>
                        <span>Pezzi: ${job.pieces}</span>
                    </div>
                    <p class="text-sm text-red-600 font-bold">Consegna: ${job.end}</p>
                    ${job.type === 'DTF' ? `<p class="text-xs text-blue-700 font-medium bg-blue-50 p-1 rounded">🎞️ ${job.dtfLogos} loghi / ${job.dtfMeters} metri</p>` : ''}
                </div>
                <div class="flex flex-col gap-2">
                    <button onclick="completeJob(${job.id})" class="bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 shadow-sm transition">FINE</button>
                    <button onclick="deleteJob(${job.id})" class="text-gray-400 hover:text-red-500 text-xs">Elimina</button>
                </div>
            </div>`;
    });

    // Rendering Archivio
    archive.slice().reverse().forEach(job => {
        archiveList.innerHTML += `
            <div class="bg-white/50 p-3 rounded-lg flex justify-between items-center border border-gray-200/50">
                <div class="text-xs">
                    <span class="font-bold text-gray-800">${job.name}</span> - ${job.type}
                    <div class="text-[10px] text-gray-500">Completato il: ${job.completedAt}</div>
                </div>
                <button onclick="deleteJob(${job.id}, true)" class="text-gray-400 hover:text-red-500 text-xs">🗑️</button>
            </div>`;
    });
}

// --- ESPORTAZIONE PDF ---
window.exportPDF = function() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.text("PROMO ONE - REPORT PRODUZIONE", 14, 22);
    doc.setFontSize(10);
    doc.text("Generato il: " + new Date().toLocaleString(), 14, 30);

    const body = archive.map(j => [j.name, j.type, j.pieces, j.end, j.completedAt]);
    
    doc.autoTable({
        head: [['CLIENTE', 'TIPO', 'PZ', 'CONSEGNA', 'DATA CHIUSURA']],
        body: body,
        startY: 35,
        theme: 'striped',
        headStyles: { fillColor: [30, 41, 59] }
    });

    doc.save(`Archivio_Produzione_${Date.now()}.pdf`);
};

// --- RESET TOTALE ---
window.hardReset = () => {
    if (confirm("⚠️ Vuoi davvero cancellare TUTTI i dati? L'operazione non è reversibile.")) {
        localStorage.clear();
        location.reload();
    }
};

// Start
render();
