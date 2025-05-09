const puppeteer = require("puppeteer");

export const getCvPdfBuffer = async (id) => {
  try {
    const browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();

    await page.goto(`http://localhost:3000/xem-cv/${id}`, {
      waitUntil: "networkidle0",
    });

    const height = await page.evaluate(() => {
      const el = document.querySelector(".cv-user");
      return el.scrollHeight;
    });

    const pdfBuffer = await page.pdf({
      // path: "user-cv.pdf",
      printBackground: true,
      width: "794px",
      height: `${height}px`,
    });

    await browser.close();

    return pdfBuffer;
  } catch (error) {
    console.log("🚀 ~ downloadCV ~ error:", error)
  }
}