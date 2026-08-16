export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    // Step 1: Fetch the article HTML
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const resp = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; EnglishBoost/1.0)',
        'Accept': 'text/html',
      },
    });
    clearTimeout(timeout);

    if (!resp.ok) {
      return res.status(502).json({ error: 'Failed to fetch article' });
    }

    const html = await resp.text();

    // Step 2: Basic text extraction
    let text = html;
    // Remove script, style, nav, header, footer, aside
    text = text.replace(/<(script|style|nav|header|footer|aside|iframe|noscript)[^>]*>[\s\S]*?<\/\1>/gi, ' ');
    // Remove HTML comments
    text = text.replace(/<!--[\s\S]*?-->/g, ' ');
    // Try to find article body
    const articleMatch = text.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
    if (articleMatch) {
      text = articleMatch[1];
    } else {
      // Try main content
      const mainMatch = text.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
      if (mainMatch) text = mainMatch[1];
    }
    // Strip remaining tags, keep text
    text = text.replace(/<[^>]+>/g, ' ');
    // Decode entities
    text = text.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ');
    // Normalize whitespace
    text = text.replace(/\s+/g, ' ').trim();
    // Take reasonable length
    text = text.slice(0, 5000);

    if (text.length < 100) {
      return res.status(422).json({ error: 'Could not extract article text' });
    }

    // Step 3: Send to Claude for analysis
    const claudeResp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 2500,
        messages: [{
          role: 'user',
          content: `Here is raw text extracted from a web article. Process it for an English learner (Chinese hardware engineer, vocabulary ~3000-4000 words, CEFR B1-B2).

RAW TEXT:
${text}

Do these tasks:
1. Extract and clean the main article content (remove any navigation text, ads, cookie notices, etc). Keep the real article paragraphs only. If the text is too fragmented to form a coherent article, reconstruct the key content.
2. Identify 8-12 vocabulary words that a Chinese engineer at B1-B2 level likely doesn't know. Pick words that are genuinely useful to learn — not ultra-rare or domain-specific jargon they'd never see again.
3. Generate 3 comprehension questions that test understanding of the article's main ideas.

Reply ONLY with valid JSON, no markdown, no backticks:
{
  "title": "article title",
  "content": "The cleaned article text, 200-600 words. Keep the original wording as much as possible, just remove non-article text.",
  "vocab": [
    {"word": "example", "ph": "/ɪɡˈzæmpəl/", "mean": "简明中文释义", "context": "The exact sentence from the article containing this word.", "contextCn": "该句子的中文翻译"}
  ],
  "questions": [
    {"q": "Comprehension question?", "options": ["A) ...", "B) ...", "C) ...", "D) ..."], "answer": 0, "why": "中文解释"}
  ]
}`
        }],
      }),
    });

    const claudeData = await claudeResp.json();

    if (claudeData.error) {
      return res.status(500).json({ error: claudeData.error.message || 'Claude API error' });
    }

    let resultText = '';
    if (claudeData.content) {
      for (const block of claudeData.content) {
        if (block.text) resultText += block.text;
      }
    }

    resultText = resultText.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(resultText);

    return res.status(200).json(parsed);
  } catch (err) {
    console.error('Process article error:', err);
    return res.status(500).json({ error: 'Failed to process article: ' + (err.message || 'unknown error') });
  }
}
