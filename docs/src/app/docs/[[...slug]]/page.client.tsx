'use client';

import { useEffect, useState } from 'react';
import { cn } from 'fumadocs-ui/utils/cn';
import { CircleArrowUpIcon } from 'lucide-react';

export function ScrollToTop() {
  const [scrollTop, setScrollTop] = useState(0);
  useEffect(() => {
    const handleScroll = () => {
      setScrollTop(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const visible = scrollTop >= 100;

  return (
    <button
      className={cn(
        'flex gap-2 items-center text-sm mx-2 text-fd-muted-foreground opacity-0 transition-opacity',
        visible && 'opacity-100',
      )}
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
    >
      <CircleArrowUpIcon size="1em" /> <span>Scroll to top</span>
    </button>
  );
}
