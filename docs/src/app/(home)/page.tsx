import Link from 'next/link';
import { description } from '../../../../package.json';
import { Card, Cards } from 'fumadocs-ui/components/card';

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col container mx-auto justify-center text-center">
      <h1 className="mb-4 text-2xl font-bold">Toolsync</h1>
      <p className="mb-14 text-fd-muted-foreground">{description}</p>

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
    </main>
  );
}
