// Backend Node do contrato C3 (spec/v0), com a mesma semântica do c3-engine em Rust: o sistema entrega o banco
// (um `Store`), os JSONs da spec e os hooks; o pacote entrega `/_meta`, o CRUD, as condições, as ações e os erros.

export { type EngineOptions, BuildError, buildEngine } from './app/build';
export { Engine } from './app/engine';
export { Bell } from './app/bell';
export { type Change, Live, type LiveEvent } from './app/live';
export { ApiError, FieldErrors, type FieldError } from './domain/errors';
export type { Clock } from './domain/relative-date';
export type { FieldType, Rec, Scope, SqlValue } from './domain/types';
export { handle } from './http/handle';
export { type ListenerOptions, MAX_BODY, engineListener } from './http/node-http';
export * from './ports/hooks';
export type { Notification, NotificationList, Notifications } from './ports/notifications';
export type { EngineRequest, EngineResponse } from './ports/request';
export { type Conn, type Executed, type Row, type Store, StoreError, type StoreErrorKind, type Tx, inTx } from './ports/store';
