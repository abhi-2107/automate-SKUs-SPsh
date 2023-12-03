const puppeteer = require("puppeteer");
const { program } = require("commander");

program.option("-s, --search <type>", "Keywords to search");

program.parse();

const options = program.opts();

async function getSkusForSearchItem(browser, searchTerms) {
  const page = await browser.newPage();

  const url = `https://solar-hook-etm.de/?s=${searchTerms.join(
    "+"
  )}&post_type=product&type_aws=true&aws_id=1&aws_filter=1`;

  console.log(url);
  await page.goto(url, { waitUntil: "networkidle2" });

  const productSkus = await page.evaluate(() => {
    const skus = [];
    const elements = document.querySelectorAll(
      ".add_to_cart_button[data-product_sku]"
    );

    elements.forEach((element) => {
      skus.push(element.getAttribute("data-product_sku"));
    });

    return skus;
  });

  return productSkus;
}

(async () => {
  const browser = await puppeteer.launch();

  const keywords = options.search.split(" ");

  const skus = await Promise.all(
    keywords.map((keyword) =>
      getSkusForSearchItem(browser, [keyword, "Wechselrichter"])
    )
  ).then((res) => res.flat());

  const ans = skus.map((sku) => ({
    sku: sku.padEnd(30),
    url: `https://stegback.net/admin/products?sku=${sku}`,
  }));
  ans.sort((a, b) => a.sku.localeCompare(b.sku));
  console.table(ans);
  await browser.close();
})();
