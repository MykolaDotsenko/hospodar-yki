/** Shared JSON protocol for the Web IndexedDB repository and Android Room plugin. */
export type ExamCommitKind = "start"|"answer"|"navigate"|"finish"|"legacy-import";
export type ExamAnswerMap = Record<string,string>;
export interface ExamSessionV1 {
  version: 1;
  blueprintId: string;
  startedAt: string;
  finishedAt: string|null;
  index: number;
  answers: ExamAnswerMap;
  voiceRecorded: Record<string,boolean>;
  [extra: string]: unknown;
}
export interface ExamCommitCommand {
  protocol: 1;
  eventId: string;
  expectedRevision: number;
  kind: ExamCommitKind;
  session: ExamSessionV1;
}
export interface ExamCommitResult {
  applied: boolean;
  revision: number;
  session: ExamSessionV1;
}
export interface SavedExam {
  key: "current";
  revision: number;
  session: ExamSessionV1;
}
export interface ExamRepository {
  readCurrent(): Promise<SavedExam|null>;
  commit(command: ExamCommitCommand): Promise<ExamCommitResult>;
  deleteLocal(): Promise<void>;
  close(): Promise<void>;
}
export interface AndroidExamStoreBridge {
  readAttempt(args: {key: "current"}): Promise<SavedExam|null>;
  commitAttempt(args: ExamCommitCommand & {key: "current"}): Promise<ExamCommitResult>;
  deleteAttempt(args: {key: "current"}): Promise<void>;
}
export const EXAM_DB_NAME: string;
export const EXAM_RECORD_KEY: "current";
export const EXAM_COMMIT_PROTOCOL: 1;
export class PersistenceError extends Error {
  code: string;
  constructor(code: string, message: string);
}
export function assertCommit(command: unknown): ExamCommitCommand;
export function newCommit(session: ExamSessionV1,expectedRevision:number,kind:ExamCommitKind,uuid?:string):ExamCommitCommand;
export function createMemoryExamRepository(options?:{failWrite?:(cmd:ExamCommitCommand)=>boolean}):ExamRepository;
export function createIndexedDbExamRepository(options?:{indexedDB?:IDBFactory,dbName?:string}):ExamRepository;
export function createAndroidExamRepository(nativeBridge: AndroidExamStoreBridge):ExamRepository;
