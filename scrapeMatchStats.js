export default async function scrapeMatchStats(browser, matchUrl) {
  const page = await browser.newPage();
  await page.goto(matchUrl, { waitUntil: 'domcontentloaded' });

  await page.waitForSelector('div.smv__participantRow');

  const [homeTeam, awayTeam] = await page.$$eval(
    'a.participant__participantName',
    nodes => nodes.map(n => n.textContent.trim())
  );

  const allEvents = await page.$$eval(
    'div.smv__participantRow',
    elements => elements.map(e => {
      const raw = e.textContent.trim();
      const match = raw.match(/^(\d+\+?\d*)'(.*)$/); // Remove ' here
      return {
        time: match ? match[1] : null,
        text: match ? match[2].trim() : raw,
        team: e.classList.contains('smv__homeParticipant') ? 'home' : 'away'
      };
    })
  );

  await page.waitForSelector('button[data-testid="wcl-tab"]');

  const tabClicked = await page.$$eval('button[data-testid="wcl-tab"]', buttons => {
    const tab = buttons.find(b => b.textContent.includes('Stat') || b.textContent.includes('Statistik'));
    if (tab) {
      tab.click();
      return true;
    }
    return false;
  });

  if (!tabClicked) {
    console.warn('Could not click Stats tab');
    await page.close();
    return [];
  }

  // Wait for stats to load
  await page.waitForSelector('div.wcl-row_OFViZ', { timeout: 10000 });

  const rawStats = await page.$$eval(
    'div.wcl-row_OFViZ',
    elements => elements.map(e => e.textContent.trim())
  );

  await page.close();

  const parsedStats = parseStats(rawStats);

  const homeParsedEvents = parseEventsMinimal(allEvents.filter(e => e.team === 'home'));
  const awayParsedEvents = parseEventsMinimal(allEvents.filter(e => e.team === 'away'));

  const homeGoals = homeParsedEvents.filter(e => e.event === 'goal').length;
  const awayGoals = awayParsedEvents.filter(e => e.event === 'goal').length;

  const homeResult = homeGoals > awayGoals ? 'win' : homeGoals < awayGoals ? 'loss' : 'draw';
  const awayResult = awayGoals > homeGoals ? 'win' : awayGoals < homeGoals ? 'loss' : 'draw';

  const homeRow = {
    team: homeTeam,
    location: 'home',
    result: homeResult,
    events: homeParsedEvents
  };

  const awayRow = {
    team: awayTeam,
    location: 'away',
    result: awayResult,
    events: awayParsedEvents
  };

  for (const stat of parsedStats) {
    homeRow[stat.stat] = stat.home;
    awayRow[stat.stat] = stat.away;
  }

  return [homeRow, awayRow];
}

function parseStats(rawStats) {
  return rawStats.map(entry => {
    const match = entry.match(/^([0-9.%()\-]+)([A-Za-z\s%().\-]+)([0-9.%()\-]+)$/);
    if (!match) return null;
    const [, home, stat, away] = match;
    return {
      stat: stat.trim(),
      home: home.trim(),
      away: away.trim()
    };
  }).filter(Boolean);
}

function parseEventsMinimal(rawEvents) {
  return rawEvents.map(e => {
    const time = parseTime(e.time);
    const text = e.text;

    if (!time || !text) return null;

    if (/^\d+\s*-\s*\d+/.test(text)) {
      return { time, event: 'goal' };
    }

    if (/\(.+\)/.test(text)) {
      return { time, event: 'foul' };
    }

    return null;
  }).filter(Boolean);
}

function parseTime(str) {
  if (!str) return null;
  const match = str.match(/^(\d+)(?:\+(\d+))?$/);
  if (!match) return null;
  const base = parseInt(match[1]);
  const extra = match[2] ? parseInt(match[2]) : 0;
  return base + extra;
}
