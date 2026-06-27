import {
  OperationContext,
  StepHandler,
  stepHandlerKey,
} from '@erganis/platform';
import { OrchestratorService } from './orchestrator.service';

describe('OrchestratorService', () => {
  const handler: StepHandler = jest.fn().mockResolvedValue({
    message: 'ok',
    data: { greetingPublicId: 'greeting_1' },
  });

  const loader = {
    getEnabledModules: jest.fn().mockReturnValue([
      {
        manifest: { id: 'erganis.hello-world' },
        operations: [
          {
            surfaceId: 'stub',
            action: 'save',
            stepId: 'hello-save',
            handler: 'pingSave',
            failureClass: 'required',
            phase: 'db',
          },
        ],
      },
    ]),
    getHandlers: jest.fn().mockReturnValue(
      new Map([[stepHandlerKey('erganis.hello-world', 'pingSave'), handler]]),
    ),
  };

  const orgs = {
    findBySlug: jest.fn().mockResolvedValue({
      id: 'org-1',
      publicId: 'org_1',
      slug: 'acme',
    }),
  };

  const users = {
    findById: jest.fn().mockResolvedValue({
      id: 'user-1',
      publicId: 'user_1',
    }),
  };

  const entityLock = {
    assertVersion: jest.fn().mockResolvedValue(undefined),
    acquireLock: jest.fn().mockResolvedValue(undefined),
    bumpVersion: jest.fn().mockResolvedValue(2),
    releaseLock: jest.fn().mockResolvedValue(undefined),
  };

  const unitOfWorkFactory = {
    runInTransaction: jest.fn(async (work) =>
      work({
        client: { query: jest.fn() },
        commit: jest.fn(),
        rollback: jest.fn(),
      }),
    ),
  };

  const database = {
    getPool: jest.fn().mockReturnValue({}),
  };

  let service: OrchestratorService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new OrchestratorService(
      database as never,
      loader as never,
      orgs as never,
      users as never,
      entityLock as never,
      { assertOperationAllowed: jest.fn() } as never,
      { recordOperation: jest.fn() } as never,
    );
    (service as unknown as { unitOfWorkFactory: unknown }).unitOfWorkFactory =
      unitOfWorkFactory;
  });

  it('executes required db steps in transaction', async () => {
    const result = await service.execute({
      envelope: {
        surfaceId: 'stub',
        action: 'save',
        orgSlug: 'acme',
        payload: { message: 'hi' },
      },
      userId: 'user-1',
      userPublicId: 'user_1',
    });

    expect(result.outcome).toBe('success');
    expect(unitOfWorkFactory.runInTransaction).toHaveBeenCalled();
    expect(handler).toHaveBeenCalled();
    expect(result.steps[0].status).toBe('success');
  });

  it('acquires entity lock when entityPublicId present on save', async () => {
    await service.execute({
      envelope: {
        surfaceId: 'stub',
        action: 'save',
        orgSlug: 'acme',
        entityPublicId: 'prod_abc',
        entityVersion: 1,
        payload: {},
      },
      userId: 'user-1',
      userPublicId: 'user_1',
    });

    expect(entityLock.acquireLock).toHaveBeenCalledWith(
      'org-1',
      'prod_abc',
      expect.any(String),
      'user-1',
    );
    expect(entityLock.bumpVersion).toHaveBeenCalled();
    expect(entityLock.releaseLock).toHaveBeenCalled();
  });

  it('returns partial when optional post_commit step fails', async () => {
    const optionalHandler: StepHandler = jest
      .fn()
      .mockRejectedValue(new Error('notify failed'));
    loader.getEnabledModules.mockReturnValue([
      {
        manifest: { id: 'erganis.hello-world' },
        operations: [
          {
            surfaceId: 'stub',
            action: 'save',
            stepId: 'hello-save',
            handler: 'pingSave',
            failureClass: 'required',
            phase: 'db',
          },
          {
            surfaceId: 'stub',
            action: 'save',
            stepId: 'notify',
            handler: 'notifyOptional',
            failureClass: 'optional',
            phase: 'post_commit',
          },
        ],
      },
    ]);
    loader.getHandlers.mockReturnValue(
      new Map([
        [stepHandlerKey('erganis.hello-world', 'pingSave'), handler],
        [stepHandlerKey('erganis.hello-world', 'notifyOptional'), optionalHandler],
      ]),
    );

    const result = await service.execute({
      envelope: {
        surfaceId: 'stub',
        action: 'save',
        orgSlug: 'acme',
        payload: {},
      },
      userId: 'user-1',
      userPublicId: 'user_1',
    });

    expect(result.outcome).toBe('partial');
    expect(result.steps[1].status).toBe('failed');
  });
});

