import https from 'https';

function fetchUrlWithRedirects(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    }, (res) => {
      // Follow HTTP redirects (301, 302, 303, 307, 308)
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(fetchUrlWithRedirects(res.headers.location));
      }
      
      if (res.statusCode !== 200) {
        return reject(new Error(`Failed to retrieve file. Status Code: ${res.statusCode}`));
      }
      
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    }).on('error', (err) => {
      reject(err);
    });
  });
}

export default async function handler(req, res) {
  const { id } = req.query;
  if (!id) {
    return res.status(400).send('Missing Google Drive file ID');
  }

  try {
    const driveUrl = `https://docs.google.com/uc?export=download&id=${id}`;
    const pdfBuffer = await fetchUrlWithRedirects(driveUrl);
    
    // Set headers to force inline PDF rendering
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="report.pdf"');
    return res.send(pdfBuffer);
  } catch (error) {
    return res.status(500).send('Proxy Error: ' + error.message);
  }
}
