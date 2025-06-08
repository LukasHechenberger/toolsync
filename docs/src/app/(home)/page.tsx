import { description } from '../../../../package.json';
import { Card, Cards } from 'fumadocs-ui/components/card';
import { DynamicCodeBlock } from 'fumadocs-ui/components/dynamic-codeblock';

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col container mx-auto justify-around text-center space-y-30">
      <div>
        <h1 className="mb-4 text-2xl font-bold">Toolsync</h1>
        <p className="text-fd-muted-foreground">{description}</p>
      </div>

      <div className="flex gap-4">
        <div className="flex-1 text-left">
          <DynamicCodeBlock
            lang="jsonc"
            code={`// toolsync.json\n\n${JSON.stringify(
              {
                '@toolsync/builtin/package-readme': {},
              },
              null,
              2,
            )}`}
          />
        </div>
        <div className="flex-1 prose text-left flex items-center">
          <ul>
            <li>Generates a readme for every package in your repository</li>
          </ul>
        </div>
      </div>

      <div>
        <p className="mb-4 text-small">Still interested? Let&apos;s get you set up! 🎉</p>
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
