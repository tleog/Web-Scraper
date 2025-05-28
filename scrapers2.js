const puppeteer = require("puppeteer");
const fs = require("fs");

async function run() {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: false,
  });
  const page = await browser.newPage();

  // Go to the target URL
  await page.goto(
    "https://pubmed.ncbi.nlm.nih.gov/?term=artificial+intelligence+in+medical+education&filter=years.2022-2026&sort=date"
  );

  // Wait for the relevant elements to appear on the page
  // Replace ".full-docsum" with the correct selector for the elements you want to scrape
  await page.waitForSelector(".full-docsum");

  // Select and extract data from the elements on the page
  // This code extracts title and link from each element with the class ".full-docsum"
  // Update the selector and extraction logic as needed for your specific case
  const papers = await page.$$eval(".full-docsum", (elements) =>
    elements.map((element) => {
      const titleElement = element.querySelector(".docsum-title"); // Select the title element
      const linkElement = element.querySelector(
        "div.docsum-wrap > div.docsum-content > a"
      ); // Select the link element
      const title = titleElement
        ? titleElement.textContent.trim().replace(/\s\s+/g, " ") // Extract and clean up the title text
        : "";
      const link = linkElement ? linkElement.href : ""; // Extract the link URL
      return { title, link }; // Return an object with the title and link
    })
  );

  // Format the output
  const output =
    "Recent Research:\n\n" +
    papers.map((paper) => `${paper.title}\n${paper.link}`).join("\n\n");

  // Write output to a file
  fs.writeFileSync("output.txt", output, "utf-8");

  console.log("Output written to output.txt");

  await browser.close();
}

run();
