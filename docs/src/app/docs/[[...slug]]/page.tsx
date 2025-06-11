import { source } from '@/lib/source';
import { DocsPage, DocsBody, DocsDescription, DocsTitle } from 'fumadocs-ui/page';
import { notFound } from 'next/navigation';
import { createRelativeLink } from 'fumadocs-ui/mdx';
import { getMDXComponents } from '@/mdx-components';
import { basePageOptions, BottomFooter } from '../page.config';
import { repoFileUrl } from '@/lib/helpers';
import Link from 'next/link';
import { ScrollToTop } from './page.client';

export default async function Page(props: { params: Promise<{ slug?: string[] }> }) {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  const MDXContent = page.data.body;

  return (
    <DocsPage
      toc={page.data.toc}
      full={page.data.full}
      {...basePageOptions}
      tableOfContent={{
        ...basePageOptions.tableOfContent,
        footer: (
          <>
            <hr className="my-2" />

            <Link
              className="text-sm mx-2 mb-2 text-fd-muted-foreground flex gap-2 items-center"
              href={repoFileUrl(`/docs/content/docs/${page.file.path}`)}
              target="_blank"
            >
              Edit this page on GitHub
            </Link>
            <ScrollToTop />

            <div className="flex-1"></div>

            <p className="text-sm p-2 pt-0 text-fd-muted-foreground">
              Last modified: {new Date(page.data.lastModified!).toISOString().split('T')[0]}
            </p>
          </>
        ),
      }}
    >
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription className="mb-0">{page.data.description}</DocsDescription>

      <hr />

      <DocsBody>
        <MDXContent
          components={getMDXComponents({
            // this allows you to link to other pages with relative file paths
            a: createRelativeLink(source, page),
          })}
        />
      </DocsBody>
      <BottomFooter />
    </DocsPage>
  );
}

export async function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata(props: { params: Promise<{ slug?: string[] }> }) {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  return {
    title: page.data.title,
    description: page.data.description,
  };
}
