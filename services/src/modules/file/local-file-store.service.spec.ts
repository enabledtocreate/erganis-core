import { LocalFileStoreService } from './local-file-store.service';

describe('LocalFileStoreService', () => {
  it('throws when ERGANIS_DATA_ROOT unset', () => {
    const service = new LocalFileStoreService({
      get: jest.fn().mockReturnValue(''),
    } as never);
    expect(() => service['root']()).toThrow('ERGANIS_DATA_ROOT');
  });
});
