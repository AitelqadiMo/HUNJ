
declare global {
    interface Window {
        pdfjsLib: any;
    }
}

export const extractTextFromPDF = async (file: File): Promise<string> => {
    if (!window.pdfjsLib) {
        throw new Error("PDF.js library not loaded");
    }

    try {
        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = window.pdfjsLib.getDocument(arrayBuffer);
        const pdf = await loadingTask.promise;
        
        let fullText = '';
        
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            
            // Simple extraction: join strings with spaces
            // Advanced extraction might use item.transform to guess layout, but this suffices for LLM parsing
            const pageText = textContent.items.map((item: any) => item.str).join(' ');
            fullText += pageText + '\n\n';
        }

        return fullText;
    } catch (error) {
        console.error("Error parsing PDF:", error);
        throw new Error("Failed to read PDF file. Please ensure it is not password protected.");
    }
};
