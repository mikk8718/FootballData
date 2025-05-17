import puppeteer from "puppeteer";
import fetchMatchLinks from "./fetchMatchLinks.js";
import scrapeMatchStats from "./scrapeMatchStats.js";
import fs from "fs";
import { Parser } from "json2csv";


const url = 'https://www.flashscore.com/football/germany/bundesliga-2023-2024/results/';
const browser = await puppeteer.launch({ headless: true });
const page = await browser.newPage();
await page.goto(url, { waitUntil: 'domcontentloaded' });
await page.setViewport({ width: 1000, height: 1000 });

const matchLinks = await fetchMatchLinks(page);
console.log(`Found ${matchLinks.length} matches`);

const allStats = [];
const len = matchLinks.length;

let i = 0;
for (const link of matchLinks) {
  try {
    console.log(i);
    const [home, away] = await scrapeMatchStats(browser, link);
    allStats.push(flattenRow(home));
    allStats.push(flattenRow(away));
    i += 1;
  } catch (e) {
    console.warn(`Failed to scrape match: ${link}\n`, e.message);
  }
}

await browser.close();

const parser = new Parser();
const csv = parser.parse(allStats);
fs.writeFileSync("data.csv", csv);
console.log("Saved CSV as match_stats.csv");

function flattenRow(row) {
  const { team, location, result, events, ...stats } = row;
  return {
    team,
    location,
    result,
    events: JSON.stringify(events ?? []),
    ...stats
  };
}
