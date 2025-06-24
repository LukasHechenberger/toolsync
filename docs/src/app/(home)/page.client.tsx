'use client';

import tools from '@toolsync/builtin/tools.json';
import { DynamicCodeBlock } from 'fumadocs-ui/components/dynamic-codeblock';
import { File, Files, Folder } from 'fumadocs-ui/components/files';
import { Tab, Tabs } from 'fumadocs-ui/components/tabs';
import { useMemo, useState } from 'react';

type FileTreeRoot = { type: 'root'; children: FileTreeNode[] };
type FileTreeNode =
  | { type: 'folder'; name: string; children: FileTreeNode[] }
  | { type: 'file'; name: string };

function FileTreeNode({ node }: { node: FileTreeNode }) {
  if (node.type === 'file') return <File name={node.name} />;

  return (
    <Folder defaultOpen name={node.name}>
      {node.children
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((child) => (
          <FileTreeNode key={child.name} node={child} />
        ))}
    </Folder>
  );
}

function FileTree({ files }: { files: string[] }) {
  const tree = useMemo<FileTreeRoot>(() => {
    const result = { type: 'root', children: [] } satisfies FileTreeRoot;

    for (const file of files) {
      const parts = file.split('/');
      const path = parts.slice(0, -1);
      const name = parts[parts.length - 1];

      let currentNode = result as FileTreeRoot | (FileTreeNode & { type: 'folder' });

      for (const part of path) {
        const existingNode = currentNode.children.find(
          (n) => n.type === 'folder' && n.name === part,
        );

        if (existingNode) {
          currentNode = existingNode as FileTreeNode & { type: 'folder' };
        } else {
          const newNode = { type: 'folder', name: part, children: [] } satisfies FileTreeNode;

          currentNode.children.push(newNode);
          currentNode = newNode;
        }
      }

      // Skip if file already exists
      if (currentNode.children.some((n) => n.type === 'file' && n.name === name)) continue;

      currentNode.children.push({ type: 'file', name });
    }

    return result;
  }, [files]);

  return (
    <Files>
      {tree.children
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((child) => (
          <FileTreeNode key={child.name} node={child} />
        ))}
    </Files>
  );
}

const eachPackage = (path: string) => ['a', 'b'].map((p) => `packages/${p}/${path}`);
const toolFiles: Record<string, string[]> = {
  // TODO: Get from plugin itself
  '@toolsync/builtin/github-actions': ['.github/workflows/ci.yml'],
  '@toolsync/builtin/ignore-sync': ['package.json'],
  '@toolsync/builtin/prettier': ['.prettierrc.json'],
  '@toolsync/builtin/vscode': ['.vscode/settings.json', '.vscode/extensions.json'],
  '@toolsync/builtin/package-meta': ['package.json', ...eachPackage('package.json')],
  '@toolsync/builtin/package-readme': ['README.md', ...eachPackage('README.md')],
  '@toolsync/builtin/turbo': ['turbo.json'],
};

export function Preview() {
  const [enabledTools, setEnabledTools] = useState<string[]>([
    '@toolsync/builtin/prettier',
    '@toolsync/builtin/package-readme',
    '@toolsync/builtin/github-actions',
  ]);
  const resultingConfig = useMemo(
    () => JSON.stringify(Object.fromEntries(enabledTools.map((tool) => [tool, {}])), null, 2),
    [enabledTools],
  );
  const generatedFiles = useMemo(() => {
    const files: string[] = [];

    for (const tool of tools) {
      if (enabledTools.includes(tool.name)) {
        if (toolFiles[tool.name]) {
          files.push(...toolFiles[tool.name]);
        }
      }
    }

    return files;
  }, [enabledTools]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = event.target;
    event.stopPropagation();
    setEnabledTools((prev) =>
      tools.flatMap((tool) => {
        if (tool.name === name) return checked ? [tool.name] : [];

        return prev.includes(tool.name) ? [tool.name] : [];
      }),
    );
  };

  return (
    <div className="flex gap-4 flex-wrap">
      <div className="flex-1">
        <Tabs items={['Select tools']} className="!m-0">
          <Tab className=" h-[300px] overflow-auto">
            <div className="bg-fd-card border rounded-md overflow-hidden">
              {tools.map((tool) => (
                <label
                  key={tool.name}
                  className="text-sm flex gap-2 has-checked:bg-fd-diff-add px-4 py-2 items-center justify-between"
                  title={tool.description}
                >
                  <input
                    type="checkbox"
                    name={tool.name}
                    checked={enabledTools.some((t) => t === tool.name)}
                    onChange={handleChange}
                  />{' '}
                  <p className="font-semibold">{tool.slug}</p>
                  <div className="flex-1" />
                  <p className="text-right text-xs text-fd-muted-foreground truncate">
                    {tool.description}
                  </p>
                </label>
              ))}
            </div>
          </Tab>
        </Tabs>
      </div>

      <div className="flex-1">
        <Tabs className="flex-1 !m-0" items={['Generated files', 'toolsync.json']}>
          <Tab className="flex-1 max-h-[300px] overflow-auto">
            {generatedFiles.length === 0 ? (
              <p className="text-sm text-fd-muted-foreground">👈 Enable some tools</p>
            ) : (
              <FileTree files={generatedFiles} />
            )}
          </Tab>

          <Tab>
            <DynamicCodeBlock lang="json" code={resultingConfig} />
          </Tab>
        </Tabs>
      </div>
    </div>
  );
}
