import { description } from '../../../../package.json';
import { Card, Cards } from 'fumadocs-ui/components/card';
import { compileMDX } from '@fumadocs/mdx-remote';
import { getMDXComponents } from '@/mdx-components';

export default async function HomePage() {
  const { body: InstallCommand } = await compileMDX({
    source: `\`\`\`shell title="TL;DR"
pnpm create @toolsync
\`\`\``,
  });

  const { body: ConfigFile } = await compileMDX({
    source: `\`\`\`jsonc title="toolsync.json"
${JSON.stringify(
  {
    '@toolsync/builtin/package-readme': {},
  },
  null,
  2,
)}
\`\`\``,
  });

  return (
    <main className="flex flex-1 flex-col container mx-auto justify-around space-y-30">
      <div className="min-h-[300px] flex flex-col items-center justify-center space-y-4">
        <h1 className="mb-4 text-2xl font-bold">Toolsync</h1>
        <p className="text-fd-muted-foreground">{description}</p>

        <div className="text-left">
          <InstallCommand components={getMDXComponents()} />
        </div>
      </div>

      <div className="flex gap-4">
        <div className="flex-1 text-left">
          <ConfigFile components={getMDXComponents()} />
        </div>
        <div className="flex-1 prose text-left flex items-center">
          <ul>
            <li>Generates a readme for every package in your repository</li>
          </ul>
        </div>
      </div>

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
