import { useReducer, useEffect, useRef, useCallback, useState } from 'react';
import { EyeOff } from 'lucide-react';
import { QuoteCard, type QuoteData } from './components/QuoteCard';
import { ThemeFilter, THEMES } from './components/ThemeFilter';
import { AutoModeToggle } from './components/AutoModeToggle';
import { AudioPlayer } from './components/AudioPlayer';
import { QUOTES } from './data/quotes';
import { BACKGROUNDS } from './data/backgrounds';
import './index.css';

let shuffledBackgrounds: string[] = [];
let backgroundIndex = 0;

const getRandomBackgroundUrl = () => {
  // We've fetched a massive pool of perfectly curated, vertical, inspirational
  // nature photographs from Unsplash directly into our data structure.
  // This guarantees 100% uptime with NO red error placeholders, while maintaining
  // beautiful high resolution imagery.
  if (shuffledBackgrounds.length === 0 || backgroundIndex >= shuffledBackgrounds.length) {
    shuffledBackgrounds = [...BACKGROUNDS].sort(() => 0.5 - Math.random());
    backgroundIndex = 0;
  }
  return shuffledBackgrounds[backgroundIndex++];
};

// --- STATE MACHINE / REDUCER ---

type AppState = {
  quotes: QuoteData[];
  fetchedQuotes: Omit<QuoteData, 'backgroundUrl'>[];
  localQuotesPool: Omit<QuoteData, 'backgroundUrl'>[];
  initialFetchDone: boolean;
  quoteIndex: number;
  isFetching: boolean;
  selectedTheme: string;
  isAutoMode: boolean;
  autoDuration: number;
  isUiHidden: boolean;
};

type AppAction =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; payload: Omit<QuoteData, 'backgroundUrl'>[] }
  | { type: 'FETCH_ERROR' }
  | { type: 'SET_THEME'; payload: string }
  | { type: 'TOGGLE_AUTO_MODE' }
  | { type: 'SET_AUTO_DURATION'; payload: number }
  | { type: 'SET_UI_HIDDEN'; payload: boolean }
  | { type: 'INITIALIZE' }
  | { type: 'LOAD_MORE' };

function initAppState(): AppState {
  return {
    quotes: [],
    fetchedQuotes: [],
    localQuotesPool: [...QUOTES].sort(() => 0.5 - Math.random()),
    initialFetchDone: false,
    quoteIndex: 0,
    isFetching: false,
    selectedTheme: THEMES[0],
    isAutoMode: false,
    autoDuration: 30,
    isUiHidden: false,
  };
}

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'FETCH_START':
      return { ...state, isFetching: true };
    case 'FETCH_SUCCESS':
      return {
        ...state,
        isFetching: false,
        initialFetchDone: true,
        fetchedQuotes: [...state.fetchedQuotes, ...action.payload]
      };
    case 'FETCH_ERROR':
      return { ...state, isFetching: false, initialFetchDone: true };
    case 'SET_THEME':
      return {
        ...state,
        selectedTheme: action.payload,
        quotes: [],
        quoteIndex: 0
      };
    case 'TOGGLE_AUTO_MODE':
      return { ...state, isAutoMode: !state.isAutoMode };
    case 'SET_AUTO_DURATION':
      return { ...state, autoDuration: action.payload };
    case 'SET_UI_HIDDEN':
      return { ...state, isUiHidden: action.payload };

    case 'INITIALIZE': {
      if (state.quotes.length > 0) return state;

      // Always grab a fallback pool immediately so the screen isn't blank
      const pool = state.selectedTheme === 'All'
        ? (state.fetchedQuotes.length > 0 ? state.fetchedQuotes : state.localQuotesPool)
        : state.localQuotesPool.filter(q => q.theme === state.selectedTheme);

      if (pool.length === 0) return state;

      const initialBatch = pool.slice(0, 2).map(q => {
        const bgUrl = getRandomBackgroundUrl();
        if (typeof window !== 'undefined') {
          const img = new window.Image();
          img.src = bgUrl;
        }
        return {
          ...q,
          backgroundUrl: bgUrl,
          id: crypto.randomUUID()
        };
      });

      return {
        ...state,
        quotes: initialBatch,
        quoteIndex: 2
      };
    }

    case 'LOAD_MORE': {
      if (state.quotes.length === 0) return state; // Wait for initial load

      // Use local fallback if network quotes aren't available yet
      const pool = state.selectedTheme === 'All'
        ? (state.fetchedQuotes.length > 0 ? state.fetchedQuotes : state.localQuotesPool)
        : state.localQuotesPool.filter(q => q.theme === state.selectedTheme);

      if (pool.length === 0) return state;

      let nextBatch: Omit<QuoteData, 'backgroundUrl'>[] = [];
      let newIndex = state.quoteIndex;

      // Pull strictly from the unseen portion of our quotes pool
      if (pool.length > state.quoteIndex) {
        nextBatch = pool.slice(state.quoteIndex, state.quoteIndex + 5);
        newIndex += nextBatch.length;
      }

      // If we are out of unseen quotes (e.g. API failed to fetch), we recycle smoothly
      if (nextBatch.length < 5) {
        const remainder = 5 - nextBatch.length;
        // Start recycling from index 0
        const recycledBatch = pool.slice(0, Math.min(remainder, pool.length));
        nextBatch = [...nextBatch, ...recycledBatch];
        newIndex = recycledBatch.length; // Wrap our index around to the start
      }

      // If somehow we STILL have nothing (e.g. allQuotes is completely empty), bail out
      if (nextBatch.length === 0) return state;

      // Ensure the very first quote of this batch doesn't accidentally mathematically match the last quote we just looked at
      if (state.quotes.length > 0 && state.quotes[state.quotes.length - 1].text === nextBatch[0].text && nextBatch.length > 1) {
        const first = nextBatch.shift()!;
        nextBatch.push(first);
      }

      const newQuotes = nextBatch.map(q => {
        const bgUrl = getRandomBackgroundUrl();

        // Preload the image in the background so it is ready before the user scrolls to it
        if (typeof window !== 'undefined') {
          const img = new window.Image();
          img.src = bgUrl;
        }

        return {
          ...q,
          backgroundUrl: bgUrl,
          id: crypto.randomUUID()
        };
      });

      return {
        ...state,
        quotes: [...state.quotes, ...newQuotes],
        quoteIndex: newIndex
      };
    }

    default:
      return state;
  }
}

function App() {
  const [state, dispatch] = useReducer(appReducer, undefined, initAppState);
  const observerTarget = useRef<HTMLDivElement>(null);
  const fetchFailures = useRef(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleScroll = useCallback(() => {
    if (!state.isAutoMode) return;
    setIsScrolling(true);
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
    }, 300);
  }, [state.isAutoMode]);

  const fetchZenQuotes = useCallback(async () => {
    if (state.isFetching || fetchFailures.current >= 3) return;
    dispatch({ type: 'FETCH_START' });
    try {
      // Use proxy to bypass strict CORS policy on zenquotes.io
      const targetUrl = 'https://zenquotes.io/api/quotes/';
      const res = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`);
      if (!res.ok) throw new Error('Failed to fetch API');

      const data: { q: string, a: string }[] = await res.json();

      if (!Array.isArray(data)) throw new Error('Invalid data format');

      const newQuotes = data.map((item, index) => ({
        id: `zen-${Date.now()}-${index}`,
        text: item.q,
        author: item.a
      }));

      fetchFailures.current = 0; // Reset failures on success
      dispatch({ type: 'FETCH_SUCCESS', payload: newQuotes });
    } catch (err) {
      console.warn('Could not fetch external quotes.', err);
      fetchFailures.current += 1; // Increment failures to prevent infinite loop
      dispatch({ type: 'FETCH_ERROR' });
    }
  }, [state.isFetching]);

  // Proactively fetch more if we're running low on unseen quotes
  useEffect(() => {
    const poolLength = state.selectedTheme === 'All'
      ? state.fetchedQuotes.length
      : state.localQuotesPool.filter(q => q.theme === state.selectedTheme).length;

    if (state.selectedTheme === 'All' && poolLength - state.quoteIndex <= 10 && !state.isFetching && state.initialFetchDone) {
      fetchZenQuotes();
    }
  }, [state.quoteIndex, state.fetchedQuotes.length, state.selectedTheme, state.isFetching, state.initialFetchDone, fetchZenQuotes, state.localQuotesPool]);

  // Initial fetch for the first external quotes
  useEffect(() => {
    fetchZenQuotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Initialize the very first batch only once we have a pool to draw from
  useEffect(() => {
    if (state.quotes.length === 0) {
      dispatch({ type: 'INITIALIZE' });
    }
  }, [state.quotes.length, state.fetchedQuotes.length, state.initialFetchDone, state.selectedTheme]);

  // IntersectionObserver for infinite scrolling
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        const target = entries.find(entry => entry.isIntersecting);
        if (target) {
          dispatch({ type: 'LOAD_MORE' });
        }
      },
      { rootMargin: '200% 0px', threshold: 0.01 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, []);

  // Auto-mode logic
  useEffect(() => {
    if (!state.isAutoMode || isScrolling) return;
    const interval = setInterval(() => {
      const container = document.querySelector('.app-container');
      if (container) {
        let delayScroll = 0;
        if (container.scrollTop + container.clientHeight >= container.scrollHeight - 100) {
          dispatch({ type: 'LOAD_MORE' });
          delayScroll = 150;
        }

        setTimeout(() => {
          container.scrollBy({ top: window.innerHeight, behavior: 'smooth' });
        }, delayScroll);
      }
    }, state.autoDuration * 1000);
    return () => clearInterval(interval);
  }, [state.isAutoMode, state.autoDuration, isScrolling]);

  // Screen Wake Lock API
  useEffect(() => {
    let wakeLock: any = null;

    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await (navigator as any).wakeLock.request('screen');
        }
      } catch (err) {
        console.warn('Could not acquire screen wake lock', err);
      }
    };

    const handleVisibilityChange = () => {
      if (wakeLock !== null && document.visibilityState === 'visible') {
        requestWakeLock();
      }
    };

    requestWakeLock();
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (wakeLock !== null) {
        wakeLock.release().catch(console.error);
        wakeLock = null;
      }
    };
  }, []);

  return (
    <main
      className={`app-container ${state.isUiHidden ? 'ui-hidden' : ''}`}
      onClick={() => {
        if (state.isUiHidden) {
          dispatch({ type: 'SET_UI_HIDDEN', payload: false });
        }
      }}
      onScroll={handleScroll}
    >
      <ThemeFilter
        selectedTheme={state.selectedTheme}
        onSelectTheme={(theme) => {
          dispatch({ type: 'SET_THEME', payload: theme });
          document.querySelector('.app-container')?.scrollTo(0, 0);
        }}
      />
      {state.quotes.map((quote) => (
        <section key={quote.id} className="feed-item">
          <QuoteCard quote={quote} />
        </section>
      ))}
      {/* 
        Anchor element to trigger IntersectionObserver.
        Given a very small height so it doesn't mess with scroll snapping, 
        but relying on the massive rootMargin above to trigger it early.
      */}
      <div
        ref={observerTarget}
        style={{ height: '1px', flexShrink: 0, pointerEvents: 'none' }}
      />

      <AutoModeToggle
        isAutoMode={state.isAutoMode}
        duration={state.autoDuration}
        isScrolling={isScrolling}
        onToggle={() => dispatch({ type: 'TOGGLE_AUTO_MODE' })}
        onSelectDuration={(duration) => dispatch({ type: 'SET_AUTO_DURATION', payload: duration })}
      />

      <AudioPlayer />

      <div className="hide-ui-container">
        <button
          className="hide-ui-btn"
          onClick={(e) => {
            e.stopPropagation();
            dispatch({ type: 'SET_UI_HIDDEN', payload: true });
          }}
          aria-label="Hide UI"
        >
          <EyeOff size={20} />
        </button>
      </div>
    </main>
  );
}

export default App;
