// app.js

let jobs = [];

// Gestione UI per la comparsa dei campi DTF
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
    const prodType = document.querySelector('input[name="prodType"]:checked').value;
    
    const newJob = {
        id: Date.now(),
        name: document.getElementById('jobName').value,
        startDate: document.getElementById('startDate').value,
        endDate: document.getElementById('endDate').value,
        setupTime: parseInt(document.getElementById('setupTime').value) || 0,
        type: prodType,
        dtfLogos: prodType === 'DTF' ? document.getElementById('dtfLogos').value : null,
        dtfMeters: prodType === 'DTF' ? document.getElementById('dtfMeters').value : null,
        status: 'todo', // 'todo', 'inprogress', 'done'
        actualStartTime: null,
        actualEndTime: null
    };

    jobs.push(newJob);
    this.reset();
    dtfFields.classList.add('hidden');
    renderUI();
});

// Azione: Avvia Produzione
function startJob(id) {
    const job = jobs.find(j => j.id === id);
    if(job) {
        job.status = 'inprogress';
        job.actualStartTime = new Date().toISOString();
        renderUI();
    }
}

// Azione: Termina Produzione
function finishJob(id) {
    const job = jobs.find(j => j.id === id);
    if(job) {
        job.status = 'done';
        job.actualEndTime = new Date().toISOString();
        renderUI();
    }
}

// Eliminazione definitiva
function deleteJob(id) {
    jobs = jobs.filter(job => job.id !== id);
    renderUI();
}

// Utilità per formattare Data e Ora
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

// Funzione principale di rendering dell'Interfaccia
function renderUI() {
    const listContainer = document.getElementById('jobList');
    const archiveContainer = document.getElementById('archiveList');
    
    listContainer.innerHTML = '';
    archiveContainer.innerHTML = '';

    // Lavori in coda
    let activeJobs = jobs.filter(j => j.status !== 'done');
    activeJobs.sort((a, b) => new Date(a.endDate) - new Date(b.endDate));
    document.getElementById('activeCount').innerText = activeJobs.length;

    if (activeJobs.length === 0) {
        listContainer.innerHTML = '<p class="text-gray-500 italic">Nessun lavoro in coda.</p>';
    } else {
        activeJobs.forEach(job => listContainer.innerHTML += createCardHTML(job));
    }

    // Lavori archiviati
    let doneJobs = jobs.filter(j => j.status === 'done');
    doneJobs.sort((a, b) => new Date(b.actualEndTime) - new Date(a.actualEndTime));

    if (doneJobs.length === 0) {
        archiveContainer.innerHTML = '<p class="text-gray-500 italic text-sm">Nessun lavoro archiviato.</p>';
    } else {
        doneJobs.forEach(job => archiveContainer.innerHTML += createArchiveCardHTML(job));
    }
}

// Genera l'HTML per la card in coda
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

// Genera l'HTML per la card archiviata
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
                <p class="text-xs text-gray-500 mt-1">${job.type}${dtfInfo}</p>
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

// Inizializza l'interfaccia al caricamento della pagina
renderUI();
