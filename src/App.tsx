import { useState, useEffect, useRef, useCallback } from 'react';
import { QuoteCard, type QuoteData } from './components/QuoteCard';
import { ThemeFilter, THEMES } from './components/ThemeFilter';
import { QUOTES } from './data/quotes';
import { BACKGROUNDS } from './data/backgrounds';
import './index.css';

function App() {
  const [quotes, setQuotes] = useState<QuoteData[]>([]);
  const [allQuotes, setAllQuotes] = useState<Omit<QuoteData, 'backgroundUrl'>[]>(() => {
    return [...QUOTES].sort(() => 0.5 - Math.random());
  });
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [isFetching, setIsFetching] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState(THEMES[0]);

  const fetchZenQuotes = useCallback(async () => {
    if (isFetching) return;
    setIsFetching(true);
    try {
      const res = await fetch('https://zenquotes.io/api/quotes/');
      if (!res.ok) throw new Error('Failed to fetch API');

      const data: { q: string, a: string }[] = await res.json();

      const newQuotes = data.map((item, index) => ({
        id: `zen-${Date.now()}-${index}`,
        text: item.q,
        author: item.a
      }));

      setAllQuotes(prev => [...prev, ...newQuotes]);
    } catch (err) {
      console.warn('Could not fetch external quotes.', err);
    } finally {
      setIsFetching(false);
    }
  }, [isFetching]);

  useEffect(() => {
    // Initial fetch to load the first 50 external quotes right away
    fetchZenQuotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Initialize the very first batch only once allQuotes has been populated/updated
    if (quotes.length === 0 && allQuotes.length > 0) {
      const filteredPool = selectedTheme === 'All'
        ? allQuotes
        : allQuotes.filter(q => q.theme === selectedTheme);

      if (filteredPool.length > 0) {
        const initialBatch = filteredPool.slice(0, 5).map(q => ({
          ...q,
          backgroundUrl: BACKGROUNDS[Math.floor(Math.random() * BACKGROUNDS.length)],
          id: crypto.randomUUID()
        }));
        setQuotes(initialBatch);
        setQuoteIndex(5);
      }
    }
  }, [allQuotes, quotes.length, selectedTheme]);

  const observerTarget = useRef<HTMLDivElement>(null);

  const loadMoreQuotes = useCallback(() => {
    if (quotes.length === 0) return; // Wait for initial load

    const filteredPool = selectedTheme === 'All'
      ? allQuotes
      : allQuotes.filter(q => q.theme === selectedTheme);

    if (filteredPool.length === 0) return;

    // Proactively fetch more if we're running low on unseen quotes (e.g. less than 10 left)
    if (selectedTheme === 'All' && filteredPool.length - quoteIndex <= 10) {
      fetchZenQuotes();
    }

    setQuotes(prev => {
      let nextBatch: Omit<QuoteData, 'backgroundUrl'>[] = [];
      let newIndex = quoteIndex;

      // Pull strictly from the unseen portion of our quotes pool
      if (filteredPool.length > quoteIndex) {
        nextBatch = filteredPool.slice(quoteIndex, quoteIndex + 5);
        newIndex += nextBatch.length;
      }

      // If we are out of unseen quotes (e.g. API failed to fetch), we recycle smoothly
      if (nextBatch.length < 5) {
        const remainder = 5 - nextBatch.length;
        // Start recycling from index 0
        const recycledBatch = filteredPool.slice(0, Math.min(remainder, filteredPool.length));
        nextBatch = [...nextBatch, ...recycledBatch];
        newIndex = recycledBatch.length; // Wrap our index around to the start
      }

      // If somehow we STILL have nothing (e.g. allQuotes is completely empty), bail out
      if (nextBatch.length === 0) return prev;

      // Ensure the very first quote of this batch doesn't accidentally mathematically match the last quote we just looked at
      if (prev.length > 0 && prev[prev.length - 1].text === nextBatch[0].text && nextBatch.length > 1) {
        const first = nextBatch.shift()!;
        nextBatch.push(first);
      }

      const newQuotes = nextBatch.map(q => ({
        ...q,
        backgroundUrl: BACKGROUNDS[Math.floor(Math.random() * BACKGROUNDS.length)],
        id: crypto.randomUUID()
      }));

      // Queue up the next index for the next scroll chunk
      setQuoteIndex(newIndex);

      return [...prev, ...newQuotes];
    });
  }, [allQuotes, quoteIndex, quotes.length, fetchZenQuotes, selectedTheme]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) {
          loadMoreQuotes();
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [loadMoreQuotes]);

  return (
    <main className="app-container">
      <ThemeFilter
        selectedTheme={selectedTheme}
        onSelectTheme={(theme) => {
          setSelectedTheme(theme);
          setQuotes([]);
          setQuoteIndex(0);
          document.querySelector('.app-container')?.scrollTo(0, 0);
        }}
      />
      {quotes.map((quote) => (
        <section key={quote.id} className="feed-item">
          <QuoteCard quote={quote} />
        </section>
      ))}
      {/* Invisible anchor element to trigger IntersectionObserver */}
      <div
        ref={observerTarget}
        style={{ height: '10px', scrollSnapAlign: 'none' }}
      />
    </main>
  );
}

export default App;
