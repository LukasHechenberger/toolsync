#! /usr/bin/env node

import { Command } from 'commander';
import { name, version, homepage } from '../package.json';
import { MarkdownTemplate } from '.';

const program = new Command();

program
  .name(`npx ${name}`)
  .description('Update a section of a file with ' + name)
  .addHelpText('after', `\nFor more information, visit ${homepage}`)
  .version(version)
  .argument('<file>', 'file to update (only .md files are supported)')
  .argument('<section>', 'section to update')
  .argument('<content>', 'content to insert into the section')
  .option('--notice <text>', 'notice to add to the section', undefined)
  .option('--insert <top|bottom>', 'where to insert the section if it does not exist', 'bottom')
  .action(async (file, section, content, options) => {
    const template = await MarkdownTemplate.load(file, {
      ...(options.notice ? { notice: options.notice } : {}),
    });

    template.update({
      section: section,
      content,
      insert: options.insert,
    });

    await template.save();
  });

program.parse(process.argv);
