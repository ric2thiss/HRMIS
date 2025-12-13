import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

/**
 * Generates a PDF blob from a leave form element
 * @param {HTMLElement} element - The element containing LeaveFormPdf
 * @param {string} fileName - Optional filename for the PDF
 * @returns {Promise<Blob>} - PDF blob
 */
export const generateLeavePdfBlob = async (element, fileName = 'Leave_Application.pdf') => {
    if (!element) {
        throw new Error('Element is required for PDF generation');
    }

    try {
        // Wait a bit to ensure all content is rendered (especially images)
        await new Promise(resolve => setTimeout(resolve, 500));

        const canvas = await html2canvas(element, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff',
            windowWidth: element.scrollWidth,
            windowHeight: element.scrollHeight,
            scrollX: 0,
            scrollY: 0,
            allowTaint: false,
        });

        const imgData = canvas.toDataURL('image/png', 1.0);
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgWidth = 210; // A4 width in mm
        const pageHeight = 297; // A4 height in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;
        let position = 0;

        // Add first page
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        // Add additional pages if needed
        while (heightLeft > 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
        }

        // Convert to blob
        const pdfBlob = pdf.output('blob');
        return pdfBlob;
    } catch (error) {
        console.error('Error generating PDF:', error);
        throw error;
    }
};

/**
 * Generates a PDF and creates a download link
 * @param {HTMLElement} element - The element containing LeaveFormPdf
 * @param {string} fileName - Filename for the PDF
 */
export const downloadLeavePdf = async (element, fileName) => {
    try {
        const pdfBlob = await generateLeavePdfBlob(element, fileName);
        const url = URL.createObjectURL(pdfBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName || 'Leave_Application.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error downloading PDF:', error);
        throw error;
    }
};

/**
 * Generates a PDF and returns a blob URL for iframe display
 * @param {HTMLElement} element - The element containing LeaveFormPdf
 * @returns {Promise<string>} - Blob URL for the PDF
 */
export const generateLeavePdfUrl = async (element) => {
    try {
        const pdfBlob = await generateLeavePdfBlob(element);
        const url = URL.createObjectURL(pdfBlob);
        return url;
    } catch (error) {
        console.error('Error generating PDF URL:', error);
        throw error;
    }
};

