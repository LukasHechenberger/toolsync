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
      Found an issue? Have a suggestion? Open an issue on our{' '}
      <Link className="font-semibold hover:underline" href={repoUrl('/issues')}>
        GitHub repository
      </Link>
      .
    </small>
  </>
);
