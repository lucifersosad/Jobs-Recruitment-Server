const fs = require('fs');
const path = require('path');
const { getDocument } = require('pdfjs-dist');
const { PDFDocument, rgb } = require('pdf-lib');

// 📌 Regex số điện thoại Việt Nam cơ bản
const phoneRegex = /\b(0|\+84)\d{8,10}\b/g;

async function extractPhonePositions(pdfBuffer) {
  const loadingTask = getDocument({ data: pdfBuffer });
  const pdf = await loadingTask.promise;
  const phonePositions = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();

    content.items.forEach(item => {
      const matches = item.str.match(phoneRegex);
      if (matches) {
        matches.forEach(match => {
          const [a, b, c, d, x, y] = item.transform;
          phonePositions.push({
            page: i,
            text: match,
            x,
            y,
            width: item.width,
            height: item.height,
          });
        });
      }
    });
  }

  return phonePositions;
}

async function highlightPhonesInPdf(inputPath, outputPath) {
  const pdfBuffer = fs.readFileSync(inputPath);
  const phonePositions = await extractPhonePositions(pdfBuffer);

  const pdfDoc = await PDFDocument.load(pdfBuffer);
  const pages = pdfDoc.getPages();

  phonePositions.forEach(pos => {
    const page = pages[pos.page - 1];
    page.drawRectangle({
      x: pos.x,
      y: pos.y,
      width: pos.width,
      height: pos.height,
      color: rgb(1, 1, 0), // Vàng
      opacity: 0.4,
    });
  });

  const modifiedPdfBytes = await pdfDoc.save();
  fs.writeFileSync(outputPath, modifiedPdfBytes);

  console.log(`✅ Highlighted PDF saved to ${outputPath}`);
}

// 👉 Chạy script
const input = path.resolve(__dirname, 'user-cv.pdf');
const output = path.resolve(__dirname, 'output_highlighted.pdf');

highlightPhonesInPdf(input, output).catch(console.error);
