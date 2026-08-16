import { useState, useEffect } from 'react'
import { SOURCES } from '../data/sources'
import { getDueWords } from '../utils/storage'

export default function Home({ data, openArticle, setTab }) {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sourceFilter, setSourceFilter] = useState('all');

  const fetchArticles = async (source) => {
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch(`/api/fetch-feeds?source=${source}`);
      const result = await resp.json();
      if (result.articles) {
        setArticles(result.articles);
      } else {
        setError(result.error || '获取文章失败');
      }
    } catch {
      setError('网络错误，请重试');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchArticles('all');
  }, []);

  const handleSourceFilter = (id) => {
    setSourceFilter(id);
    fetchArticles(id);
  };

  const dueCount = getDueWords(data).length;
  const wordsCount = Object.keys(data.words).length;
  const mastered = Object.values(data.words).filter(w => w.status === 'mastered').length;

  const isRead = (url) => !!data.readHistory[url];

  return (
    <div className="page">
      <h1>English Boost</h1>
      <p className="sub">读文章 · 学英语</p>

      {/* Quick stats */}
      <div className="stats-bar">
        <div className="stats-row" style={{ margin: 0 }}>
          <div className="stat">
            <div className="stat-num">{data.stats.articlesRead}</div>
            <div className="stat-label">已读文章</div>
          </div>
          <div className="stat">
            <div className="stat-num">{wordsCount}</div>
            <div className="stat-label">收集生词</div>
          </div>
          <div className="stat">
            <div className="stat-num">{mastered}</div>
            <div className="stat-label">已掌握</div>
          </div>
          <div className="stat" onClick={() => setTab('review')} style={{ cursor: 'pointer' }}>
            <div className="stat-num" style={{ color: dueCount > 0 ? '#fbbf24' : '#fff' }}>
              {dueCount}
            </div>
            <div className="stat-label">待复习</div>
          </div>
        </div>
      </div>

      {/* Source filter */}
      <div className="filter-row">
        <button
          className={`filter-btn ${sourceFilter === 'all' ? 'filter-active' : 'filter-inactive'}`}
          onClick={() => handleSourceFilter('all')}
        >
          全部
        </button>
        {SOURCES.map(s => (
          <button
            key={s.id}
            className={`filter-btn ${sourceFilter === s.id ? 'filter-active' : 'filter-inactive'}`}
            onClick={() => handleSourceFilter(s.id)}
          >
            {s.name}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="loading" style={{ padding: '40px 0' }}>
          <div className="loading-icon pulse">📡</div>
          <div>正在获取最新文章...</div>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="card" style={{ textAlign: 'center' }}>
          <p style={{ color: '#dc2626', marginBottom: 12 }}>{error}</p>
          <button className="btn btn-primary" style={{ width: 'auto', display: 'inline-block', padding: '10px 24px' }}
            onClick={() => fetchArticles(sourceFilter)}>
            重试
          </button>
        </div>
      )}

      {/* Article list */}
      {!loading && articles.map((a, i) => {
        const read = isRead(a.link);
        return (
          <div key={i} className="article-card" onClick={() => openArticle(a)}
            style={{ opacity: read ? 0.6 : 1 }}>
            <div className="article-source">
              {a.sourceName}
              {read && <span className="article-read-badge">已读</span>}
            </div>
            <div className="article-title">{a.title}</div>
            {a.description && (
              <div className="article-desc">{a.description}</div>
            )}
          </div>
        );
      })}

      {!loading && !error && articles.length === 0 && (
        <div style={{ textAlign: 'center', color: '#aaa', padding: 40 }}>
          暂无文章
        </div>
      )}
    </div>
  );
}
