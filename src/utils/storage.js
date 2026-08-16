const STORAGE_KEY = 'english-boost-v2';

const SRS_INTERVALS = [0, 0.3, 1, 3, 7, 14, 30]; // days

export function getNextReview(level) {
  const days = SRS_INTERVALS[Math.min(level, SRS_INTERVALS.length - 1)];
  return Date.now() + days * 86400000;
}

export function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}

export function saveData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Save failed:', e);
  }
}

export function initData(seedWords) {
  const words = {};
  if (seedWords) {
    for (let i = 0; i < seedWords.length; i++) {
      const w = seedWords[i];
      const id = 'seed_' + i;
      words[id] = {
        word: w.word,
        ph: w.ph,
        mean: w.mean,
        context: w.context,
        contextCn: w.contextCn,
        source: w.source,
        status: 'new',
        srsLevel: 0,
        nextReview: 0,
        reviewCount: 0,
        correctCount: 0,
        addedAt: Date.now(),
      };
    }
  }
  return {
    words,
    readHistory: {},
    stats: {
      totalReviews: 0,
      totalCorrect: 0,
      articlesRead: 0,
      wordsCollected: Object.keys(words).length,
    },
  };
}

// Add a word from an article to the collection
export function addWord(data, wordInfo, articleTitle) {
  const id = 'w_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
  const newData = { ...data };
  newData.words = { ...newData.words };
  newData.words[id] = {
    word: wordInfo.word,
    ph: wordInfo.ph || '',
    mean: wordInfo.mean,
    context: wordInfo.context || '',
    contextCn: wordInfo.contextCn || '',
    source: articleTitle || 'unknown',
    status: 'new',
    srsLevel: 0,
    nextReview: 0,
    reviewCount: 0,
    correctCount: 0,
    addedAt: Date.now(),
  };
  newData.stats = {
    ...newData.stats,
    wordsCollected: Object.keys(newData.words).length,
  };
  return newData;
}

// Batch add words
export function addWords(data, wordInfos, articleTitle) {
  let newData = { ...data };
  for (const w of wordInfos) {
    newData = addWord(newData, w, articleTitle);
  }
  return newData;
}

// Check if word already exists
export function hasWord(data, word) {
  const lower = word.toLowerCase();
  for (const v of Object.values(data.words)) {
    if (v.word.toLowerCase() === lower) return true;
  }
  return false;
}

// Mark article as read
export function markArticleRead(data, url, title, source, quizScore) {
  const newData = { ...data };
  newData.readHistory = { ...newData.readHistory };
  newData.readHistory[url] = {
    title,
    source,
    readAt: Date.now(),
    quizScore,
  };
  newData.stats = {
    ...newData.stats,
    articlesRead: Object.keys(newData.readHistory).length,
  };
  return newData;
}

// Update word after review
export function reviewWord(data, wordId, correct) {
  const newData = { ...data };
  const w = { ...newData.words[wordId] };

  w.srsLevel = correct ? Math.min(w.srsLevel + 1, 6) : Math.max(w.srsLevel - 1, 0);
  w.status = w.srsLevel >= 6 ? 'mastered' : 'learning';
  w.nextReview = getNextReview(w.srsLevel);
  w.reviewCount += 1;
  w.correctCount += correct ? 1 : 0;

  newData.words = { ...newData.words, [wordId]: w };
  newData.stats = {
    ...newData.stats,
    totalReviews: newData.stats.totalReviews + 1,
    totalCorrect: newData.stats.totalCorrect + (correct ? 1 : 0),
  };
  return newData;
}

// Get words due for review
export function getDueWords(data) {
  const now = Date.now();
  const result = [];
  for (const [id, w] of Object.entries(data.words)) {
    if (w.status !== 'mastered' && w.nextReview <= now) {
      result.push({ id, ...w });
    }
  }
  return result;
}

// Get all words as array
export function getAllWords(data) {
  return Object.entries(data.words).map(([id, w]) => ({ id, ...w }));
}
