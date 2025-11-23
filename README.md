# DESeq2 Volcano Plot Generator

A web-based tool for visualizing DESeq2 differential gene expression results as interactive volcano plots.

## Features

- **File Upload**: Accepts CSV/TSV files from DESeq2 output
- **Interactive Plotting**: Real-time volcano plot generation with customizable thresholds
- **Color Coding**:
  - Gray: Genes with padj ≥ padj.cutoff (not significant)
  - Red: Upregulated genes (padj < padj.cutoff AND log2FoldChange > log2FC.cutoff)
  - Blue: Downregulated genes (padj < padj.cutoff AND log2FoldChange < -log2FC.cutoff)
- **Threshold Controls**:
  - P-adj cutoff: Range 0 to 1
  - Log2FC cutoff: Range 0 to maximum log2FoldChange in dataset
- **Visual Guides**: Dashed horizontal line at padj cutoff, dotted vertical lines at ±log2FC cutoffs
- **PDF Export**: Export high-quality PDF versions of the plot

## Required Input File Format

Your DESeq2 output file must contain the following columns:
- `padj` or `padj` (adjusted p-value)
- `log2FoldChange` or `log2FC` or `log2(foldchange)` (log2 fold change)
- `gene_name` or `geneName` or `gene` (gene identifier)

The file can be in CSV or TSV format.

## Usage

1. Open `index.html` in a modern web browser
2. Click "Choose DESeq2 Output File" and select your DESeq2 results file
3. Adjust the thresholds:
   - **P-adj Cutoff**: Significance threshold (default: 0.05)
   - **Log2FC Cutoff**: Fold change threshold (default: 1.0)
4. Click "Update Plot" to regenerate the plot with new thresholds
5. Click "Export as PDF" to download a PDF version of the plot

## Technical Details

- Built with vanilla JavaScript, HTML5, and CSS3
- Uses Plotly.js for interactive plotting
- Uses jsPDF for PDF generation
- No server required - runs entirely in the browser

## Browser Compatibility

Works best in modern browsers:
- Chrome/Edge (recommended)
- Firefox
- Safari

