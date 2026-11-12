// Suítes por recurso (um arquivo cada), na ordem em que rodam. Todas recebem o mesmo contexto e usam o que
// precisam: test, call, as (usuário e filial), tag (sufixo único da rodada) e nextNumber.

import { checklistTests } from './suite-checklist.mjs';
import { childrenTests } from './suite-children.mjs';
import { documentTests } from './suite-document.mjs';
import { enumTests } from './suite-enum.mjs';
import { fileTests } from './suite-file.mjs';
import { fileFieldTests } from './suite-file-field.mjs';
import { flagsTests } from './suite-flags.mjs';
import { formTests } from './suite-form.mjs';
import { writeOnlyTests } from './suite-write-only.mjs';
import { lockedTests } from './suite-locked.mjs';
import { lookupTests } from './suite-lookup.mjs';
import { refFilterTests } from './suite-ref-filter.mjs';
import { listActionTests } from './suite-list-action.mjs';
import { accessTests } from './suite-access.mjs';
import { viewsTests } from './suite-views.mjs';
import { loginTests } from './suite-login.mjs';
import { aggregateTests } from './suite-aggregate.mjs';
import { relativeDateTests } from './suite-relative-date.mjs';
import { singletonTests } from './suite-singleton.mjs';
import { gridTests } from './suite-grid.mjs';
import { actionReplyTests } from './suite-action-reply.mjs';
import { previewTests } from './suite-preview.mjs';
import { selectionTests } from './suite-selection.mjs';
import { togetherTests } from './suite-together.mjs';
import { pagesTests } from './suite-pages.mjs';
import { sourceTests } from './suite-source.mjs';
import { liveTests } from './suite-live.mjs';
import { chatTests } from './suite-chat.mjs';
import { notificationsTests } from './suite-notifications.mjs';
import { searchTests } from './suite-search.mjs';
import { storeTests } from './suite-store.mjs';

export function featureTests(ctx) {
  formTests(ctx);
  enumTests(ctx);
  childrenTests(ctx);
  writeOnlyTests(ctx);
  documentTests(ctx);
  flagsTests(ctx);
  checklistTests(ctx);
  lockedTests(ctx);
  fileTests(ctx);
  fileFieldTests(ctx);
  lookupTests(ctx);
  refFilterTests(ctx);
  listActionTests(ctx);
  accessTests(ctx);
  viewsTests(ctx);
  loginTests(ctx);
  aggregateTests(ctx);
  relativeDateTests(ctx);
  singletonTests(ctx);
  sourceTests(ctx);
  gridTests(ctx);
  actionReplyTests(ctx);
  previewTests(ctx);
  selectionTests(ctx);
  togetherTests(ctx);
  pagesTests(ctx);
  storeTests(ctx);
  liveTests(ctx);
  notificationsTests(ctx);
  chatTests(ctx);
  searchTests(ctx);
}
