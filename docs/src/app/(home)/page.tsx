import { description } from '../../../../package.json';
import { Card, Cards } from 'fumadocs-ui/components/card';
import { compileMDX } from '@fumadocs/mdx-remote';
import { getMDXComponents } from '@/mdx-components';
import { Tab, Tabs } from 'fumadocs-ui/components/tabs';
import { File, Files } from 'fumadocs-ui/components/files';
import { Preview } from './page.client';

export default async function HomePage() {
  const { body: InstallCommand } = await compileMDX({
    source: `\`\`\`shell title="TL;DR"
pnpm create @toolsync
\`\`\``,
  });

  const { body: ConfigFile } = await compileMDX({
    source: `\`\`\`json
${JSON.stringify(
  {
    '@toolsync/builtin/prettier': {},
  },
  null,
  2,
)}
\`\`\``,
  });

  return (
    <main className="flex flex-1 flex-col container mx-auto space-y-30">
      <div className="min-h-[300px] flex flex-col items-center justify-center space-y-4">
        <h1 className="mb-4 text-2xl font-bold">Toolsync</h1>
        <p className="text-fd-muted-foreground">{description}</p>

        <div className="text-left">
          <InstallCommand components={getMDXComponents()} />
        </div>
      </div>

      <Preview />

      <div>
        <p className="mb-4 text-sm text-center">Still interested? Let&apos;s get you set up! 🎉</p>
        <Cards>
          <Card
            title="Get started"
            href="/docs"
            description="Learn how to get started with Toolsync."
          />
          <Card
            title="Built-in tools"
            description="Explore the built-in tools available in Toolsync."
            href="/docs/builtin"
          />
        </Cards>
      </div>
    </main>
  );
}
