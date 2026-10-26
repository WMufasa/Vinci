-- Wording only: varies the openers so the bank is not full of "On average, how many ...". Answers, units and sources are unchanged.
-- (scripts/drafts.json still holds the earlier wording of the questions that began as drafts; this migration is the current wording.)

UPDATE questions SET text = 'Roughly how many searches does Google handle each second, worldwide?' WHERE id = 'google';
UPDATE questions SET text = 'Guess how many emails are sent worldwide each second in 2026.' WHERE id = 'email';
UPDATE questions SET text = 'At what pace did iPhones sell in 2025, in phones per minute?' WHERE id = 'iphone';
UPDATE questions SET text = 'How big is the Linux kernel source tree, in millions of lines (code, comments and blank lines)?' WHERE id = 'linux';
UPDATE questions SET text = 'What was the typical price of one share traded in US markets in 2025?' WHERE id = 'eqvol';
UPDATE questions SET text = 'What was Bitcoin''s average transaction rate in June 2026, in confirmed transactions per second?' WHERE id = 'btc';
UPDATE questions SET text = 'Divide all of GitHub''s repositories, public and private, by its developers. What do you get?' WHERE id = 'ghrepos';
UPDATE questions SET text = 'Guess the number of new repositories GitHub gained each minute in 2025.' WHERE id = 'ghnew';
UPDATE questions SET text = 'Put a number on the world''s publicly listed companies.' WHERE id = 'listed';
UPDATE questions SET text = 'Count the data centers operating in the United States.' WHERE id = 'dc';
UPDATE questions SET text = 'What is TSMC''s daily output ceiling, in 12-inch wafers?' WHERE id = 'tsmc';

UPDATE questions SET text = 'Fill in the blank: in 2025 the world bought about $____ worth of chips every second.' WHERE id = 'semis';
UPDATE questions SET text = 'What was Visa''s average speed in fiscal 2025, in transactions processed per second?' WHERE id = 'visatx';
UPDATE questions SET text = 'Roughly how much money moved in a typical Visa transaction in fiscal 2025?' WHERE id = 'visaavg';
UPDATE questions SET text = 'Estimate worldwide smartphone shipments in 2025, per minute.' WHERE id = 'phones';
UPDATE questions SET text = 'Starlink is the biggest satellite constellation ever built. What is the size of its active fleet?' WHERE id = 'starlink';
UPDATE questions SET text = 'How much brand-new bitcoin does the network create each day?' WHERE id = 'btcnew';
UPDATE questions SET text = 'What was Nvidia''s revenue per second in its 2026 fiscal year?' WHERE id = 'nvrev';
UPDATE questions SET text = 'Nvidia''s Data Center business made up what share of its fiscal 2026 revenue?' WHERE id = 'nvdc';
UPDATE questions SET text = 'If you watched TSMC''s cash register in 2025, how many dollars would ring up every second?' WHERE id = 'tsmcrev';
UPDATE questions SET text = 'SK hynix and Samsung are neck and neck in memory chips. What share of Q3 2025 DRAM sales did SK hynix take?' WHERE id = 'hynix';
UPDATE questions SET text = 'Tally up ASML''s new lithography machine sales in 2025.' WHERE id = 'asml';
UPDATE questions SET text = 'What share of ChatGPT''s weekly users pay for a subscription?' WHERE id = 'chatgpt';
UPDATE questions SET text = 'Of Spotify''s monthly listeners, what percentage pay for Premium?' WHERE id = 'spotify';
UPDATE questions SET text = 'How big is the English Wikipedia? Count its articles.' WHERE id = 'wikien';
UPDATE questions SET text = 'Hugging Face is the app store for AI models. How many public models does its Hub hold?' WHERE id = 'hfmodels';
UPDATE questions SET text = 'What was the count of US IPOs in 2025?' WHERE id = 'ipos';
UPDATE questions SET text = 'By the end of 2025, what was the total number of US-listed ETFs?' WHERE id = 'etfs';
UPDATE questions SET text = 'At what rate, in dollars per second, did startups raise venture and growth funding worldwide in 2025?' WHERE id = 'vc';
UPDATE questions SET text = 'How much did Apple sell every second in its 2025 fiscal year?' WHERE id = 'applerev';
UPDATE questions SET text = 'What did Amazon Web Services earn every second in 2025?' WHERE id = 'aws';
UPDATE questions SET text = 'Every second of 2025, Amazon rang up how many dollars in sales?' WHERE id = 'amazon';
UPDATE questions SET text = 'What percentage of humanity was online in 2025?' WHERE id = 'internet';
-- Unchanged: tesla, domains, hashrate, dcpower (already varied, and the first and third are ones you liked).
