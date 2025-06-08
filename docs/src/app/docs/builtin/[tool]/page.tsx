import { DocsDescription, DocsPage, DocsTitle } from 'fumadocs-ui/page';
import tools from '@toolsync/builtin/tools.json';
import { notFound } from 'next/navigation';

export default async function BuiltinToolPage({ params }: { params: Promise<{ tool: string }> }) {
  const { tool: slug } = await params;
  const tool = tools.find((t) => t.name.endsWith(`/${slug}`));

  if (!tool) notFound();

  return (
    <DocsPage toc={[]} tableOfContent={{ style: 'clerk' }}>
      <DocsTitle>{tool.name}</DocsTitle>
      <DocsDescription>{tool.description}</DocsDescription>
    </DocsPage>
  );
}
