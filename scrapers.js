const puppeteer = require("puppeteer");
const AWS = require("aws-sdk");
const nodemailer = require("nodemailer");

AWS.config.update({ region: "eu-north-1" }); // Update to your AWS region

async function run() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();
  await page.goto(
    "https://pubmed.ncbi.nlm.nih.gov/?term=undergraduate+medical+education&filter=years.2024-2024&sort=date"
  );

  // Wait for the relevant elements to appear
  await page.waitForSelector(".full-docsum");

  const papers = await page.$$eval(".full-docsum", (elements) =>
    elements.map((element) => {
      const titleElement = element.querySelector(".docsum-title");
      const linkElement = element.querySelector(
        "div.docsum-wrap > div.docsum-content > a"
      );
      const title = titleElement
        ? titleElement.textContent.trim().replace(/\s\s+/g, " ")
        : "";
      const link = linkElement ? linkElement.href : "";
      return { title, link };
    })
  );

  // Limit to the most recent 3 papers
  const recentPapers = papers.slice(0, 3);

  // Format the output
  const output =
    "Recent Research:\n\n" +
    recentPapers.map((paper) => `${paper.title}\n${paper.link}`).join("\n\n");

  // Upload output to S3
  const s3 = new AWS.S3();
  const params = {
    Bucket: "research-paper-bucket", // replace with your bucket name
    Key: "output.txt", // the name of the file to be saved in S3
    Body: output,
    ContentType: "text/plain",
  };

  try {
    await s3.upload(params).promise();
    console.log("Output uploaded to S3");
  } catch (error) {
    console.error("Error uploading to S3:", error);
  }

  // Send email with the output
  let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER, // replace with your email
      pass: process.env.EMAIL_PASS, // replace with your email password or app-specific password
    },
  });

  let mailOptions = {
    from: process.env.EMAIL_USER, // replace with your email
    to: process.env.EMAIL_USER, // replace with the recipient's email
    subject: "Recent Research Papers",
    text: output,
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log("Email sent: " + info.response);
    }
  });

  await browser.close();
}

run();
