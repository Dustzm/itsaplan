import type { ReactNode } from 'react';
import { useGodSectionText } from '@/hooks/useSectionLabels';
import SectionPageView from '@/components/common/page/SectionPageView';

// The chrome shared by every god section page: title and description taken from the
// section entry. The directory pages pass a `widthClassName` that spans the whole
// shell, because their tables are wide.
export default function GodSectionPage({
  slug,
  actions,
  widthClassName,
  children,
}: {
  slug: string;
  actions?: ReactNode;
  widthClassName?: string;
  children: ReactNode;
}) {
  const section = useGodSectionText().section(slug);
  return (
    <SectionPageView
      title={section.label}
      description={section.description}
      widthClassName={widthClassName}
      actions={actions}
    >
      {children}
    </SectionPageView>
  );
}
