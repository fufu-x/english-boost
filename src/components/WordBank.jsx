import { useState } from 'react'
import { getAllWords } from '../utils/storage'

const STATUS_LABELS = { new: '新词', learning: '学习中', mastered: '已掌握' };
const STATUS_CLASS = { new: 'status-new', learning: 'status-learning', mastered: 'status-mastered' };

export default function WordBank({ data }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [openId, setOpenId] = useState(null);

  const all = getAllWords(data);

  const counts = { all: all.length, new: 0, learning: 0, mastered: 0 };
  for (const w of all) counts[w.status]++;

  const filtered = all.filter(w => {
    if (statusFilter !== 'all' && w.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!w.word.toLowerCase().includes(q) && !w.mean.includes(search)) return false;
    }
    return true;
  }).sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0));

  return (
    <div className="page">
      <h2>词库 ({all.length})</h2>

      {all.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 32 }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📖</div>
          <p style={{ color: '#888', fontSize: 14 }}>
            还没有收集到生词。<br/>去读文章，收藏遇到的新词吧！
          </p>
        </div>
      ) : (
        <>
          <input className="search-input" type="text" placeholder="搜索单词或释义..."
            value={search} onChange={e => setSearch(e.target.value)} />

          <div className="filter-row">
            {[['all', `全部 (${counts.all})`], ['new', `新词 (${counts.new})`],
              ['learning', `学习中 (${counts.learning})`], ['mastered', `已掌握 (${counts.mastered})`],
            ].map(([id, label]) => (
              <button key={id}
                className={`filter-btn ${statusFilter === id ? 'filter-active' : 'filter-inactive'}`}
                onClick={() => setStatusFilter(id)}>
                {label}
              </button>
            ))}
          </div>

          {filtered.map(w => (
            <div key={w.id} className="wb-item"
              onClick={() => setOpenId(openId === w.id ? null : w.id)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span className="wb-word">{w.word}</span>
                  <span className="wb-mean">{w.mean}</span>
                </div>
                <span className={`wb-status ${STATUS_CLASS[w.status]}`}>
                  {STATUS_LABELS[w.status]}
                </span>
              </div>
              {openId === w.id && (
                <div className="wb-detail">
                  {w.ph && <div style={{ fontSize: 13, color: '#aaa', marginBottom: 6 }}>{w.ph}</div>}
                  {w.context && (
                    <div style={{ fontSize: 13, color: '#555', lineHeight: 1.6, fontStyle: 'italic' }}>
                      "{w.context}"
                    </div>
                  )}
                  {w.contextCn && (
                    <div style={{ fontSize: 13, color: '#aaa', lineHeight: 1.6, marginTop: 2 }}>
                      {w.contextCn}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 12, marginTop: 8, fontSize: 12, color: '#aaa', flexWrap: 'wrap' }}>
                    <span>来源: {w.source}</span>
                    <span>复习: {w.reviewCount}次</span>
                    {w.reviewCount > 0 && <span>正确率: {Math.round((w.correctCount / w.reviewCount) * 100)}%</span>}
                  </div>
                </div>
              )}
            </div>
          ))}

          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', color: '#aaa', padding: 40, fontSize: 14 }}>
              没有找到
            </div>
          )}
        </>
      )}
    </div>
  );
}
