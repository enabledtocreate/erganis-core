import { StructuredExceptionFilter } from './structured-exception.filter';
import { ArgumentsHost, HttpException, NotFoundException } from '@nestjs/common';

describe('StructuredExceptionFilter', () => {
  const filter = new StructuredExceptionFilter();
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  const host = {
    switchToHttp: () => ({
      getResponse: () => ({ status }),
      getRequest: () => ({ method: 'GET', url: '/test' }),
    }),
  } as unknown as ArgumentsHost;

  beforeEach(() => {
    json.mockClear();
    status.mockClear();
  });

  it('maps HttpException with code to structured error', () => {
    filter.catch(
      new NotFoundException({ code: 'NOT_FOUND', message: 'Missing' }),
      host,
    );
    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({ code: 'NOT_FOUND', message: 'Missing' }),
      }),
    );
  });

  it('maps generic errors to INTERNAL_ERROR', () => {
    filter.catch(new Error('boom'), host);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({ code: 'INTERNAL_ERROR', recoverable: false }),
      }),
    );
  });
});
