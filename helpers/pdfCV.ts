const fs = require('fs');
const path = require('path');
const { getDocument } = require('pdfjs-dist');
const { PDFDocument, rgb } = require('pdf-lib');

// 📌 Regex số điện thoại Việt Nam cơ bản
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

async function highlightPhonesAndEmailsInPdf(pdfBuffer) {
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
      color: rgb(0.6, 0.6, 0.6), // Màu trắng (hoặc màu khác để che chữ)
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
      color: rgb(0.6, 0.6, 0.6), // Màu trắng (hoặc màu khác để che chữ)
      opacity: 1, // Không trong suốt
    });
  });

  const outputPath = path.resolve(__dirname, 'output_highlighted.pdf');

  // Lưu file PDF đã chỉnh sửa
  const modifiedPdfBytes = await pdfDoc.save();
  const buffer = Buffer.from(modifiedPdfBytes);
  return buffer;
}

export async function hideDataProfileInCvPdf(pdfBuffer: Buffer): Promise<Buffer> {
  try {
    const newBuffer = await highlightPhonesAndEmailsInPdf(pdfBuffer)
    return newBuffer
  } catch (error) {
    console.log("🚀 ~ hideDataProfileInCvPdf ~ error:", error)
  }
  return pdfBuffer
}