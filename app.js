// ==========================================
// FUNZIONI DI ESPORTAZIONE (CSV e PDF)
// ==========================================

function exportCSV() {
    let doneJobs = jobs.filter(j => j.status === 'done');
    if (doneJobs.length === 0) {
        alert("Nessun lavoro completato da esportare!");
        return;
    }

    // Intestazione colonne
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Nome Lavoro,Reparto,Avviamento (min),Produzione (min),Totale Tempo (min),Data Completamento,Loghi DTF,Metri DTF\n";

    // Dati
    doneJobs.forEach(job => {
        const start = new Date(job.actualStartTime);
        const end = new Date(job.actualEndTime);
        const prodTimeMin = Math.round((end - start) / 60000);
        const totalTime = job.setupTime + prodTimeMin;

        let row = [
            `"${job.name}"`, // Tra virgolette per evitare problemi con le virgole nei nomi
            job.type,
            job.setupTime,
            prodTimeMin,
            totalTime,
            `${formatDate(job.actualEndTime)} ${formatTime(job.actualEndTime)}`,
            job.dtfLogos || 0,
            job.dtfMeters || 0
        ].join(",");
        csvContent += row + "\n";
    });

    // Download
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Report_Produzione_${formatDate(new Date().toISOString())}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function exportPDF() {
    let doneJobs = jobs.filter(j => j.status === 'done');
    if (doneJobs.length === 0) {
        alert("Nessun lavoro completato da esportare!");
        return;
    }

    // Inizializza jsPDF
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Titolo documento
    doc.setFontSize(16);
    doc.text("Report Produzione - Promo-One", 14, 15);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generato il: ${formatDate(new Date().toISOString())}`, 14, 22);

    // Preparazione Dati per la Tabella
    const tableColumn = ["Nome Lavoro", "Reparto", "Data Fine", "Avviamento", "Produzione", "Totale"];
    const tableRows = [];

    doneJobs.forEach(job => {
        const start = new Date(job.actualStartTime);
        const end = new Date(job.actualEndTime);
        const prodTimeMin = Math.round((end - start) / 60000);
        const totalTime = job.setupTime + prodTimeMin;

        const jobData = [
            job.name,
            job.type,
            formatDate(job.actualEndTime),
            `${job.setupTime} min`,
            `${prodTimeMin} min`,
            `${totalTime} min`
        ];
        tableRows.push(jobData);
    });

    // Generazione Tabella
    doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 30,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [17, 24, 39] } // Colore grigio scuro in stile con l'app
    });

    // Download
    doc.save(`Report_Produzione_${formatDate(new Date().toISOString())}.pdf`);
}
