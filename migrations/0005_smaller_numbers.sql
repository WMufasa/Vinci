-- Rewrites the original live questions so answers are smaller numbers: per-second rates, per-unit averages and units of millions.
-- Same ids, so the existing puzzles keep working. Guesses and scores made against the old units are cleared separately before launch.

UPDATE questions SET
  text = 'On average, how many searches does Google handle every second worldwide?',
  unit = 'searches per second', answer = 158549,
  napkin = 'About 5 billion people use Google and each runs around 3 searches a day. That is about 15 billion a day, and a day has 86,400 seconds, so roughly 170,000 a second.',
  note = 'Google does not publish an exact figure. Search Engine Land reports 5 trillion searches a year, which is about 158,500 a second. Published estimates run from about 100,000 to 185,000 a second.'
WHERE id = 'google';

UPDATE questions SET
  text = 'On average, how many emails are sent every second worldwide in 2026?',
  unit = 'emails per second', answer = 4542824,
  napkin = 'About 4.5 billion people use email and each handles around 85 messages a day, spam included. That is about 380 billion a day, or about 4.4 million a second.',
  note = 'This is a projection by Statista, reported by EmailToolTester, not a count. 392.5 billion a day is about 4.54 million a second.'
WHERE id = 'email';

UPDATE questions SET
  text = 'On average, how many iPhones were sold worldwide every minute in 2025?',
  unit = 'iPhones per minute', answer = 470,
  napkin = 'If about 1.5 billion iPhones are in use and each is replaced every six years or so, that is roughly 250 million a year. A year has about 525,600 minutes, so roughly 475 a minute.',
  note = 'Apple stopped reporting iPhone unit sales in 2019, so this is an IDC estimate of about 247 million for the year, which is about 470 a minute.'
WHERE id = 'iphone';

UPDATE questions SET
  text = 'How many millions of lines are in the Linux kernel source tree, counting code, comments and blank lines?',
  unit = 'millions of lines', answer = 40.98,
  napkin = 'Linux 4.12 had about 24 million lines in 2017. The tree grows roughly 2 million lines a year, so nine years later you land near 42 million.'
WHERE id = 'linux';

UPDATE questions SET
  text = 'On average, what did one share cost at the price it traded in US stock markets in 2025?',
  unit = 'US dollars per share', answer = 62.5,
  napkin = 'Stocks range from pennies to thousands of dollars a share, but most of the trading is in well-known companies at tens to hundreds of dollars.',
  note = 'Cboe reports about $1.1 trillion of stock traded a day and 17.6 billion shares a day. Dividing one by the other gives about $62.50 a share. The record single day was April 9, 2025, at $1.86 trillion.'
WHERE id = 'eqvol';

-- Retired: it asked for the trillion-dollar daily figure that the question above now covers.
UPDATE questions SET status = 'draft' WHERE id = 'eqnot';

UPDATE questions SET
  text = 'On average, how many transactions did the Bitcoin network confirm every second in June 2026?',
  unit = 'transactions per second', answer = 7.54,
  napkin = 'A block arrives about every 10 minutes, so there are 144 a day. A busy month puts a few thousand transactions in each block, so 400,000 to 700,000 a day. Divided by 86,400 seconds, that is 5 to 8 a second.',
  note = 'This counts confirmed on-chain transactions only. June 2026 averaged 651,655 a day, which is about 7.5 a second, and was up 90% on June 2025.'
WHERE id = 'btc';

UPDATE questions SET
  text = 'On average, how many repositories exist on GitHub for every developer on the platform, public and private combined?',
  unit = 'repositories per developer', answer = 3.5,
  napkin = 'Many developers have a few forks, experiments and private projects, so a handful each.',
  note = 'Octoverse 2025 reports 630 million repositories and over 180 million developers, which is about 3.5 each. Public repositories are about 63% of the total. Many belong to organizations or sit unused, so this is a ratio, not what a typical person owns.'
WHERE id = 'ghrepos';

UPDATE questions SET
  text = 'How many 12-inch wafers can TSMC make every day at full capacity?',
  unit = '12-inch equivalent wafers per day', answer = 46575,
  napkin = 'TSMC runs about nine 12-inch fabs. At roughly 150,000 wafers a month each, that is about 1.35 million a month, or roughly 45,000 a day.',
  note = 'TSMC says capacity was above 17 million a year, which is about 46,600 a day, so the true figure is a little higher.'
WHERE id = 'tsmc';
