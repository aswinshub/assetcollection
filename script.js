async function processLinks() {
    const linkInput = document.getElementById('linkInput').value.trim();
    const links = linkInput ? linkInput.split('\n') : [];
    const proxyUrl = 'http://localhost:3000/proxy?url=';
    const assets = new Set();
 
    if (Array.isArray(links) && links.length > 0) {
        for (const link of links) {
            if (link) {
                try {
                    const response = await fetch(proxyUrl + encodeURIComponent(link.trim()));
                    const htmlContent = await response.text();
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(htmlContent, 'text/html');
 
                    // Handle images and other assets
                    const images = getAllImages(doc);
                    const documents = getAllDocuments(doc);
                    const videos = getAllVideos(doc);
 
                    images.forEach(src => {
                        const id = extractImageId(src);
                        if (id) {
                            assets.add(JSON.stringify({ type: 'image', id }));
                        }
                    });
 
                    documents.forEach(src => {
                        assets.add(JSON.stringify({ type: 'document', src }));
                    });
 
                    videos.forEach(src => {
                        assets.add(JSON.stringify({ type: 'video', src }));
                    });
                } catch (error) {
                    console.error('Error fetching or parsing URL:', link, error);
                }
            }
        }
    }
 
    displayResult(assets);
    writeResultsToExcel(assets);
}
 
function getAllImages(doc) {
    const images = new Set();
 
    // Add images from <img> tags
    doc.querySelectorAll('img').forEach(img => {
        const src = img.dataset.src || img.dataset.lazy || img.src;
        if (src) {
            images.add(src);
        }
    });
 
    // Add images from elements with lazy loading attributes
    doc.querySelectorAll('[data-src], [data-lazy], [data-srcset]').forEach(element => {
        const src = element.dataset.src || element.dataset.lazy || element.dataset.srcset;
        if (src) {
            images.add(src);
        }
    });
 
    // Add images from carousels specifically
    doc.querySelectorAll('.carousel img').forEach(img => {
        const src = img.dataset.src || img.dataset.lazy || img.src;
        if (src) {
            images.add(src);
        }
    });
 
    return Array.from(images);
}
 
function getAllDocuments(doc) {
    const documents = new Set();
 
    // Add PDFs and Excel files from <a> tags
    doc.querySelectorAll('a').forEach(a => {
        const href = a.href;
        if (href && (href.match(/\.pdf$/i) || href.match(/\.xlsx?$/i) || href.startsWith('https://query.prod.cms.rt.microsoft.com/cms/api/am/binary/') || href.includes('cdn') || href.includes('aka.ms'))) {
            documents.add(href);
        }
    });
 
    return Array.from(documents);
}
 
function getAllVideos(doc) {
    const videos = new Set();
 
    doc.querySelectorAll('video, source').forEach(video => {
        const src = video.src || video.dataset.src;
        if (src) {
            videos.add(src);
        }
    });
 
    return Array.from(videos);
}
 
function extractImageId(url) {
    try {
        const urlObj = new URL(url);
        const pathPart = urlObj.pathname.split('/').pop();
        return pathPart;
    } catch (error) {
        console.error('Invalid URL:', url, error);
        return null;
    }
}
 
function displayResult(assets) {
    const resultDiv = document.getElementById('result');
    resultDiv.innerHTML = `<p>Total Assets (${assets.size}):</p>`;
    resultDiv.innerHTML += '<ul>';
    assets.forEach(asset => {
        const assetObj = JSON.parse(asset);
        resultDiv.innerHTML += `<li>${assetObj.type}: ${assetObj.id || assetObj.src}</li>`;
    });
    resultDiv.innerHTML += '</ul>';
}
 
function writeResultsToExcel(assets) {
    const wb = XLSX.utils.book_new();
 
    const wsData = [['Type', 'ID/URL']];
    assets.forEach(asset => {
        const assetObj = JSON.parse(asset);
        wsData.push([assetObj.type, assetObj.id || assetObj.src]);
    });
 
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, 'Results');
    XLSX.writeFile(wb, 'assets_links.xlsx');
}
 
document.getElementById('processButton').addEventListener('click', processLinks);