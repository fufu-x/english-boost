import { useState, useCallback } from 'react'
import { addWord, hasWord, markArticleRead } from '../utils/storage'

// Split text into tokens: words and whitespace/punctuation
function tokenize(text) {
  // Split keeping spaces and punctuation attached to context
  const tokens = [];
  const regex = /([a-zA-Z'-]+|[^a-zA-Z'\s-]+|\s+)/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    tokens.push(match[0]);
  }
  return tokens;
}

// Extract clean word (strip surrounding punctuation)
function cleanWord(token) {
  return token.replace(/^[^a-zA-Z]+|[^a-zA-Z]+$/g, '');
}

// Find the sentence containing a word at a given position in text
function findSentence(text, wordStart) {
  // Look backwards for sentence start
  let start = wordStart;
  while (start > 0 && !/[.!?]\s/.test(text.slice(start - 2, start))) {
    start--;
  }
  // Look forwards for sentence end
  let end = wordStart;
  while (end < text.length && !/[.!?]/.test(text[end])) {
    end++;
  }
  return text.slice(start, end + 1).trim();
}

// Popup component for word lookup
function WordPopup({ info, loading, error, onSave, onExplainSentence, onClose, alreadySaved, sentence }) {
  return (
    <div className="popup-overlay" onClick={onClose}>
      <div className="popup-card" onClick={e => e.stopPropagation()}>
        <button className="popup-close" onClick={onClose}>✕</button>

        {loading && (
          <div style={{ textAlign: 'center', padding: '20px 0', color: '#888' }}>
            <div className="pulse" style={{ fontSize: 20, marginBottom: 8 }}>...</div>
            查询中
          </div>
        )}

        {error && (
          <div style={{ color: '#dc2626', fontSize: 14, padding: '16px 0' }}>
            {error}
          </div>
        )}

        {info && !loading && (
          <>
            <div className="popup-word">{info.word}</div>
            {info.ph && <div className="popup-ph">{info.ph}</div>}
            <div className="popup-mean">{info.mean}</div>
            {info.detail && <div className="popup-detail">{info.detail}</div>}

            <div className="popup-actions">
              {alreadySaved ? (
                <span className="popup-saved">已在词库</span>
              ) : (
                <button className="popup-btn popup-btn-save" onClick={onSave}>
                  + 收藏到词库
                </button>
              )}
              <button className="popup-btn popup-btn-explain" onClick={onExplainSentence}>
                解释整句
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Sentence explanation popup
function SentencePopup({ info, loading, error, onClose }) {
  return (
    <div className="popup-overlay" onClick={onClose}>
      <div className="popup-card popup-card-wide" onClick={e => e.stopPropagation()}>
        <button className="popup-close" onClick={onClose}>✕</button>

        {loading && (
          <div style={{ textAlign: 'center', padding: '20px 0', color: '#888' }}>
            <div className="pulse" style={{ fontSize: 20, marginBottom: 8 }}>...</div>
            正在分析句子...
          </div>
        )}

        {error && <div style={{ color: '#dc2626', fontSize: 14 }}>{error}</div>}

        {info && !loading && (
          <>
            <div className="popup-section-title">句子解析</div>
            <div className="popup-explanation">{info.explanation}</div>
            {info.keyPhrases && info.keyPhrases.length > 0 && (
              <>
                <div className="popup-section-title" style={{ marginTop: 12 }}>关键短语</div>
                {info.keyPhrases.map((kp, i) => (
                  <div key={i} className="popup-keyphrase">
                    <b>{kp.phrase}</b> — {kp.mean}
                  </div>
                ))}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// Interactive article text - every word is tappable
function InteractiveText({ text, vocabSet, onWordTap }) {
  const tokens = tokenize(text);
  let charPos = 0;

  return (
    <div className="article-content">
      {tokens.map((token, i) => {
        const pos = charPos;
        charPos += token.length;
        const word = cleanWord(token);

        // If it's a real word (has letters)
        if (/[a-zA-Z]/.test(token) && word.length > 1) {
          const isVocab = vocabSet.has(word.toLowerCase());
          return (
            <span
              key={i}
              className={`tap-word ${isVocab ? 'tap-word-vocab' : ''}`}
              onClick={() => onWordTap(word, pos, text)}
            >
              {token}
            </span>
          );
        }
        // Whitespace or punctuation - render as is
        return <span key={i}>{token}</span>;
      })}
    </div>
  );
}


export default function ArticleReader({ article, data, updateData, onClose }) {
  const [processed, setProcessed] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Word popup state
  const [wordPopup, setWordPopup] = useState(null); // { info, loading, error, word, sentence }
  // Sentence popup state
  const [sentencePopup, setSentencePopup] = useState(null); // { info, loading, error, sentence }
  // Quiz state
  const [phase, setPhase] = useState('loading');
  const [answers, setAnswers] = useState({});
  const [checked, setChecked] = useState(false);
  // Track words saved during this session
  const [sessionSaved, setSessionSaved] = useState(new Set());

  // Process article on mount
  useState(() => {
    processArticle();
  }, []);

  async function processArticle() {
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch('/api/process-article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: article.link }),
      });
      const result = await resp.json();
      if (result.error) throw new Error(result.error);
      setProcessed(result);
      setPhase('reading');
    } catch (e) {
      setError(e.message || '文章加载失败');
      setPhase('loading');
    }
    setLoading(false);
  }

  // Lookup a single word
  const lookupWord = useCallback(async (word, charPos, fullText) => {
    const sentence = findSentence(fullText, charPos);
    setWordPopup({ info: null, loading: true, error: null, word, sentence });

    try {
      const resp = await fetch('/api/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word, sentence, mode: 'word' }),
      });
      const result = await resp.json();
      if (result.error) throw new Error(result.error);
      setWordPopup(prev => ({ ...prev, info: result, loading: false }));
    } catch (e) {
      setWordPopup(prev => ({ ...prev, loading: false, error: '查询失败，请重试' }));
    }
  }, []);

  // Explain a full sentence
  const explainSentence = useCallback(async (sentence) => {
    setWordPopup(null);
    setSentencePopup({ info: null, loading: true, error: null, sentence });

    try {
      const resp = await fetch('/api/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sentence, mode: 'sentence' }),
      });
      const result = await resp.json();
      if (result.error) throw new Error(result.error);
      setSentencePopup(prev => ({ ...prev, info: result, loading: false }));
    } catch (e) {
      setSentencePopup(prev => ({ ...prev, loading: false, error: '解析失败，请重试' }));
    }
  }, []);

  // Save word to bank
  const saveWord = useCallback(() => {
    if (!wordPopup || !wordPopup.info) return;
    const info = wordPopup.info;
    const newData = addWord(data, {
      word: info.word,
      ph: info.ph || '',
      mean: info.mean,
      context: wordPopup.sentence || '',
      contextCn: '',
    }, processed?.title || article.title);
    updateData(newData);
    setSessionSaved(prev => new Set(prev).add(info.word.toLowerCase()));
  }, [wordPopup, data, updateData, processed, article]);

  // Save a vocab card word
  const saveVocabWord = useCallback((v) => {
    const newData = addWord(data, v, processed?.title || article.title);
    updateData(newData);
    setSessionSaved(prev => new Set(prev).add(v.word.toLowerCase()));
  }, [data, updateData, processed, article]);

  const isWordSaved = (w) => {
    return hasWord(data, w) || sessionSaved.has(w.toLowerCase());
  };

  // Go to quiz
  const goToQuiz = () => {
    setPhase('quiz');
  };

  // Submit quiz
  const submitQuiz = () => {
    setChecked(true);
    let correct = 0;
    if (processed?.questions) {
      for (let i = 0; i < processed.questions.length; i++) {
        if (answers[i] === processed.questions[i].answer) correct++;
      }
    }
    const qTotal = processed?.questions?.length || 0;
    const newData = markArticleRead(data, article.link, processed?.title || article.title, article.sourceName, [correct, qTotal]);
    updateData(newData);
  };

  // ── Loading ──
  if (loading || (phase === 'loading' && !error)) {
    return (
      <div className="page loading">
        <div className="loading-icon pulse">📖</div>
        <div>正在加载文章...</div>
        <div style={{ fontSize: 12, color: '#bbb', marginTop: 8 }}>AI 正在分析词汇和生成理解题</div>
        <button className="btn-back" onClick={onClose} style={{ marginTop: 24 }}>取消</button>
      </div>
    );
  }

  if (error && phase === 'loading') {
    return (
      <div className="page" style={{ paddingTop: 40, textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>😞</div>
        <p style={{ color: '#dc2626', marginBottom: 16 }}>{error}</p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button className="btn btn-primary" style={{ width: 'auto', padding: '10px 24px' }} onClick={processArticle}>重试</button>
          <button className="btn btn-white" style={{ width: 'auto', padding: '10px 24px' }} onClick={onClose}>返回</button>
        </div>
      </div>
    );
  }

  // ── Reading Phase ──
  if (phase === 'reading' && processed) {
    const vocabSet = new Set((processed.vocab || []).map(v => v.word.toLowerCase()));

    return (
      <div className="page" style={{ paddingBottom: 120 }}>
        <button className="btn-back" onClick={onClose}>← 返回文章列表</button>
        <div className="article-source-tag">{article.sourceName}</div>
        <h2 style={{ fontSize: 18, lineHeight: 1.4, marginBottom: 8 }}>{processed.title}</h2>
        <p className="tap-hint">💡 点击任意单词查释义，高亮词是 AI 推荐</p>

        {/* Interactive article text */}
        <InteractiveText
          text={processed.content}
          vocabSet={vocabSet}
          onWordTap={lookupWord}
        />

        {/* AI recommended vocab (collapsed by default) */}
        <details className="vocab-section">
          <summary className="vocab-summary">
            📌 AI 推荐词汇（{processed.vocab?.length || 0} 个）
          </summary>
          {processed.vocab && processed.vocab.map((v, i) => {
            const saved = isWordSaved(v.word);
            return (
              <div key={i} className={`vocab-card ${saved ? 'vocab-known' : ''}`}>
                <div className="vocab-card-header">
                  <div>
                    <span className="vocab-card-word">{v.word}</span>
                    {v.ph && <span className="vocab-card-ph">{v.ph}</span>}
                  </div>
                  {!saved ? (
                    <button className="vocab-add-btn" onClick={(e) => { e.stopPropagation(); saveVocabWord(v); }}>+ 收藏</button>
                  ) : (
                    <span className="vocab-card-check">已收藏</span>
                  )}
                </div>
                <div className="vocab-card-mean">{v.mean}</div>
                {v.context && <div className="vocab-card-context">"{v.context}"</div>}
                {v.contextCn && <div className="vocab-card-contextCn">{v.contextCn}</div>}
              </div>
            );
          })}
        </details>

        {/* Action bar */}
        <div className="reader-action-bar">
          <div style={{ fontSize: 13, color: '#666' }}>
            已收藏 {sessionSaved.size} 个新词
          </div>
          <button className="btn btn-primary"
            style={{ width: 'auto', padding: '12px 24px', margin: 0 }}
            onClick={goToQuiz}>
            做题 →
          </button>
        </div>

        {/* Word popup */}
        {wordPopup && (
          <WordPopup
            info={wordPopup.info}
            loading={wordPopup.loading}
            error={wordPopup.error}
            sentence={wordPopup.sentence}
            alreadySaved={wordPopup.info ? isWordSaved(wordPopup.info.word) : false}
            onSave={saveWord}
            onExplainSentence={() => explainSentence(wordPopup.sentence)}
            onClose={() => setWordPopup(null)}
          />
        )}

        {/* Sentence popup */}
        {sentencePopup && (
          <SentencePopup
            info={sentencePopup.info}
            loading={sentencePopup.loading}
            error={sentencePopup.error}
            onClose={() => setSentencePopup(null)}
          />
        )}
      </div>
    );
  }

  // ── Quiz Phase ──
  if (phase === 'quiz' && processed?.questions) {
    const qLen = processed.questions.length;
    const ansLen = Object.keys(answers).length;
    const canCheck = ansLen >= qLen;
    let correctCount = 0;
    if (checked) {
      for (let i = 0; i < qLen; i++) {
        if (answers[i] === processed.questions[i].answer) correctCount++;
      }
    }

    return (
      <div className="page">
        <button className="btn-back" onClick={onClose}>← 返回文章列表</button>
        <h2 style={{ fontSize: 18, marginBottom: 16 }}>📝 阅读理解</h2>

        {processed.questions.map((q, qi) => (
          <div key={qi} className="card">
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Q{qi + 1}. {q.q}</div>
            {q.options.map((opt, oi) => {
              let cls = 'q-option';
              if (checked) {
                if (q.answer === oi) cls += ' correct';
                else if (answers[qi] === oi && q.answer !== oi) cls += ' wrong';
              } else if (answers[qi] === oi) {
                cls += ' selected';
              }
              return (
                <button key={oi} className={cls}
                  onClick={() => !checked && setAnswers({ ...answers, [qi]: oi })}>
                  {opt}
                </button>
              );
            })}
            {checked && q.why && <div className="q-explain">{q.why}</div>}
          </div>
        ))}

        <div className="flex-row">
          {!checked ? (
            <button className={`btn ${canCheck ? 'btn-primary' : 'btn-disabled'} flex1`}
              onClick={canCheck ? submitQuiz : undefined}
              style={{ textAlign: 'center' }}>
              <div className="btn-title" style={{ textAlign: 'center' }}>查看答案</div>
            </button>
          ) : (
            <div style={{ width: '100%', textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{correctCount}/{qLen} 正确</div>
              <p style={{ color: '#888', fontSize: 13, marginBottom: 16 }}>
                {sessionSaved.size > 0 ? `本次收藏了 ${sessionSaved.size} 个新词` : ''}
              </p>
              <button className="btn btn-primary"
                style={{ width: 'auto', display: 'inline-block', padding: '12px 32px' }}
                onClick={onClose}>
                完成
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}
