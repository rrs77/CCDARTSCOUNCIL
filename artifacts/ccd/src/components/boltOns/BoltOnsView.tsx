import React, { useEffect } from 'react';
import type { BoltOnsPageId } from './types';
import { syncBoltOnsUrl } from './routes';
import { BoltOnsBreadcrumb, BoltOnsSwitcher } from './shared';
import { BoltOnsCatalogue } from './BoltOnsCatalogue';
import { AssessifyPage } from './AssessifyPage';
import { PeriFeedbackPage } from './PeriFeedbackPage';

const TITLES: Record<BoltOnsPageId, string> = {
  'bolt-ons': '+ Bolt-ons',
  assessify: 'Assessify',
  perifeedback: 'PeriFeedback',
};

interface Props {
  page: BoltOnsPageId;
  onNavigate: (page: BoltOnsPageId) => void;
}

export function BoltOnsView({ page, onNavigate }: Props) {
  useEffect(() => {
    syncBoltOnsUrl(page);
    const previous = document.title;
    document.title = `CCDesigner · ${TITLES[page]}`;
    return () => {
      document.title = previous;
    };
  }, [page]);

  return (
    <div className="ccd-fade-in-up">
      <BoltOnsBreadcrumb
        pageLabel={TITLES[page]}
        onCatalogue={page === 'bolt-ons' ? undefined : () => onNavigate('bolt-ons')}
      />
      <div className="mb-6">
        <BoltOnsSwitcher active={page} onNavigate={onNavigate} />
      </div>
      {page === 'bolt-ons' ? <BoltOnsCatalogue onNavigate={onNavigate} /> : null}
      {page === 'assessify' ? <AssessifyPage /> : null}
      {page === 'perifeedback' ? <PeriFeedbackPage /> : null}
    </div>
  );
}

export type { BoltOnsPageId };
