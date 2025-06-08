import { DocsBody, DocsDescription, DocsPage, DocsTitle } from 'fumadocs-ui/page';
import tools from '@toolsync/builtin/tools.json';
import { notFound } from 'next/navigation';
import { basePageOptions, BottomFooter } from '../../page.config';
import { AutoTypeTable } from 'fumadocs-typescript/ui';
import { createGenerator } from 'fumadocs-typescript';
import { DynamicCodeBlock } from 'fumadocs-ui/components/dynamic-codeblock';
import Link from 'next/link';

type Props = { params: Promise<{ tool: string }> };

const findTool = (slug: string) => {
  const tool = tools.find((t) => t.slug === slug);
  if (!tool) notFound();

  return tool;
};

export async function generateStaticParams() {
  return tools.map((tool) => ({
    tool: tool.slug,
  }));
}

export async function generateMetadata({ params }: Props) {
  const { tool: slug } = await params;
  const tool = findTool(slug);

  return {
    title: tool.name,
    description: tool.description,
  };
}

const generator = createGenerator();

export default async function BuiltinToolPage({ params }: Props) {
  const { tool: slug } = await params;
  const tool = findTool(slug);

  return (
    <DocsPage toc={[]} {...basePageOptions}>
      <DocsTitle>{tool.name}</DocsTitle>
      <DocsDescription>{tool.description}</DocsDescription>
      <DocsBody>
        <h2>Installation</h2>

        <p>
          If you haven&apos;t already,{' '}
          <Link href="/docs/builtin#installation">
            install the <code>@toolsync/builtin`</code> package
          </Link>
        </p>

        <p>
          Configure this tool like any other inside your <code>toolsync.json</code> file:
        </p>

        <DynamicCodeBlock
          lang="jsonc"
          code={JSON.stringify({ [tool.name]: {} }, null, 2).replace(
            '{}',
            '{ /* Your config here */ }',
          )}
        />

        <h2>Available options:</h2>

        <AutoTypeTable
          generator={generator}
          path={`./node_modules/@toolsync/builtin/out/${tool.slug}/index.d.ts`}
          type={`Toolsync.ConfigMap['${tool.name}']`}
        />
      </DocsBody>

      <BottomFooter />
    </DocsPage>
  );
}
