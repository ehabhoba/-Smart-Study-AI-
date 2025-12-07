import JSZip from 'jszip';

export const extractTextFromPPTX = async (file: File): Promise<{ text: string, images: string[] }> => {
    const zip = new JSZip();
    try {
        const content = await zip.loadAsync(file);
        
        // 1. Extract Images from ppt/media
        const images: string[] = [];
        const mediaFolder = content.folder("ppt/media");
        
        if (mediaFolder) {
            const imageFiles = Object.keys(mediaFolder.files).filter(fileName => 
                fileName.match(/\.(jpg|jpeg|png|webp)$/i)
            );
            
            // Limit to top 15 images to prevent memory issues
            const processedImages = imageFiles.slice(0, 15);

            for (const imgFileName of processedImages) {
                const fileData = await mediaFolder.file(imgFileName.replace("ppt/media/", ""))?.async("base64");
                if (fileData) {
                    const ext = imgFileName.split('.').pop()?.toLowerCase();
                    const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';
                    images.push(`data:${mimeType};base64,${fileData}`);
                }
            }
        }

        // 2. Extract Text
        // Find all slide XML files
        const slideFiles = Object.keys(content.files).filter(fileName => 
            fileName.startsWith('ppt/slides/slide') && fileName.endsWith('.xml')
        );

        if (slideFiles.length === 0) {
            throw new Error('لم يتم العثور على شرائح في ملف الباوربوينت.');
        }

        // Sort slides logically by slide number (e.g., slide1.xml, slide2.xml, slide10.xml)
        slideFiles.sort((a, b) => {
            const numAMatch = a.match(/slide(\d+)\.xml/);
            const numBMatch = b.match(/slide(\d+)\.xml/);
            
            const numA = numAMatch ? parseInt(numAMatch[1]) : 0;
            const numB = numBMatch ? parseInt(numBMatch[1]) : 0;
            return numA - numB;
        });

        let extractedText = '';
        const parser = new DOMParser();

        for (let i = 0; i < slideFiles.length; i++) {
            const fileName = slideFiles[i];
            const xmlContent = await content.files[fileName].async('text');
            
            // Parse XML to find text within <a:t> tags
            const xmlDoc = parser.parseFromString(xmlContent, "text/xml");
            const textNodes = xmlDoc.getElementsByTagName("a:t");
            
            let slideText = '';
            for (let j = 0; j < textNodes.length; j++) {
                slideText += textNodes[j].textContent + ' ';
            }

            if (slideText.trim().length > 0) {
                extractedText += `\n--- شريحة ${i + 1} ---\n${slideText.trim()}\n`;
            }
        }

        return { 
            text: extractedText || "لم يتم العثور على نص قابل للاستخراج في الشرائح.",
            images 
        };

    } catch (error) {
        console.error("PPTX Parsing Error:", error);
        throw new Error("فشل في قراءة ملف الباوربوينت. تأكد من أن الملف سليم.");
    }
};