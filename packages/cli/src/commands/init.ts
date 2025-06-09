import type { Command } from 'commander';

export function setupInitCommand(command: Command) {
  return command.option('--yes,-y', 'accept all default options').action(() => {
    console.log('INITIALIZING');
  });
}
