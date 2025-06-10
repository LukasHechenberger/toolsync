import type { ReactNode } from 'react';
import { HomeLayout } from 'fumadocs-ui/layouts/home';
import { baseOptions } from '@/app/layout.config';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <HomeLayout
      {...baseOptions}
      links={[
        // Link to getting started page
        { text: 'Docs', url: '/docs' },
      ]}
    >
      {children}
    </HomeLayout>
  );
}
