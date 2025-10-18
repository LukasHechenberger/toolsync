import { repoUrl } from '@/lib/helpers';
import Link from 'fumadocs-core/link';
import type { DocsPageProps } from 'fumadocs-ui/page';

export const basePageOptions = {
  tableOfContent: {
    style: 'clerk',
  },
} satisfies DocsPageProps;

export const BottomFooter = () => (
  <>
    <hr />
    <small>
      Found an issue? Have a suggestion?{' '}
      <Link className="font-semibold hover:underline" href={repoUrl('/issues/new/choose')}>
        Open an issue on GitHub repository ✨
      </Link>
      .
    </small>
  </>
);
