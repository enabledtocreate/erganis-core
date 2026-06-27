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
});
