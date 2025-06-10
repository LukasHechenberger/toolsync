'use client';

import tools from '@toolsync/builtin/tools.json';
import { Accordion, Accordions } from 'fumadocs-ui/components/accordion';
import { Card, Cards } from 'fumadocs-ui/components/card';
import { DynamicCodeBlock } from 'fumadocs-ui/components/dynamic-codeblock';
import { File, Files, Folder } from 'fumadocs-ui/components/files';
import { Tab, Tabs } from 'fumadocs-ui/components/tabs';
import { HelpCircleIcon } from 'lucide-react';
import { useMemo, useState } from 'react';

type FileTreeRoot = { type: 'root'; children: FileTreeNode[] };
type FileTreeNode =
  | { type: 'folder'; name: string; children: FileTreeNode[] }
  | { type: 'file'; name: string };

function FileTreeNode({ node }: { node: FileTreeNode }) {
  if (node.type === 'file') return <File name={node.name} />;

  return (
    <Folder defaultOpen name={node.name}>
      {node.children.map((child) => (
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

      currentNode.children.push({ type: 'file', name });
    }

    return result;
  }, [files]);

  return (
    <Files>
      {tree.children.map((child) => (
        <FileTreeNode key={child.name} node={child} />
      ))}
    </Files>
  );
}

const toolFiles: Record<string, string[]> = {
  // TODO: Get from plugin itself
  '@toolsync/builtin/github-actions': ['.github/workflows/ci.yml'],
  '@toolsync/builtin/prettier': ['.prettierrc.json'],
  '@toolsync/builtin/vscode': ['.vscode/settings.json', '.vscode/extensions.json'],
};

export function Preview() {
  const [enabledTools, setEnabledTools] = useState<string[]>(['@toolsync/builtin/prettier']);
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
    <div className="flex gap-4">
      <div className="flex-1 text-left">
        <p className="text-sm mb-4 text-fd-muted-foreground">Select tools to enable</p>

        <Cards>
          {tools.map((tool) => (
            <Card
              key={tool.name}
              className="has-checked:bg-fd-diff-add"
              title={
                <label className="text-sm flex gap-2 items-center" title={tool.description}>
                  <input
                    type="checkbox"
                    name={tool.name}
                    checked={enabledTools.some((t) => t === tool.name)}
                    onChange={handleChange}
                  />{' '}
                  {tool.slug}
                  <span className="text-fd-muted-foreground inline justify-end">
                    <HelpCircleIcon size="1.2em" />
                  </span>
                </label>
              }
            >
              <p className="text-xs">{tool.description}</p>
            </Card>
          ))}
        </Cards>
      </div>
      <div className="flex-1 prose text-left flex items-center">
        <Tabs className="flex-1" items={['Generated files', 'toolsync.json']}>
          <Tab>
            <FileTree files={generatedFiles} />
          </Tab>

          <Tab>
            {/* <ConfigFile components={getMDXComponents()} /> */}
            <DynamicCodeBlock lang="json" code={resultingConfig} />
          </Tab>
        </Tabs>
      </div>
    </div>
  );
}
