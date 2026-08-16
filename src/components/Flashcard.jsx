import { useState } from 'react'
import { getDueWords, reviewWord, getAllWords } from '../utils/storage'

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function Flashcard({ data, updateData }) {
  const [mode, setMode] = useState('idle');
  const [queue, setQueue] = useState([]);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [results, setResults] = useState([]);

  const due = getDueWords(data);
  const all = getAllWords(data);

  const startDue = () => {
    if (due.length === 0) return;
    setQueue(shuffle(due).slice(0, 20));
    setIdx(0); setFlipped(false); setResults([]);
    setMode('review');
  };

  const startRandom = () => {
    if (all.length === 0) return;
    const nonMastered = all.filter(w => w.status !== 'mastered');
    const pool = nonMastered.length > 0 ? nonMastered : all;
    setQueue(shuffle(pool).slice(0, 15));
    setIdx(0); setFlipped(false); setResults([]);
    setMode('review');
  };

  const handleAnswer = (correct) => {
    const word = queue[idx];
    const newData = reviewWord(data, word.id, correct);
    updateData(newData);
    const newResults = [...results, { word, correct }];
    setResults(newResults);
    if (idx + 1 >= queue.length) {
      setMode('result');
    } else {
      setIdx(idx + 1);
      setFlipped(false);
    }
  };

  // ── Idle ──
  if (mode === 'idle') {
    const mastered = all.filter(w => w.status === 'mastered').length;
    const learning = all.filter(w => w.status === 'learning').length;

    return (
      <div className="page">
        <h2>复习</h2>

        {all.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 32 }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>📖</div>
            <p style={{ color: '#888', fontSize: 14 }}>
              还没有收集到生词。<br/>去读几篇文章，收藏不认识的词吧！
            </p>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="card" style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
                <div><div style={{ fontSize: 20, fontWeight: 700 }}>{all.length}</div><div style={{ fontSize: 11, color: '#aaa' }}>总词数</div></div>
                <div><div style={{ fontSize: 20, fontWeight: 700, color: '#e8913a' }}>{due.length}</div><div style={{ fontSize: 11, color: '#aaa' }}>待复习</div></div>
                <div><div style={{ fontSize: 20, fontWeight: 700, color: '#0d7377' }}>{learning}</div><div style={{ fontSize: 11, color: '#aaa' }}>学习中</div></div>
                <div><div style={{ fontSize: 20, fontWeight: 700, color: '#10b981' }}>{mastered}</div><div style={{ fontSize: 11, color: '#aaa' }}>已掌握</div></div>
              </div>
            </div>

            <button className={`btn ${due.length > 0 ? 'btn-orange' : 'btn-disabled'}`}
              onClick={due.length > 0 ? startDue : undefined}>
              <div className="btn-title">📝 复习到期词汇</div>
              <div className="btn-desc">{due.length > 0 ? `${due.length} 个词等待复习` : '暂无到期词汇'}</div>
            </button>

            <button className="btn btn-outline" onClick={startRandom}>
              <div className="btn-title">🔄 随机练习</div>
              <div className="btn-desc">从词库随机抽取</div>
            </button>
          </>
        )}
      </div>
    );
  }

  // ── Result ──
  if (mode === 'result') {
    const correct = results.filter(r => r.correct).length;
    const pct = Math.round((correct / results.length) * 100);
    const missed = results.filter(r => !r.correct);

    return (
      <div className="page center">
        <div style={{ fontSize: 48, marginTop: 40 }}>{pct >= 80 ? '🎉' : pct >= 50 ? '💪' : '📖'}</div>
        <h2 style={{ margin: '16px 0 8px' }}>练习完成</h2>
        <p style={{ color: '#888', fontSize: 14 }}>{correct}/{results.length} 正确 ({pct}%)</p>
        <p style={{ color: '#888', fontSize: 13, margin: '8px 0 24px' }}>
          {pct >= 80 ? '太棒了！' : pct >= 50 ? '不错，继续加油。' : '多读几篇文章，在语境中再遇到就会更熟。'}
        </p>
        {missed.length > 0 && (
          <div style={{ textAlign: 'left', maxWidth: 360, margin: '0 auto' }}>
            <div style={{ fontSize: 13, color: '#888', marginBottom: 8 }}>需要加强：</div>
            {missed.map(r => (
              <div key={r.word.id} style={{ padding: '8px 12px', background: '#fff5f5', borderRadius: 8, marginBottom: 6, fontSize: 14 }}>
                <b>{r.word.word}</b> — {r.word.mean}
              </div>
            ))}
          </div>
        )}
        <button className="btn btn-primary" onClick={() => setMode('idle')}
          style={{ width: 'auto', padding: '12px 32px', display: 'inline-block', marginTop: 20 }}>
          返回
        </button>
      </div>
    );
  }

  // ── Review ──
  const w = queue[idx];
  return (
    <div className="page">
      <div className="header-row">
        <button className="btn-back" onClick={() => setMode('idle')} style={{ marginBottom: 0 }}>← 返回</button>
        <span className="counter">{idx + 1} / {queue.length}</span>
      </div>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: ((idx + 1) / queue.length * 100) + '%' }} />
      </div>

      <div className="flashcard" onClick={() => !flipped && setFlipped(true)}>
        {!flipped ? (
          <>
            <div className="fc-word">{w.word}</div>
            {w.ph && <div className="fc-ph">{w.ph}</div>}
            {w.context && <div className="fc-ex">"{w.context}"</div>}
            <div className="fc-hint">点击翻转</div>
          </>
        ) : (
          <>
            <div className="fc-word-sm">{w.word}</div>
            {w.ph && <div style={{ fontSize: 13, color: '#aaa', marginBottom: 10 }}>{w.ph}</div>}
            <div className="fc-mean">{w.mean}</div>
            {w.context && <div style={{ fontSize: 14, color: '#555', lineHeight: 1.7 }}>{w.context}</div>}
            {w.contextCn && <div className="fc-exCn">{w.contextCn}</div>}
            <div className="fc-cat">来源: {w.source}</div>
          </>
        )}
      </div>

      {flipped && (
        <div className="answer-row">
          <button className="btn-wrong" onClick={() => handleAnswer(false)}>不认识</button>
          <button className="btn-right" onClick={() => handleAnswer(true)}>认识</button>
        </div>
      )}
    </div>
  );
}
