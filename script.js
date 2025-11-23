let currentData = null;
let maxLog2FC = 0;

// File input handler
document.getElementById('fileInput').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        document.getElementById('fileName').textContent = `Loaded: ${file.name}`;
        parseFile(file);
    }
});

// Parse CSV/TSV file
function parseFile(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const text = e.target.result;
        const lines = text.split('\n').filter(line => line.trim());
        
        // Detect delimiter
        const delimiter = text.includes('\t') ? '\t' : ',';
        const headers = lines[0].split(delimiter).map(h => h.trim());
        
        // Find required columns
        const padjIndex = headers.findIndex(h => h.toLowerCase() === 'padj');
        const log2FCIndex = headers.findIndex(h => 
            h.toLowerCase() === 'log2foldchange' || 
            h.toLowerCase() === 'log2fc' ||
            h.toLowerCase() === 'log2(foldchange)'
        );
        const geneNameIndex = headers.findIndex(h => 
            h.toLowerCase() === 'gene_name' || 
            h.toLowerCase() === 'genename' ||
            h.toLowerCase() === 'gene'
        );
        
        if (padjIndex === -1 || log2FCIndex === -1 || geneNameIndex === -1) {
            alert('Error: Required columns not found. Please ensure your file contains: padj, log2FoldChange (or log2FC), and gene_name columns.');
            return;
        }
        
        // Parse data
        const data = [];
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(delimiter).map(v => v.trim());
            const padj = parseFloat(values[padjIndex]);
            const log2FC = parseFloat(values[log2FCIndex]);
            const geneName = values[geneNameIndex];
            
            // Skip rows with invalid data
            if (isNaN(padj) || isNaN(log2FC) || !geneName) {
                continue;
            }
            
            // Calculate -log10(padj) for plotting
            const negLog10Padj = -Math.log10(padj);
            
            data.push({
                gene_name: geneName,
                padj: padj,
                log2FoldChange: log2FC,
                negLog10Padj: negLog10Padj
            });
        }
        
        currentData = data;
        
        // Calculate max log2FC for cutoff validation
        maxLog2FC = Math.max(...data.map(d => Math.abs(d.log2FoldChange)));
        document.getElementById('log2FCCutoff').max = maxLog2FC;
        document.getElementById('log2FCRange').textContent = `(0 - ${maxLog2FC.toFixed(2)})`;
        
        // Enable update button
        document.getElementById('updatePlot').disabled = false;
        
        // Auto-generate plot
        updatePlot();
    };
    reader.readAsText(file);
}

// Update plot function
function updatePlot() {
    if (!currentData) {
        alert('Please upload a file first.');
        return;
    }
    
    const padjCutoff = parseFloat(document.getElementById('padjCutoff').value);
    const log2FCCutoff = parseFloat(document.getElementById('log2FCCutoff').value);
    
    // Validate inputs
    if (isNaN(padjCutoff) || padjCutoff < 0 || padjCutoff > 1) {
        alert('P-adj cutoff must be between 0 and 1.');
        return;
    }
    
    if (isNaN(log2FCCutoff) || log2FCCutoff < 0 || log2FCCutoff > maxLog2FC) {
        alert(`Log2FC cutoff must be between 0 and ${maxLog2FC.toFixed(2)}.`);
        return;
    }
    
    // Categorize genes
    const grayGenes = [];
    const redGenes = [];
    const blueGenes = [];
    
    currentData.forEach(gene => {
        if (gene.padj >= padjCutoff) {
            grayGenes.push(gene);
        } else if (gene.log2FoldChange > log2FCCutoff) {
            redGenes.push(gene);
        } else if (gene.log2FoldChange < -1 * log2FCCutoff) {
            blueGenes.push(gene);
        } else {
            grayGenes.push(gene);
        }
    });
    
    // Prepare traces
    const traces = [];
    
    if (grayGenes.length > 0) {
        traces.push({
            x: grayGenes.map(g => g.log2FoldChange),
            y: grayGenes.map(g => g.negLog10Padj),
            text: grayGenes.map(g => g.gene_name),
            mode: 'markers',
            type: 'scatter',
            name: 'Not significant',
            marker: {
                color: 'gray',
                size: 5,
                opacity: 0.6
            },
            hovertemplate: '<b>%{text}</b><br>Log2FC: %{x:.3f}<br>-Log10(P-adj): %{y:.3f}<extra></extra>'
        });
    }
    
    if (redGenes.length > 0) {
        traces.push({
            x: redGenes.map(g => g.log2FoldChange),
            y: redGenes.map(g => g.negLog10Padj),
            text: redGenes.map(g => g.gene_name),
            mode: 'markers',
            type: 'scatter',
            name: 'Upregulated',
            marker: {
                color: 'red',
                size: 6,
                opacity: 0.7
            },
            hovertemplate: '<b>%{text}</b><br>Log2FC: %{x:.3f}<br>-Log10(P-adj): %{y:.3f}<extra></extra>'
        });
    }
    
    if (blueGenes.length > 0) {
        traces.push({
            x: blueGenes.map(g => g.log2FoldChange),
            y: blueGenes.map(g => g.negLog10Padj),
            text: blueGenes.map(g => g.gene_name),
            mode: 'markers',
            type: 'scatter',
            name: 'Downregulated',
            marker: {
                color: 'blue',
                size: 6,
                opacity: 0.7
            },
            hovertemplate: '<b>%{text}</b><br>Log2FC: %{x:.3f}<br>-Log10(P-adj): %{y:.3f}<extra></extra>'
        });
    }
    
    // Add horizontal line at padj cutoff
    const negLog10PadjCutoff = -Math.log10(padjCutoff);
    const minX = Math.min(...currentData.map(d => d.log2FoldChange));
    const maxX = Math.max(...currentData.map(d => d.log2FoldChange));
    
    traces.push({
        x: [minX, maxX],
        y: [negLog10PadjCutoff, negLog10PadjCutoff],
        mode: 'lines',
        type: 'scatter',
        name: 'P-adj cutoff',
        line: {
            color: 'black',
            width: 2,
            dash: 'dash'
        },
        showlegend: true,
        hoverinfo: 'skip'
    });
    
    // Add vertical lines at log2FC cutoffs
    traces.push({
        x: [log2FCCutoff, log2FCCutoff],
        y: [0, Math.max(...currentData.map(d => d.negLog10Padj))],
        mode: 'lines',
        type: 'scatter',
        name: 'Log2FC cutoff',
        line: {
            color: 'black',
            width: 1,
            dash: 'dot'
        },
        showlegend: true,
        hoverinfo: 'skip'
    });
    
    traces.push({
        x: [-log2FCCutoff, -log2FCCutoff],
        y: [0, Math.max(...currentData.map(d => d.negLog10Padj))],
        mode: 'lines',
        type: 'scatter',
        name: '-Log2FC cutoff',
        line: {
            color: 'black',
            width: 1,
            dash: 'dot'
        },
        showlegend: true,
        hoverinfo: 'skip'
    });
    
    // Layout
    const layout = {
        title: {
            text: 'Volcano Plot',
            font: { size: 24, color: '#333' }
        },
        xaxis: {
            title: {
                text: 'Log2 Fold Change',
                font: { size: 14 }
            },
            showgrid: true,
            gridcolor: '#e0e0e0'
        },
        yaxis: {
            title: {
                text: '-Log10(P-adj)',
                font: { size: 14 }
            },
            showgrid: true,
            gridcolor: '#e0e0e0'
        },
        hovermode: 'closest',
        plot_bgcolor: 'white',
        paper_bgcolor: 'white',
        legend: {
            x: 1.02,
            y: 1,
            bgcolor: 'rgba(255, 255, 255, 0.8)',
            bordercolor: '#ccc',
            borderwidth: 1
        },
        margin: { l: 70, r: 100, t: 60, b: 60 }
    };
    
    // Plot
    Plotly.newPlot('volcanoPlot', traces, layout, {
        responsive: true,
        displayModeBar: true,
        modeBarButtonsToAdd: ['toImage']
    });
    
    // Update info
    document.getElementById('plotInfo').innerHTML = `
        <strong>Summary:</strong><br>
        Total genes: ${currentData.length}<br>
        Upregulated (red): ${redGenes.length}<br>
        Downregulated (blue): ${blueGenes.length}<br>
        Not significant (gray): ${grayGenes.length}
    `;
    
    // Enable export button
    document.getElementById('exportPDF').disabled = false;
}

// Export to PDF
document.getElementById('exportPDF').addEventListener('click', function() {
    if (!currentData) {
        alert('Please generate a plot first.');
        return;
    }
    
    // Get plot as image using Plotly's toImage
    const plotDiv = document.getElementById('volcanoPlot');
    Plotly.toImage(plotDiv, {
        format: 'png',
        width: 1200,
        height: 800
    }).then(function(dataUrl) {
        // Create a temporary image element
        const img = new Image();
        img.onload = function() {
            // Create PDF using jsPDF
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF('landscape', 'pt', [1200, 800]);
            
            // Add image to PDF
            pdf.addImage(dataUrl, 'PNG', 0, 0, 1200, 800);
            
            // Add title and info at the top
            pdf.setFontSize(16);
            pdf.text('DESeq2 Volcano Plot', 40, 30);
            
            const padjCutoff = document.getElementById('padjCutoff').value;
            const log2FCCutoff = document.getElementById('log2FCCutoff').value;
            pdf.setFontSize(10);
            pdf.text(`P-adj cutoff: ${padjCutoff} | Log2FC cutoff: ${log2FCCutoff}`, 40, 50);
            
            // Save PDF
            pdf.save('volcano_plot.pdf');
        };
        img.src = dataUrl;
    }).catch(function(err) {
        console.error('Error exporting plot:', err);
        alert('Error exporting plot. Please try again.');
    });
});

// Update plot button
document.getElementById('updatePlot').addEventListener('click', updatePlot);

// Allow Enter key to update plot
document.getElementById('padjCutoff').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') updatePlot();
});

document.getElementById('log2FCCutoff').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') updatePlot();
});

