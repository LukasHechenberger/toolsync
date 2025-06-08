import { DocsBody, DocsDescription, DocsPage, DocsTitle } from 'fumadocs-ui/page';
import tools from '@toolsync/builtin/tools.json';
import { notFound } from 'next/navigation';
import { basePageOptions, BottomFooter } from '../../page.config';

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

export default async function BuiltinToolPage({ params }: Props) {
  const { tool: slug } = await params;
  const tool = findTool(slug);

  return (
    <DocsPage toc={[]} {...basePageOptions}>
      <DocsTitle>{tool.name}</DocsTitle>
      <DocsDescription>{tool.description}</DocsDescription>
      <DocsBody>
        {/* TODO: Config types */}
        {/* <pre>{JSON.stringify(tool, null, 2)}</pre> */}
      </DocsBody>

      <BottomFooter />
    </DocsPage>
  );
}
