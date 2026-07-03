/** Core platform job queue names (pg-boss). */
export const PLATFORM_JOBS = {
  searchTouch: 'platform.search.touch',
  searchIndex: 'platform.search.index',
  codesSync: 'platform.codes.sync',
} as const;
