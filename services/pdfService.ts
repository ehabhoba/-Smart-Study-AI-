import * as pdfjsLib from 'pdfjs-dist';

// IMPORTANT: Configure worker for pdf.js to work in browser environment without complex build config
// We use unpkg to fetch the worker that matches the installed version exactly.
// Using .mjs extension for the worker is crucial for modern ESM environments.
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

export const extractTextFromPDF = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  
  // Load the PDF document
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  
  let extractedText = '';
  const totalPages = pdf.numPages;
  
  // Iterate through each page
  for (let i = 1; i <= totalPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    
    // Extract text items and join them
    // Note: This is a basic extraction. For complex layouts, more advanced logic might be needed.
    const pageText = textContent.items
      // @ts-ignore
      .map((item: any) => item.str)
      .join(' ');
      
    extractedText += `\n--- صفحة ${i} ---\n${pageText}`;
  }
  
  return extractedText;
};