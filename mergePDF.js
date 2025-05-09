const fs = require('fs');
const { PDFDocument } = require('pdf-lib');

async function mergePagesToOne(inputPath, outputPath) {
  const existingPdfBytes = fs.readFileSync(inputPath);
  const pdfDoc = await PDFDocument.load(existingPdfBytes);
  const mergedPdf = await PDFDocument.create();

  const page = mergedPdf.addPage([595, 842]); // Kích thước trang A4 (width, height)
  const { width, height } = page.getSize();

  const pages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());

  const rows = Math.ceil(Math.sqrt(pages.length)); // Số hàng
  const cols = Math.ceil(pages.length / rows); // Số cột
  const scaleFactor = 0.4; // Tỉ lệ thu nhỏ trang

  let yOffset = height;
  let xOffset = 0;
  let count = 0;

  for (let row = 0; row < rows; row++) {
    xOffset = 0;
    for (let col = 0; col < cols; col++) {
      if (count >= pages.length) break;
      const p = pages[count];
      page.drawPage(p, {
        x: xOffset,
        y: yOffset - p.getHeight() * scaleFactor,
        width: p.getWidth() * scaleFactor,
        height: p.getHeight() * scaleFactor,
      });
      xOffset += p.getWidth() * scaleFactor;
      count++;
    }
    yOffset -= pages[0].getHeight() * scaleFactor;
  }

  const pdfBytes = await mergedPdf.save();
  fs.writeFileSync(outputPath, pdfBytes);
  console.log(`Merged PDF saved to ${outputPath}`);
}

// Gọi hàm
mergePagesToOne('CV1.pdf', 'merged.pdf');
