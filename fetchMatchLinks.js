export default async function fetchMatchLinks(page) {
  const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

  // Keep clicking "Show more matches" until it's gone
  while (true) {
    try {
      console.log("trying");
      const button = await page.$('a.event__more.event__more--static');
      if (!button) break;

      await button.click();
      await delay(1000); // Must await this to let matches load
    } catch (e) {
      console.error("Error clicking 'Show more matches':", e);
      break;
    }
  }

  // Extract all match links
 const links = await page.$$eval(
    'div.event__match',
    elements => elements.map(el => {
      const anchor = el.querySelector('a.eventRowLink');
      return anchor ? anchor.href : null;
    }).filter(Boolean)
  );
  return links;
}
