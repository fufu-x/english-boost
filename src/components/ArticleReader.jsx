import { useState } from 'react'
import { addWords, hasWord, markArticleRead } from '../utils/storage'

export default function ArticleReader({ article, data, updateData, onClose }) {
  const [processed, setProcessed] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedWord, setSelectedWord] = useState(null);
  const [markedWords, setMarkedWords] = useState(new Set());
  const [phase, setPhase] = useState('loading'); // loading | reading | quiz | done
  const [answers, setAnswers] = useState({});
  const [checked, setChecked] = useState(false);

  // Fetch and process article on mount
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
      if (result.error) {
        throw new Error(result.error);
      }
      setProcessed(result);
      setPhase('reading');
    } catch (e) {
      setError(e.message || '文章加载失败');
      setPhase('loading');
    }
    setLoading(false);
  }

  // Toggle word as marked for learning
  const toggleMark = (vocabItem) => {
    const newMarked = new Set(markedWords);
    if (newMarked.has(vocabItem.word)) {
      newMarked.delete(vocabItem.word);
    } else {
      newMarked.add(vocabItem.word);
    }
    setMarkedWords(newMarked);
  };

  // Move from reading to quiz
  const goToQuiz = () => {
    // Save marked words
    if (markedWords.size > 0 && processed) {
      const wordsToAdd = processed.vocab.filter(v => markedWords.has(v.word) && !hasWord(data, v.word));
      if (wordsToAdd.length > 0) {
        const newData = addWords(data, wordsToAdd, processed.title || article.title);
        updateData(newData);
      }
    }
    setPhase('quiz');
  };

  // Check quiz answers
  const submitQuiz = () => {
    setChecked(true);
    // Record article as read
    let correctCount = 0;
    if (processed && processed.questions) {
      for (let i = 0; i < processed.questions.length; i++) {
        if (answers[i] === processed.questions[i].answer) correctCount++;
      }
    }
    const qTotal = processed?.questions?.length || 0;
    const newData = markArticleRead(data, article.link, processed?.title || article.title, article.sourceName, [correctCount, qTotal]);
    updateData(newData);
  };

  // ── Loading / Error ──
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

  if (error) {
    return (
      <div className="page" style={{ paddingTop: 40, textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>😞</div>
        <p style={{ color: '#dc2626', marginBottom: 16 }}>{error}</p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button className="btn btn-primary" style={{ width: 'auto', padding: '10px 24px' }}
            onClick={processArticle}>重试</button>
          <button className="btn btn-white" style={{ width: 'auto', padding: '10px 24px' }}
            onClick={onClose}>返回</button>
        </div>
      </div>
    );
  }

  // ── Reading Phase ──
  if (phase === 'reading' && processed) {
    const vocabWords = new Set(processed.vocab.map(v => v.word.toLowerCase()));

    return (
      <div className="page" style={{ paddingBottom: 120 }}>
        <button className="btn-back" onClick={onClose}>← 返回文章列表</button>

        <div className="article-source-tag">{article.sourceName}</div>
        <h2 style={{ fontSize: 18, lineHeight: 1.4, marginBottom: 16 }}>{processed.title}</h2>

        {/* Article content */}
        <div className="article-content">
          {processed.content}
        </div>

        {/* Vocabulary section */}
        <div style={{ marginTop: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>
            📌 这篇文章的重点词汇 <span style={{ fontWeight: 400, color: '#888', fontSize: 13 }}>（点击收藏到词库）</span>
          </h3>

          {processed.vocab.map((v, i) => {
            const isMarked = markedWords.has(v.word);
            const alreadyKnown = hasWord(data, v.word);

            return (
              <div key={i}
                className={`vocab-card ${isMarked ? 'vocab-marked' : ''} ${alreadyKnown ? 'vocab-known' : ''}`}
                onClick={() => !alreadyKnown && toggleMark(v)}>
                <div className="vocab-card-header">
                  <div>
                    <span className="vocab-card-word">{v.word}</span>
                    {v.ph && <span className="vocab-card-ph">{v.ph}</span>}
                  </div>
                  <span className="vocab-card-check">
                    {alreadyKnown ? '已在词库' : isMarked ? '✅' : '＋'}
                  </span>
                </div>
                <div className="vocab-card-mean">{v.mean}</div>
                {v.context && (
                  <div className="vocab-card-context">"{v.context}"</div>
                )}
                {v.contextCn && (
                  <div className="vocab-card-contextCn">{v.contextCn}</div>
                )}
              </div>
            );
          })}
        </div>

        {/* Action bar */}
        <div className="reader-action-bar">
          <div style={{ fontSize: 13, color: '#666' }}>
            已选 {markedWords.size} 个新词
          </div>
          <button className="btn btn-primary"
            style={{ width: 'auto', padding: '12px 24px', margin: 0 }}
            onClick={goToQuiz}>
            {markedWords.size > 0 ? `收藏并做题 →` : '跳过收藏，做题 →'}
          </button>
        </div>
      </div>
    );
  }

  // ── Quiz Phase ──
  if ((phase === 'quiz' || phase === 'done') && processed && processed.questions) {
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
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>
              Q{qi + 1}. {q.q}
            </div>
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
              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
                {correctCount}/{qLen} 正确
              </div>
              <p style={{ color: '#888', fontSize: 13, marginBottom: 16 }}>
                {markedWords.size > 0 ? `${markedWords.size} 个新词已加入复习队列` : ''}
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
