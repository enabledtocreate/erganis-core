import { WorkflowService } from './workflow.service';

describe('WorkflowService', () => {
  const definitions = {
    findByKey: jest.fn(),
    listForOrg: jest.fn(),
  };
  const instances = {
    create: jest.fn(),
    findById: jest.fn(),
    listActiveForOrg: jest.fn(),
    updateNode: jest.fn(),
    appendNodeLog: jest.fn(),
    closeNodeLog: jest.fn(),
    getNodeLog: jest.fn(),
  };
  const orgs = { findBySlug: jest.fn() };
  const service = new WorkflowService(
    definitions as never,
    instances as never,
    orgs as never,
  );

  const sampleDef = {
    workflowKey: 'build.drawing-approval',
    title: 'Drawing set approval',
    version: '1.0.0',
    definition: {
      workflowKey: 'build.drawing-approval',
      title: 'Drawing set approval',
      version: '1.0.0',
      nodes: [
        { nodeId: 'submit', title: 'Submit', trigger: 'build.drawing.submit' },
        { nodeId: 'review', title: 'Review' },
      ],
      edges: [{ from: 'submit', to: 'review' }],
    },
    orgId: null,
    createdAt: '2026-01-01',
    id: 'def-1',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('starts instance at first node', async () => {
    orgs.findBySlug.mockResolvedValue({ id: 'org-1', slug: 'acme' });
    definitions.findByKey.mockResolvedValue(sampleDef);
    instances.create.mockResolvedValue({
      id: 'inst-1',
      workflowKey: 'build.drawing-approval',
      orgId: 'org-1',
      entityPublicId: null,
      currentNodeId: 'submit',
      status: 'active',
      context: {},
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    });
    instances.findById.mockResolvedValue({
      id: 'inst-1',
      workflowKey: 'build.drawing-approval',
      orgId: 'org-1',
      entityPublicId: null,
      currentNodeId: 'submit',
      status: 'active',
      context: {},
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    });

    const result = await service.startInstance({
      orgSlug: 'acme',
      workflowKey: 'build.drawing-approval',
    });

    expect(instances.appendNodeLog).toHaveBeenCalledWith(
      expect.objectContaining({ nodeId: 'submit', title: 'Submit' }),
    );
    expect(result.instance.currentNodeTitle).toBe('Submit');
  });

  it('advances on matching operation.completed trigger', async () => {
    instances.listActiveForOrg.mockResolvedValue([
      {
        id: 'inst-1',
        workflowKey: 'build.drawing-approval',
        orgId: 'org-1',
        entityPublicId: null,
        currentNodeId: 'submit',
        status: 'active',
        context: {},
        createdAt: '',
        updatedAt: '',
      },
    ]);
    definitions.findByKey.mockResolvedValue(sampleDef);
    instances.findById
      .mockResolvedValueOnce({
        id: 'inst-1',
        workflowKey: 'build.drawing-approval',
        orgId: 'org-1',
        entityPublicId: null,
        currentNodeId: 'submit',
        status: 'active',
        context: {},
        createdAt: '',
        updatedAt: '',
      })
      .mockResolvedValueOnce({
        id: 'inst-1',
        workflowKey: 'build.drawing-approval',
        orgId: 'org-1',
        entityPublicId: null,
        currentNodeId: 'review',
        status: 'active',
        context: {},
        createdAt: '',
        updatedAt: '',
      });

    await service.handleOperationCompleted({
      orgId: 'org-1',
      outcome: 'success',
      surfaceId: 'build.drawing',
      action: 'submit',
    });

    expect(instances.closeNodeLog).toHaveBeenCalledWith('inst-1', 'submit');
    expect(instances.updateNode).toHaveBeenCalledWith(
      'inst-1',
      'review',
      'active',
      {},
    );
  });
});
