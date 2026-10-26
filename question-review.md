# Draft questions to review

All 26 are in the database as drafts and are not published. Approve with:

`npx wrangler d1 execute vinci --remote --command "UPDATE questions SET status='live' WHERE id IN ('semis','visatx')"`

Answers are smaller numbers: rates per second, per-unit averages and percentages. Each note shows the arithmetic behind the answer. Sources were found by web search and not each opened and read in full, so check the number at the link before approving.

| id | question | answer | as of | source |
|---|---|---|---|---|
| semis | On average, how many dollars of semiconductors were sold worldwide every second in 2025? | 25,228 US dollars per second | 2025 full year, final WSTS data (March 2026) | [WSTS, Global Semiconductor Market grows 26% in 2025](https://www.wsts.org/76/103/Global-Semiconductor-Market-grows-26-in-2025-to-796B) |
| visatx | On average, how many transactions did Visa process every second in its 2025 fiscal year? | 8,165 transactions per second | Fiscal 2025 (to September 2025) | [Visa fiscal 2025 annual report](https://s29.q4cdn.com/385744025/files/doc_downloads/2025/Visa-Fiscal-2025-Annual-Report.pdf) |
| visaavg | On average, how many dollars was each transaction on Visa's network worth in fiscal 2025? | 64.85 US dollars per transaction | Fiscal 2025 (to September 2025) | [Visa fiscal 2025 annual report](https://s29.q4cdn.com/385744025/files/doc_downloads/2025/Visa-Fiscal-2025-Annual-Report.pdf) |
| tesla | How many vehicles did Tesla deliver in 2025? | 1,636,129 vehicles | 2025 full year | [Not a Tesla App, Tesla Q4 2025 report](https://www.notateslaapp.com/news/3468/tesla-reports-q4-delivery-numbers-narrowly-misses-on-deliveries-energy-hits-record) |
| phones | On average, how many smartphones were shipped worldwide every minute in 2025? | 2,397 smartphones per minute | 2025 full year, preliminary | [IDC smartphone tracker, January 2026](https://www.idc.com/?p=107472) |
| domains | What percentage of all registered domain names end in .com or .net? | 44.6 percent | June 30, 2026 | [Verisign Q2 2026 Domain Name Industry Brief](https://blog.verisign.com/domain-names/q2-2026-domain-name-industry-brief-quarterly-report/) |
| starlink | How many Starlink satellites are active in orbit? | 10,838 satellites | October 2026, KeepTrack | [KeepTrack, Starlink satellite count](https://keeptrack.space/starlink-satellite-count) |
| hashrate | What was the Bitcoin network's average hashrate over the 30 days to the end of August 2026? | 912 exahashes per second | 30 days to August 31, 2026 | [Hashrate Index roundup, August 31, 2026](https://hashrateindex.com/blog/hashrate-index-roundup-august-17-2026-2/) |
| btcnew | How many new bitcoin are created every day? | 450 bitcoin per day | 2026, until the next halving | [Mudrex Learn, citing August 2026 data](https://mudrex.com/learn/?p=88362) |
| nvrev | On average, how many dollars of revenue did Nvidia earn every second in its 2026 fiscal year? | 6,846 US dollars per second | Fiscal 2026 | [Nvidia Q4 and fiscal 2026 results (SEC 8-K)](https://www.sec.gov/Archives/edgar/data/1045810/000104581026000019/q4fy26pr.htm) |
| nvdc | What percentage of Nvidia's fiscal 2026 revenue came from its Data Center segment? | 89.7 percent | Fiscal 2026 | [Nvidia Q4 and fiscal 2026 results (SEC 8-K)](https://www.sec.gov/Archives/edgar/data/1045810/000104581026000019/q4fy26pr.htm) |
| tsmcrev | On average, how many dollars of revenue did TSMC earn every second in 2025? | 3,882 US dollars per second | 2025 full year | [TelecomLead, TSMC 2025 results](https://telecomlead.com/semiconductor/tsmc-delivers-record-2025-revenue-and-profit-as-ai-chip-demand-fuels-growth-us-expansion-accelerates-124150) |
| hynix | What percentage of the world's DRAM sales did SK hynix make in the third quarter of 2025? | 33.2 percent | Q3 2025 | [Evertiq, citing TrendForce](https://evertiq.com/design/2025-11-26-global-dram-revenue-jumps-309-in-3q25) |
| asml | How many new lithography machines did ASML sell in 2025? | 300 machines | 2025 full year | [Heise, ASML record orders](https://heise.de/-11157655) |
| chatgpt | What percentage of ChatGPT's weekly users pay for a subscription? | 5.6 percent | February 2026 | [TechCrunch, ChatGPT reaches 900M weekly active users](https://techcrunch.com/2026/02/27/chatgpt-reaches-900m-weekly-active-users) |
| spotify | What percentage of Spotify's monthly active users pay for Premium? | 38.6 percent | Q2 2026 | [Spotify Q2 2026 results (SEC 6-K)](https://www.sec.gov/Archives/edgar/data/0001639920/000114036126031044/ef20078867_ex99-1.htm) |
| wikien | How many articles does the English Wikipedia have? | 7,250,000 articles | October 2026 | [English Wikipedia](https://en.wikipedia.org/wiki/English_Wikipedia) |
| hfmodels | How many public models are hosted on the Hugging Face Hub? | 3,012,377 models | August 2026 | [Voxbooster Hugging Face statistics 2026 (third-party tally)](https://voxbooster.com/blog/hugging-face-model-downloads-statistics-2026/) |
| ipos | How many companies went public on US stock exchanges in 2025? | 202 IPOs | 2025 full year | [Renaissance Capital, 2025 US IPO Review](https://www.renaissancecapital.com/review/2025USReview_Public.pdf) |
| etfs | How many exchange-traded funds were there in the United States at the end of 2025? | 4,813 ETFs | End of 2025 | [ICI 2026 Fact Book, chapter 2](https://icifactbook.org/pdf/2026-factbook-ch2.pdf) |
| vc | On average, how many dollars of venture and growth funding did startups raise worldwide every second in 2025? | 13,477 US dollars per second | 2025 full year, Crunchbase | [Crunchbase News, 2025 year-end funding](https://news.crunchbase.com/fintech/funding-jumped-big-checks-ai-ye-2025/) |
| applerev | On average, how many dollars of sales did Apple make every second in its 2025 fiscal year? | 13,196 US dollars per second | Fiscal 2025 | [Apple Form 10-K, fiscal 2025](https://www.sec.gov/Archives/edgar/data/320193/000032019325000079/aapl-20250927.htm) |
| aws | On average, how many dollars of revenue did Amazon Web Services earn every second in 2025? | 4,081 US dollars per second | 2025 full year | [Amazon Q4 2025 results](https://www.businesswire.com/news/home/20260204777163/en/Amazon.com-Announces-Fourth-Quarter-Results) |
| amazon | On average, how many dollars of sales did Amazon make every second in 2025? | 22,733 US dollars per second | 2025 full year | [Amazon Q4 2025 results](https://www.businesswire.com/news/home/20260204777163/en/Amazon.com-Announces-Fourth-Quarter-Results) |
| dcpower | How much electricity did data centers around the world use in 2025? | 485 terawatt-hours | 2025 estimate | [Our World in Data, citing the IEA](https://ourworldindata.org/how-much-energy-do-data-centers-and-artificial-intelligence-use) |
| internet | What percentage of the world's people used the internet in 2025? | 74 percent | 2025 estimate | [ITU, Facts and Figures 2025](https://www.itu.int/en/mediacentre/Pages/PR-2025-11-17-Facts-and-Figures.aspx) |
