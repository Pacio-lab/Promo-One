// Caricamento dati iniziali
let jobs = JSON.parse(localStorage.getItem('promoOne_jobs')) || [];
let archive = JSON.parse(localStorage.getItem('promoOne_archive')) || [];

// Elementi DOM
const jobForm = document.getElementById('jobForm');
const dtfFields = document.getElementById('dtfFields');
const prodRadios = document.getElementsByName('prodType');

// Gestione visibilità campi DTF
prodRadios.forEach(radio => {
    radio.addEventListener('change', () => {
        if (document.getElementById('dtf').checked) {
            dtfFields.classList.remove('hidden');
        } else {
            dtfFields.classList.add('hidden');
        }
    });
});

// Aggiunta Lavoro
jobForm.onsubmit = (e) => {
    e.preventDefault();
    
    const newJob = {
        id: Date.now(),
        name: document.getElementById('jobName').value,
        start: document.getElementById('startDate').value,
        end: document.getElementById('endDate').value,
        setup: document.getElementById('setupTime').value,
        pieces: document.getElementById('jobPieces').value,
        type: document.querySelector('input[name="prodType"]:checked').value,
        dtfLogos: document.getElementById('dtfLogos').value || '-',
        dtfMeters: document.getElementById('dtfMeters').value || '-',
        timestamp: new Date().toLocaleString('it-IT')
    };

    jobs.push(newJob);
    updateData();
    jobForm.reset();
    dtfFields.classList.add('hidden');
};

// Funzioni di gestione
function completeJob(id) {
    const jobIndex = jobs.findIndex(j => j.id === id);
    const job = jobs.splice(jobIndex, 1)[0];
    job.completedAt = new Date().toLocaleString('it-IT');
    archive.push(job);
    updateData();
}

function deleteJob(id, fromArchive = false) {
    if (confirm("Vuoi eliminare definitivamente questo record?")) {
        if (fromArchive) {
            archive = archive.filter(j => j.id !== id);
        } else {
            jobs = jobs.filter(j => j.id !== id);
        }
        updateData();
    }
}

function updateData() {
    localStorage.setItem('promoOne_jobs', JSON.stringify(jobs));
    localStorage.setItem('promoOne_archive', JSON.stringify(archive));
    render();
}

// Rendering UI
function render() {
    const jobList = document.getElementById('jobList');
    const archiveList = document.getElementById('archiveList');
    
    document.getElementById('activeCount').innerText = jobs.length;
    jobList.innerHTML = '';
    archiveList.innerHTML = '';

    jobs.forEach(job => {
        jobList.innerHTML += `
            <div class="bg-white p-5 rounded-xl shadow-sm border-l-4 border-blue-600 flex justify-between items-center mb-4">
                <div>
                    <h3 class="font-bold text-gray-900 uppercase">${job.name}</h3>
                    <p class="text-sm text-gray-600">Tipo: <b>${job.type}</b> | Q.tà: <b>${job.pieces}</b></p>
                    <p class="text-xs text-red-500 font-bold">Consegna: ${job.end}</p>
                    ${job.type === 'DTF' ? `<p class="text-xs text-blue-700 mt-1">🎞️ ${job.dtfLogos} loghi / ${job.dtfMeters}m</p>` : ''}
                </div>
                <div class="flex gap-2">
                    <button onclick="completeJob(${job.id})" class="bg-green-600 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-sm hover:bg-green-700">FINE</button>
                    <button onclick="deleteJob(${job.id})" class="bg-gray-100 text-gray-400 p-2 rounded-lg hover:bg-red-100 hover:text-red-600">🗑️</button>
                </div>
            </div>`;
    });

    archive.slice().reverse().forEach(job => {
        archiveList.innerHTML += `
            <div class="bg-white/60 p-3 rounded-lg flex justify-between items-center mb-2 border border-gray-200">
                <div class="text-xs">
                    <span class="font-bold">${job.name}</span> - ${job.type}
                    <div class="text-gray-500 italic">Completato il: ${job.completedAt}</div>
                </div>
                <button onclick="deleteJob(${job.id}, true)" class="text-red-400 hover:text-red-600">Elimina</button>
            </div>`;
    });
}

// Export PDF
window.exportPDF = function() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("PROMO ONE - ARCHIVIO PRODUZIONE", 14, 20);
    
    const rows = archive.map(j => [j.name, j.type, j.pieces, j.end, j.completedAt]);
    doc.autoTable({
        head: [['Cliente', 'Tipo', 'Pezzi', 'Consegna', 'Chiuso il']],
        body: rows,
        startY: 30,
        styles: { fontSize: 9 }
    });
    doc.save("Archivio_Produzione.pdf");
};

// Reset Totale
window.hardReset = () => {
    if(confirm("Cancellare tutto?")) { localStorage.clear(); location.reload(); }
};

// Avvio iniziale
render();
