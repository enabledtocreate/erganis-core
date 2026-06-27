import { ForbiddenException } from '@nestjs/common';
import { ModuleAccessService } from './module-access.service';

describe('ModuleAccessService', () => {
  const orgModules = {
    isModuleEnabled: jest.fn(),
    isOperationDisabled: jest.fn(),
  };

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
  };

  let service: ModuleAccessService;

  beforeEach(() => {
    jest.clearAllMocks();
    orgModules.isModuleEnabled.mockResolvedValue(true);
    orgModules.isOperationDisabled.mockResolvedValue(false);
    service = new ModuleAccessService(orgModules as never, loader as never);
  });

  it('throws MODULE_DISABLED when module disabled for org', async () => {
    orgModules.isModuleEnabled.mockResolvedValue(false);
    await expect(
      service.assertOperationAllowed('org-1', 'stub', 'save'),
    ).rejects.toMatchObject({
      response: expect.objectContaining({ code: 'MODULE_DISABLED' }),
    });
  });

  it('throws OPERATION_DISABLED when step disabled', async () => {
    orgModules.isOperationDisabled.mockResolvedValue(true);
    await expect(
      service.assertOperationAllowed('org-1', 'stub', 'save'),
    ).rejects.toThrow(ForbiddenException);
  });
});
