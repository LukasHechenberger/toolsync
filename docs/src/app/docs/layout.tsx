import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import type { ReactNode } from 'react';
import { baseOptions } from '@/app/layout.config';
import { source } from '@/lib/source';
import tools from '@toolsync/builtin/tools.json';
import { joinPathname } from '@/lib/helpers';

export default function Layout({ children }: { children: ReactNode }) {
  const pageTree = structuredClone(source.pageTree);

  // Insert builtin tools
  pageTree.children = pageTree.children.map((child) =>
    child.$id === 'builtin' && child.type === 'folder'
      ? {
          ...child,
          children: [
            ...child.children,
            ...tools.map((tool) => ({
              type: 'page' as const,
              url: joinPathname(tool.path, child.index!.url),
              name: tool.slug,
              description: tool.description,
              $id: tool.name,
            })),
          ],
        }
      : child,
  );

  return (
    <DocsLayout tree={pageTree} {...baseOptions}>
      {children}
    </DocsLayout>
  );
}
