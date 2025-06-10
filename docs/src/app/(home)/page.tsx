import { description } from '../../../../package.json';
import { Card, Cards } from 'fumadocs-ui/components/card';
import { compileMDX } from '@fumadocs/mdx-remote';
import { getMDXComponents } from '@/mdx-components';
import { Preview } from './page.client';

export default async function HomePage() {
  const { body: InstallCommand } = await compileMDX({
    source: `\`\`\`shell title="TL;DR"
pnpm create @toolsync
\`\`\``,
  });

  return (
    <main className="flex flex-1 flex-col container mx-auto gap-12 py-8">
      <div className="py-12 flex flex-col items-center justify-center space-y-4">
        <h1 className="mb-4 text-2xl font-bold">Toolsync</h1>
        <p className="text-fd-muted-foreground">{description}</p>

        <div className="text-left">
          <InstallCommand components={getMDXComponents()} />
        </div>
      </div>

      <div>
        <h2 className="font-semibold text-xl mb-2">Remove boilerplate</h2>
        <p className="mb-4 text-fd-muted-foreground">
          See how toolsync can generate your config files
        </p>

        <Preview />
      </div>

      <div>
        <h2 className="font-semibold text-xl mb-2">Still interested?</h2>
        <p className="mb-4 text-fd-muted-foreground">Let&apos;s get you set up! 🎉</p>

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
