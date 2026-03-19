// app.js

let jobs = JSON.parse(localStorage.getItem('promoOneJobs')) || [];

function saveData() {
    localStorage.setItem('promoOneJobs', JSON.stringify(jobs));
}

// Gestione UI DTF
const radios = document.querySelectorAll('input[name="prodType"]');
const dtfFields = document.getElementById('dtfFields');

radios.forEach(radio => {
    radio.addEventListener('change', (e) => {
        if(e.target.value === 'DTF') {
            dtfFields.classList.remove('hidden');
        } else {
            dtfFields.classList.add('hidden');
            document.getElementById('dtfLogos').value = '';
            document.getElementById('dtfMeters').value = '';
        }
    });
});

// Inserimento nuovo lavoro
document.getElementById('jobForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    // CONTROLLO DI SICUREZZA
    const selectedRadio = document.querySelector('input[name="prodType"]:checked');
    if (!selectedRadio) {
        alert("Attenzione: Devi prima selezionare una Tipologia di Produzione (Digitale, UV, DTF...)");
        return;
    }

    const prodType = selectedRadio.value;
    
    const newJob = {
        id: Date.now(),
        name: document.getElementById('jobName').value,
        startDate: document.getElementById('startDate').value,
        endDate: document.getElementById('endDate').value,
        setupTime: parseInt(document.getElementById('setupTime').value) || 0,
        pieces: parseInt(document.getElementById('jobPieces').value) || 1, // Quantità Pezzi
        type: prodType,
        dtfLogos: prodType === 'DTF' ? document.getElementById('dtfLogos').value : null,
        dtfMeters: prodType === 'DTF' ? document.getElementById('dtfMeters').value : null,
        status: 'todo',
        actualStartTime: null,
        actualEndTime: null
    };

    jobs.push(newJob);
    saveData();
    this.reset();
    dtfFields.classList.add('hidden');
    renderUI();
});

// Avvia
function startJob(id) {
    const job = jobs.find(j => j.id === id);
    if(job) {
        job.status = 'inprogress';
        job.actualStartTime = new Date().toISOString();
        saveData();
        renderUI();
    }
}

// Termina
function finishJob(id) {
    const job = jobs.find(j => j.id === id);
    if(job) {
        job.status = 'done';
        job.actualEndTime = new Date().toISOString();
        saveData();
        renderUI();
    }
}

// Elimina
function deleteJob(id) {
    jobs = jobs.filter(job => job.id !== id);
    saveData();
    renderUI();
}

// Formattazione
function formatTime(isoString) {
    if (!isoString) return '';
    const d = new Date(isoString);
    return d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(isoString) {
    if (!isoString) return '';
    const d = new Date(isoString);
    return d.toLocaleDateString('it-IT');
}

// Rendering UI
function renderUI() {
    const listContainer = document.getElementById('jobList');
    const archiveContainer = document.getElementById('archiveList');
    // NUOVO: Riferimento al contenitore dell'anteprima PDF
    const pdfPreviewContainer = document.getElementById('pdfPreviewContainer');
    
    listContainer.innerHTML = '';
    archiveContainer.innerHTML = '';
    // Pulisci l'anteprima PDF
    if(pdfPreviewContainer) pdfPreviewContainer.innerHTML = '';

    // Lavori in coda
    let activeJobs = jobs.filter(j => j.status !== 'done');
    activeJobs.sort((a, b) => new Date(a.endDate) - new Date(b.endDate));
    
    const activeCountEl = document.getElementById('activeCount');
    if(activeCountEl) activeCountEl.innerText = activeJobs.length;

    if (activeJobs.length === 0) {
        listContainer.innerHTML = '<p class="text-gray-500 italic">Nessun lavoro in coda.</p>';
    } else {
        activeJobs.forEach(job => listContainer.innerHTML += createCardHTML(job));
    }

    // Lavori archiviati
    let doneJobs = jobs.filter(j => j.status === 'done');
    doneJobs.sort((a, b) => new Date(b.actualEndTime) - new Date(a.actualEndTime));

    // NUOVO: Mostra l'anteprima PDF se ci sono lavori archiviati
    if(doneJobs.length > 0 && pdfPreviewContainer) {
        pdfPreviewContainer.innerHTML = `
            <div class="mb-6 p-4 bg-gray-100 rounded-lg border border-gray-200">
                <p class="text-sm font-semibold text-gray-700 mb-2 text-center">Anteprima Report PDF (Scheda Tecnica):</p>
                <div class="pdf-report-preview mx-auto"></div>
                <p class="text-xs text-gray-500 mt-2 text-center">(Nota: Questa è un'anteprima grafica. Il PDF generato conterrà i dati reali.)</p>
            </div>
        `;
    }

    if (doneJobs.length === 0) {
        archiveContainer.innerHTML = '<p class="text-gray-500 italic text-sm">Nessun lavoro archiviato.</p>';
    } else {
        doneJobs.forEach(job => archiveContainer.innerHTML += createArchiveCardHTML(job));
    }
}

// HTML Card Coda
function createCardHTML(job) {
    const today = new Date();
    const deliveryDate = new Date(job.endDate);
    const isUrgent = (Math.ceil(Math.abs(deliveryDate - today) / (1000 * 60 * 60 * 24)) <= 3) && (deliveryDate >= today);
    
    let dtfInfo = job.type === 'DTF' ? `<div class="mt-2 text-sm bg-blue-50 px-2 py-1 rounded text-blue-800 border border-blue-100 inline-block">Loghi: ${job.dtfLogos || 0} | Metri: ${job.dtfMeters || 0}m</div>` : '';

    let actionArea = '';
    if (job.status === 'todo') {
        actionArea = `<button onclick="startJob(${job.id})" class="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded shadow transition text-sm flex items-center gap-1">▶️ Avvia</button>`;
    } else if (job.status === 'inprogress') {
        actionArea = `
            <div class="text-right">
                <span class="block text-xs text-green-600 font-bold mb-1 animate-pulse">In lavorazione dalle ${formatTime(job.actualStartTime)}</span>
                <button onclick="finishJob(${job.id})" class="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded shadow transition text-sm flex items-center gap-1 w-full justify-center">⏹️ Termina</button>
            </div>`;
    }

    return `
        <div class="bg-white p-4 rounded-xl shadow-sm border ${isUrgent ? 'border-red-400 border-l-4' : 'border-gray-200 border-l-4 border-l-blue-500'} flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition hover:shadow-md">
            <div class="flex-1">
                <div class="flex items-center gap-2 mb-1">
                    <h3 class="font-bold text-lg text-gray-900">${job.name}</h3>
                    ${isUrgent ? '<span class="bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded">URGENTE</span>' : ''}
                </div>
                <span class="inline-block bg-gray-100 text-gray-700 text-xs font-semibold px-2 py-1 rounded">Reparto: ${job.type}</span>
                <span class="inline-block text-gray-500 text-xs ml-2">📦 Pezzi: ${job.pieces || 0}</span>
                <span class="inline-block text-gray-500 text-xs ml-2">⏱️ Avviamento: ${job.setupTime} min</span>
                <br>${dtfInfo}
            </div>
            <div class="text-sm text-gray-600 border-l pl-4 border-gray-100">
                <p>Scadenza: <strong class="text-gray-900">${formatDate(job.endDate)}</strong></p>
            </div>
            <div class="w-full md:w-auto mt-2 md:mt-0">
                ${actionArea}
            </div>
        </div>
    `;
}

// HTML Card Archivio
function createArchiveCardHTML(job) {
    const start = new Date(job.actualStartTime);
    const end = new Date(job.actualEndTime);
    const prodTimeMin = Math.round((end - start) / 60000);
    const totalTime = job.setupTime + prodTimeMin;

    let dtfInfo = job.type === 'DTF' ? ` | Loghi: ${job.dtfLogos} | ${job.dtfMeters}m` : '';

    return `
        <div class="bg-gray-100 p-4 rounded-xl border border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
            <div class="flex-1">
                <h3 class="font-bold text-gray-700 line-through decoration-gray-400">${job.name}</h3>
                <p class="text-xs text-gray-500 mt-1">${job.type} | 📦 Pezzi: ${job.pieces || 0}${dtfInfo}</p>
            </div>
            <div class="text-xs text-gray-600 bg-white p-2 rounded border border-gray-200 shadow-sm text-center">
                <p>Inizio: <strong>${formatTime(job.actualStartTime)}</strong> - Fine: <strong>${formatTime(job.actualEndTime)}</strong></p>
                <p class="mt-1 text-blue-700 font-semibold">Tempo Totale: ${totalTime} min <span class="text-gray-400 font-normal">(Avvi. ${job.setupTime}m + Prod. ${prodTimeMin}m)</span></p>
            </div>
            <div class="text-xs text-gray-500 text-right">
                Completato il<br><strong class="text-gray-700">${formatDate(job.actualEndTime)}</strong>
            </div>
            <button onclick="deleteJob(${job.id})" class="text-gray-400 hover:text-red-500" title="Elimina definitivamente">
                🗑️
            </button>
        </div>
    `;
}

// Export CSV
function exportCSV() {
    let doneJobs = jobs.filter(j => j.status === 'done');
    if (doneJobs.length === 0) {
        alert("Nessun lavoro completato da esportare!");
        return;
    }
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Nome Lavoro,Reparto,Quantità,Avviamento (min),Produzione (min),Totale Tempo (min),Data Completamento,Loghi DTF,Metri DTF\n";
    doneJobs.forEach(job => {
        const start = new Date(job.actualStartTime);
        const end = new Date(job.actualEndTime);
        const prodTimeMin = Math.round((end - start) / 60000);
        const totalTime = job.setupTime + prodTimeMin;
        let row = [
            `"${job.name}"`,
            job.type,
            job.pieces || 0,
            job.setupTime,
            prodTimeMin,
            totalTime,
            `${formatDate(job.actualEndTime)} ${formatTime(job.actualEndTime)}`,
            job.dtfLogos || 0,
            job.dtfMeters || 0
        ].join(",");
        csvContent += row + "\n";
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Report_Produzione_${formatDate(new Date().toISOString())}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Export PDF
function exportPDF() {
    let doneJobs = jobs.filter(j => j.status === 'done');
    if (doneJobs.length === 0) {
        alert("Nessun lavoro completato da esportare!");
        return;
    }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Report Produzione - Promo-One", 14, 15);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generato il: ${formatDate(new Date().toISOString())}`, 14, 22);
    
    const tableColumn = ["Nome Lavoro", "Reparto", "Pezzi", "Data Fine", "Avviamento", "Produzione", "Totale"];
    const tableRows = [];
    doneJobs.forEach(job => {
        const start = new Date(job.actualStartTime);
        const end = new Date(job.actualEndTime);
        const prodTimeMin = Math.round((end - start) / 60000);
        const totalTime = job.setupTime + prodTimeMin;
        const jobData = [
            job.name,
            job.type,
            `${job.pieces || 0}`,
            formatDate(job.actualEndTime),
            `${job.setupTime} min`,
            `${prodTimeMin} min`,
            `${totalTime} min`
        ];
        tableRows.push(jobData);
    });
    doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 30,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [17, 24, 39] }
    });
    doc.save(`Report_Produzione_${formatDate(new Date().toISOString())}.pdf`);
}

// Reset Dati
function hardReset() {
    if(confirm("ATTENZIONE: Vuoi cancellare tutti i lavori e ripartire da zero? Usa questo tasto per sbloccare l'app o pulire l'archivio a fine anno.")) {
        localStorage.removeItem('promoOneJobs');
        jobs = [];
        renderUI();
        alert("Memoria pulita con successo! Ora tutto dovrebbe funzionare.");
    }
}

// Inizializza l'interfaccia
renderUI();
