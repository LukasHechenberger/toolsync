import { compileMDX } from '@fumadocs/mdx-remote';
import { promisify } from 'node:util';
import { exec as _exec } from 'node:child_process';
import { CodeBlock, Pre } from 'fumadocs-ui/components/codeblock';

const exec = promisify(_exec);

export async function CommandOutput({ command }: { command: string }) {
  const { stdout: output } = await exec(command, {
    env: { ...process.env, FORCE_COLOR: '1', LOG_LEVEL: 'silent' },
  });

  const { body: Output } = await compileMDX({ source: `\`\`\`ansi\n${output}\n\`\`\`` });

  return (
    <CodeBlock>
      <Pre>
        <Output />
      </Pre>
    </CodeBlock>
  );
}
