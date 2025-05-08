const puppeteer = require("puppeteer");

(async () => {
  const browser = await puppeteer.launch({
    headless: "new", // hoặc false để debug
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();

  // Đảm bảo app React đang chạy ở đây
  await page.goto("http://localhost:3000/xem-cv/67e2790696fe829b81af2704", {
    waitUntil: "networkidle0",
  });
  
   // Đo chiều cao của nội dung
  const height = await page.evaluate(() => {
    const el = document.querySelector(".cv-user");
    return el.scrollHeight;
  });

  // Tạo PDF
  await page.pdf({
    path: "user-cv.pdf",
    printBackground: true,
    width: "794px",
    height: `${height}px`,
  });

  // // Tạo PDF
  // await page.pdf({
  //   path: "user-cv.pdf",
  //   format: "A4",
  //   printBackground: true,
  //   margin: {
  //     top: "20mm",
  //     bottom: "20mm",
  //     left: "15mm",
  //     right: "15mm",
  //   },
  // });

  await browser.close();
  console.log("✅ Đã tạo xong file PDF: user-cv.pdf");
})();
