const fs = require('fs');
const path = require('path');
const { getDocument } = require('pdfjs-dist');
const { PDFDocument, rgb } = require('pdf-lib');

// 📌 Regex số điện thoại Việt Nam cơ bản
// const phoneRegex = /\b((\+?\d{1,3}[\s\-]?)?)(\d{8,10})\b/g; //num 1
// const phoneRegex = /\b(0|84)(\d{2})(\s?\d{3})(\s?\d{3})\b/g;
const phoneRegex = /\b0?(?:[\s\-.]*\d){9}\b/g;

// 📌 Regex cho email cơ bản
const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;

const smallEmailRegex = /\^[a-zA-Z0-9._%+-]+@\b/g

async function extractPhonePositions(pdfBuffer) {
  const loadingTask = getDocument({ data: pdfBuffer });
  const pdf = await loadingTask.promise;
  const phonePositions = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();

    content.items.forEach(item => {
      const matches = [...item.str.matchAll(phoneRegex)];
      if (matches.length) {
        console.log("🚀 ~ extractPhonePositions ~ matches:", matches)
        matches.forEach(match => {
          const fullMatch = match[0]; // toàn bộ chuỗi khớp, ví dụ: "0933 758 487"

          const [a, b, c, d, x, y] = item.transform;

          const index = item.str.indexOf(fullMatch);
          if (index === -1) return;

          const avgCharWidth = item.width / item.str.length;
          const matchStartX = x + index * avgCharWidth;
          const matchWidth = fullMatch.length * avgCharWidth;

          phonePositions.push({
            page: i,
            text: fullMatch,
            x: matchStartX,
            y,
            width: matchWidth,
            height: item.height,
          });
        });
      }
    });
  }

  return phonePositions;
}

async function extractEmailPositions(pdfBuffer) {
  const loadingTask = getDocument({ data: pdfBuffer });
  const pdf = await loadingTask.promise;
  const emailPositions = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();

    content.items.forEach((item, index, items) => {
      const matches = item.str.match(emailRegex); // Sử dụng match thay vì matchAll
      if (matches) {
        console.log("🚀 ~ extractEmailPositions ~ matches:", matches);
        matches.forEach(fullMatch => {
          const [a, b, c, d, x, y] = item.transform;

          const index = item.str.indexOf(fullMatch);
          if (index === -1) return;

          const avgCharWidth = item.width / item.str.length;
          const matchStartX = x + index * avgCharWidth;
          const matchWidth = fullMatch.length * avgCharWidth;

          emailPositions.push({
            page: i,
            text: fullMatch,
            x: matchStartX,
            y,
            width: matchWidth,
            height: item.height,
          });
        });
      } else {
        if (index + 1 < items.length) {
          if (items[index + 1].str === "@") {
            const emailCandidate = items[index].str
            console.log("🚀 ~ content.items.forEach ~ emailCandidate:", emailCandidate)
            const startItem = items[index];
            const [a, b, c, d, startX, startY] = startItem.transform;
            const emailWidth = startItem.width;
            const emailHeight = startItem.height;

            emailPositions.push({
              page: i,
              text: emailCandidate,
              x: startX,
              y: startY,
              width: emailWidth,
              height: emailHeight,
            });
          }
        }
      }
    });
  }

  return emailPositions;
}



async function highlightPhonesInPdf(inputPath, outputPath) {
  const pdfBuffer = fs.readFileSync(inputPath);
  const phonePositions = await extractPhonePositions(pdfBuffer);

  const pdfDoc = await PDFDocument.load(pdfBuffer);
  const pages = pdfDoc.getPages();

  phonePositions.forEach(pos => {
    const page = pages[pos.page - 1];
    // Vẽ hình chữ nhật để che khu vực có số điện thoại
    page.drawRectangle({
      x: pos.x,
      y: pos.y,
      width: pos.width,
      height: pos.height,
      color: rgb(0, 0, 0), // Màu trắng (hoặc màu khác để che chữ)
      opacity: 1, // Không trong suốt
    });
  });

  const modifiedPdfBytes = await pdfDoc.save();
  fs.writeFileSync(outputPath, modifiedPdfBytes);

  console.log(`✅ Highlighted PDF saved to ${outputPath}`);
}

async function highlightEmailsInPdf(inputPath, outputPath) {
  const pdfBuffer = fs.readFileSync(inputPath);
  const emailPositions = await extractEmailPositions(pdfBuffer);

  const pdfDoc = await PDFDocument.load(pdfBuffer);
  const pages = pdfDoc.getPages();

  emailPositions.forEach(pos => {
    const page = pages[pos.page - 1];
    // Vẽ hình chữ nhật để che khu vực có email
    page.drawRectangle({
      x: pos.x,
      y: pos.y,
      width: pos.width,
      height: pos.height,
      color: rgb(1, 1, 1), // Màu trắng (hoặc màu khác để che chữ)
      opacity: 1, // Không trong suốt
    });
  });

  const modifiedPdfBytes = await pdfDoc.save();
  fs.writeFileSync(outputPath, modifiedPdfBytes);

  console.log(`✅ Highlighted PDF saved to ${outputPath}`);
}

async function writePdfTextContent(pdfBuffer, outputTextPath) {
  const loadingTask = getDocument({ data: pdfBuffer });
  const pdf = await loadingTask.promise;

  let fullText = '';

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items.map(item => item.str).join('~~~~');
    fullText += `--- Page ${i} ---\n${pageText}\n\n`;
  }

  fs.writeFileSync(outputTextPath, fullText, 'utf8');
  console.log(`📄 PDF content written to ${outputTextPath}`);
}

async function highlightPhonesAndEmailsInPdf(inputPath, outputPath) {
  const pdfBuffer = fs.readFileSync(inputPath);

  // Tìm vị trí các số điện thoại và email
  const phonePositions = await extractPhonePositions(pdfBuffer);
  const emailPositions = await extractEmailPositions(pdfBuffer);

  const pdfDoc = await PDFDocument.load(pdfBuffer);
  const pages = pdfDoc.getPages();

  // Tô các số điện thoại
  phonePositions.forEach(pos => {
    const page = pages[pos.page - 1];
    page.drawRectangle({
      x: pos.x,
      y: pos.y,
      width: pos.width,
      height: pos.height,
      color: rgb(0, 0, 0), // Màu trắng (hoặc màu khác để che chữ)
      opacity: 1, // Không trong suốt
    });
  });

  // Tô các email
  emailPositions.forEach(pos => {
    const page = pages[pos.page - 1];
    page.drawRectangle({
      x: pos.x,
      y: pos.y,
      width: pos.width,
      height: pos.height,
      color: rgb(0, 0, 0), // Màu trắng (hoặc màu khác để che chữ)
      opacity: 1, // Không trong suốt
    });
  });

  // Lưu file PDF đã chỉnh sửa
  const modifiedPdfBytes = await pdfDoc.save();
  fs.writeFileSync(outputPath, modifiedPdfBytes);

  console.log(`✅ Highlighted PDF saved to ${outputPath}`);
}


// 👉 Chạy script
const input = path.resolve(__dirname, 'input7.pdf');
const output = path.resolve(__dirname, 'output_highlighted.pdf');
const textOutput = path.resolve(__dirname, 'content.txt');

(async () => {
  const pdfBuffer = fs.readFileSync(input);
  await writePdfTextContent(pdfBuffer, textOutput);
  await highlightPhonesAndEmailsInPdf(input, output);
})();
