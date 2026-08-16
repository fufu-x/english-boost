import { useState, useEffect } from 'react'
import { SEED_WORDS } from './data/sources'
import { loadData, saveData, initData, getDueWords } from './utils/storage'
import Home from './components/Home'
import ArticleReader from './components/ArticleReader'
import Flashcard from './components/Flashcard'
import WordBank from './components/WordBank'

function TabBar({ tab, setTab, dueCount }) {
  const tabs = [
    { id: 'home', icon: '📰', label: '文章' },
    { id: 'review', icon: '🃏', label: '复习' },
    { id: 'words', icon: '📚', label: '词库' },
  ];
  return (
    <div className="tab-bar">
      {tabs.map(t => (
        <button key={t.id} className={`tab-btn ${tab === t.id ? 'active' : 'inactive'}`}
          onClick={() => setTab(t.id)}>
          <span className="tab-icon">{t.icon}</span>
          <span className="tab-label">{t.label}</span>
          {t.id === 'review' && dueCount > 0 && (
            <span className="tab-badge">{dueCount > 99 ? '99+' : dueCount}</span>
          )}
        </button>
      ))}
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState('home');
  const [data, setData] = useState(null);
  const [article, setArticle] = useState(null); // currently reading article

  useEffect(() => {
    const saved = loadData();
    if (saved && saved.words) {
      setData(saved);
    } else {
      const fresh = initData(SEED_WORDS);
      setData(fresh);
      saveData(fresh);
    }
  }, []);

  const updateData = (newData) => {
    setData(newData);
    saveData(newData);
  };

  const openArticle = (articleInfo) => {
    setArticle(articleInfo);
  };

  const closeArticle = () => {
    setArticle(null);
  };

  if (!data) {
    return (
      <div className="loading">
        <div className="loading-icon">📚</div>
        <div>加载中...</div>
      </div>
    );
  }

  const dueCount = getDueWords(data).length;

  // Article reader is a full-screen overlay
  if (article) {
    return (
      <ArticleReader
        article={article}
        data={data}
        updateData={updateData}
        onClose={closeArticle}
      />
    );
  }

  return (
    <>
      <div className={tab === 'home' ? '' : 'hidden'}>
        <Home data={data} openArticle={openArticle} setTab={setTab} />
      </div>
      <div className={tab === 'review' ? '' : 'hidden'}>
        <Flashcard data={data} updateData={updateData} />
      </div>
      <div className={tab === 'words' ? '' : 'hidden'}>
        <WordBank data={data} />
      </div>
      <TabBar tab={tab} setTab={setTab} dueCount={dueCount} />
    </>
  );
}
