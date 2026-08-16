export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  const { word, sentence, mode } = req.body;
  // mode: 'word' (single word lookup) or 'sentence' (explain a sentence/phrase)

  if (!word && !sentence) {
    return res.status(400).json({ error: 'word or sentence is required' });
  }

  try {
    const baseUrl = process.env.API_BASE_URL || 'https://api.anthropic.com';

    let prompt;
    if (mode === 'sentence') {
      prompt = `Explain this English sentence/phrase for a Chinese learner (hardware engineer, CEFR B1-B2 level). Break down the grammar, key phrases, and overall meaning.

Sentence: "${sentence}"

Reply ONLY with valid JSON, no markdown, no backticks:
{"explanation": "用中文详细解释这个句子的含义、语法结构和关键短语，让学习者理解每个部分", "keyPhrases": [{"phrase": "key phrase", "mean": "中文释义"}]}`;
    } else {
      prompt = `Give a concise Chinese definition for this English word/phrase as used in context. The learner is a Chinese hardware engineer at CEFR B1-B2 level.

Word/Phrase: "${word}"
Context sentence: "${sentence || 'N/A'}"

Reply ONLY with valid JSON, no markdown, no backticks:
{"word": "${word}", "ph": "/phonetic/", "mean": "简明中文释义（根据上下文语境）", "detail": "稍微详细一点的解释，包括常见用法或搭配，1-2句话"}`;
    }

    const response = await fetch(`${baseUrl}/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 500,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const data = await response.json();

    if (data.error) {
      return res.status(500).json({ error: data.error.message || 'API error' });
    }

    let text = '';
    if (data.content) {
      for (const block of data.content) {
        if (block.text) text += block.text;
      }
    }

    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(text);

    return res.status(200).json(parsed);
  } catch (err) {
    console.error('Lookup error:', err);
    return res.status(500).json({ error: 'Lookup failed' });
  }
}
