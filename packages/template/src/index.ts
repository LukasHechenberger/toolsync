import { readFile, writeFile } from 'fs/promises';

export type TemplateOptions = {
  /** Path to the template file */
  path: string;
  /** Markers for the beginning and end of a section @default ['#region', '#endregion'] */
  markers: [string, string];

  /** Delimiters for a single line comment. Must match the file's syntax */
  commentPattern: { start: string; end?: string };

  /** A message to be added as a comment to inform users that the section is generated */
  notice: string;

  /** Content of the template file */
  content: string;
};

export type TemplateUpdateOptions = {
  /** Name of the section to update */
  section: string;

  /** Content that should be inserted into the section */
  content: string;

  /** Where to insert the section, if the file does not contain it already. If you don't use this option {@link Template.update} will throw if the section does not exist */
  insert?: 'top' | 'bottom';

  /** A message to be added as a comment to inform users that the section is generated */
  notice?: string;
};

type NullableIfEmptyParameters<T> = {} extends T ? [T] : [T | undefined];

type RemainingOptions<T extends typeof Template> = Omit<
  TemplateOptions,
  keyof T['defaultOptions'] | 'content' | 'path'
> & {
  [K in keyof T['defaultOptions']]?: K extends keyof TemplateOptions ? TemplateOptions[K] : never;
};

type RemainingOptionsArg<T extends typeof Template> =
  {} extends RemainingOptions<T> ? [options?: RemainingOptions<T>] : [options: RemainingOptions<T>];

/** A basic template class. Can be used to update or create sections */
export class Template {
  // #region Conventince methods

  static get defaultOptions() {
    return {
      markers: ['#region', '#endregion'],
      notice: 'This section is generated. Do not edit manually!',
    };
  }

  /** Loads a template from a file */
  static async load<T extends typeof Template>(
    this: T,
    path: string,
    ...args: RemainingOptionsArg<T>
  ) {
    const options = args[0] ?? ({} as RemainingOptions<T>);
    const content = await readFile(path, 'utf8').catch((error) => {
      if (error.code === 'ENOENT') return '';

      throw error;
    });

    return new this({
      ...this.defaultOptions,
      ...options,
      path,
      content,
    } as unknown as TemplateOptions) as InstanceType<T>;
  }

  static async update<T extends typeof Template>(
    this: T,
    path: string,
    options: RemainingOptions<T> & TemplateUpdateOptions,
  ) {
    const instance = await this.load(path, options);
    instance.update(options);
    await instance.save();

    return instance;
  }

  // #region Actual methods

  constructor(protected options: TemplateOptions) {}

  private comment(content: string) {
    const { start, end } = this.options.commentPattern;
    return `${start} ${content} ${end ?? ''}`.trim();
  }

  /** Replaces a section in the template */
  update({
    section: sectionName,
    content,
    insert,
    notice = this.options.notice,
  }: TemplateUpdateOptions) {
    const markerComments = this.options.markers.map((marker) =>
      this.comment(`${marker} ${sectionName}`),
    );
    const regExp = new RegExp(markerComments.join('[^]*'), 'm');
    const replacement = [
      `${markerComments[0]}\n${this.comment(notice)}`,
      content.trim(),
      markerComments[1],
    ].join('\n\n');

    if (!this.options.content.match(regExp)) {
      // console.warn(`Section "${sectionName}" not found in ${readmePath}. Adding it.`);
      if (insert === 'top') {
        this.options.content = [...markerComments, this.options.content.trim()].join('\n\n');
      } else if (insert === 'bottom') {
        this.options.content = [this.options.content.trim(), ...markerComments].join('\n\n');
      } else {
        throw new Error(
          `Section "${sectionName}" not found - add it or use "insert" option for appending/prepending it automatically.`,
        );
      }
    }

    this.options.content = `${this.options.content.replace(regExp, replacement).trim()}\n`;
  }

  /** Saves the template to a file (or it's source) */
  async save(to?: string) {
    await writeFile(to ?? this.options.path, this.options.content, 'utf8');
  }
}

/** A template, preconfigured to use Markdown/HTML comments */
export class MarkdownTemplate extends Template {
  static get defaultOptions() {
    return {
      ...super.defaultOptions,
      commentPattern: { start: '<!--', end: '-->' },
    };
  }
}

/** A template, preconfigured to use Markdown/HTML comments */
export class JsTemplate extends Template {
  static get defaultOptions() {
    return {
      ...super.defaultOptions,
      commentPattern: { start: '//' },
    };
  }
}

type T = RemainingOptions<typeof Template>;
type T2 = RemainingOptions<typeof MarkdownTemplate>;
