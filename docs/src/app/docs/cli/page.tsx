import { DocsBody, DocsDescription, DocsPage, DocsTitle } from 'fumadocs-ui/page';
import { promisify } from 'node:util';
import { exec as _exec } from 'node:child_process';
import { DynamicCodeBlock } from 'fumadocs-ui/components/dynamic-codeblock';

const exec = promisify(_exec);

export default async function CliPage() {
  const { stdout: usage } = await exec('toolsync --help', {
    env: { ...process.env, FORCE_COLOR: '1', LOG_LEVEL: 'silent' },
  });

  return (
    <DocsPage>
      <DocsTitle>Command Line Interface (CLI)</DocsTitle>
      <DocsDescription>How to use the Toolsync CLI.</DocsDescription>
      <DocsBody>
        <p>
          Run <code>toolsync --help</code> to see the available commands:
        </p>

        <DynamicCodeBlock lang="ansi" code={usage} />
      </DocsBody>
    </DocsPage>
  );
}
