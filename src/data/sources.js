// RSS feed sources grouped by tier
export const SOURCES = [
  // Tier 1: Technical, close to user's domain
  { id: 'spectrum', name: 'IEEE Spectrum', url: 'https://spectrum.ieee.org/feeds/feed.rss', tier: 1 },
  { id: 'semi', name: 'SemiEngineering', url: 'https://semiengineering.com/feed/', tier: 1 },
  { id: 'eetimes', name: 'EE Times', url: 'https://www.eetimes.com/feed/', tier: 1 },
  // Tier 2: General tech, well-written
  { id: 'ars', name: 'Ars Technica', url: 'https://feeds.arstechnica.com/arstechnica/index', tier: 2 },
  { id: 'mit', name: 'MIT Tech Review', url: 'https://www.technologyreview.com/feed/', tier: 2 },
  { id: 'wired', name: 'Wired', url: 'https://www.wired.com/feed/rss', tier: 2 },
  // Tier 3: Broader, great English
  { id: 'bbc', name: 'BBC Technology', url: 'https://feeds.bbci.co.uk/news/technology/rss.xml', tier: 2 },
];

// Seed words from initial assessment (these go into review queue on first launch)
export const SEED_WORDS = [
  { word: "reluctantly", ph: "/rɪˈlʌktəntli/", mean: "勉强地，不情愿地", context: "The engineer reluctantly agreed to the new schedule.", contextCn: "工程师勉强同意了新的时间表。", source: "词汇测试" },
  { word: "ambiguous", ph: "/æmˈbɪɡjuəs/", mean: "模糊的，有歧义的", context: "The bug was caused by an ambiguous specification.", contextCn: "这个bug是由模糊的规格说明引起的。", source: "词汇测试" },
  { word: "elusive", ph: "/ɪˈluːsɪv/", mean: "难以捉摸的", context: "The root cause remained elusive for weeks.", contextCn: "根本原因数周来一直难以捉摸。", source: "词汇测试" },
  { word: "supersede", ph: "/ˌsuːpərˈsiːd/", mean: "取代，替代", context: "The new spec supersedes all previous versions.", contextCn: "新规范取代了所有先前版本。", source: "词汇测试" },
  { word: "truncate", ph: "/ˈtrʌŋkeɪt/", mean: "截断，缩短", context: "The register value was truncated due to a width mismatch.", contextCn: "由于位宽不匹配，寄存器值被截断了。", source: "词汇测试" },
  { word: "intermittent", ph: "/ˌɪntərˈmɪtənt/", mean: "间歇性的", context: "The failure is intermittent and hard to reproduce.", contextCn: "该故障是间歇性的，难以复现。", source: "词汇测试" },
  { word: "pragmatic", ph: "/præɡˈmætɪk/", mean: "务实的", context: "The architect proposed a more pragmatic approach.", contextCn: "架构师提出了一个更务实的方案。", source: "词汇测试" },
  { word: "autonomously", ph: "/ɔːˈtɑːnəməsli/", mean: "自主地，独立地", context: "These modules operate autonomously without host intervention.", contextCn: "这些模块自主运行，无需主机干预。", source: "词汇测试" },
  { word: "deprecate", ph: "/ˈdeprəkeɪt/", mean: "弃用，不推荐使用", context: "The design was deprecated in favor of a new architecture.", contextCn: "该设计被弃用，转而采用新架构。", source: "词汇测试" },
  { word: "subtle", ph: "/ˈsʌtl/", mean: "微妙的，不易察觉的", context: "The root cause was a subtle arbitration bug.", contextCn: "根本原因是一个微妙的仲裁bug。", source: "词汇测试" },
  { word: "contention", ph: "/kənˈtenʃən/", mean: "竞争，争用", context: "Under heavy contention, the arbiter would starve the DMA channel.", contextCn: "在高竞争压力下，仲裁器会饿死DMA通道。", source: "词汇测试" },
  { word: "comprehensive", ph: "/ˌkɑːmprɪˈhensɪv/", mean: "全面的，综合的", context: "The report was comprehensive and covered every module.", contextCn: "报告非常全面，涵盖了每个模块。", source: "词汇测试" },
  { word: "defer", ph: "/dɪˈfɜːr/", mean: "推迟，延期", context: "The team decided to defer the fix to the next release.", contextCn: "团队决定将修复推迟到下个版本。", source: "词汇测试" },
  { word: "erratic", ph: "/ɪˈrætɪk/", mean: "不规律的，不稳定的", context: "The peripheral's behavior was erratic after the firmware update.", contextCn: "固件更新后，外设的行为变得不规律。", source: "词汇测试" },
  { word: "mitigate", ph: "/ˈmɪtɪɡeɪt/", mean: "缓解，减轻", context: "This workaround mitigates the issue but doesn't fully resolve it.", contextCn: "这个临时方案缓解了问题但没有完全解决。", source: "词汇测试" },
];
