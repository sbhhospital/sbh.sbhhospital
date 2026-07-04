export default async function handler(req, res) {
  const { id } = req.query;
  if (!id) {
    return res.status(400).send('Missing file id');
  }

  try {
    // Fetch directly from Google Drive
    const driveUrl = `https://docs.google.com/uc?export=download&id=${id}`;
    const response = await fetch(driveUrl);
    
    if (!response.ok) {
      return res.status(response.status).send('Error fetching document from Google Drive');
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Set proper headers so WhatsApp and browsers recognize it as a PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="report.pdf"');
    return res.send(buffer);
  } catch (error) {
    return res.status(500).send('Server Error: ' + error.message);
  }
}
