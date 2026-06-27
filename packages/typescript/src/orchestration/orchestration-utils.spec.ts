import {
  createOperationId,
  computeOutcome,
  resolveStepsForOperation,
} from './orchestration-utils';
import { OperationEnvelope, OperationStepSpec } from './operation-envelope';

describe('orchestration utils', () => {
  it('createOperationId returns op_ prefix', () => {
    expect(createOperationId()).toMatch(/^op_/);
  });

  it('resolveStepsForOperation filters by surface and action', () => {
    const steps = resolveStepsForOperation('stub', 'save', [
      {
        id: 'erganis.hello-world',
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
            surfaceId: 'other',
            action: 'save',
            stepId: 'skip',
            handler: 'noop',
            failureClass: 'required',
          },
        ],
      },
    ]);
    expect(steps).toHaveLength(1);
    expect(steps[0].handler).toBe('pingSave');
  });

  it('computeOutcome returns failed when required step fails', () => {
    const steps: OperationStepSpec[] = [
      {
        moduleId: 'm',
        stepId: 's',
        handler: 'h',
        failureClass: 'required',
        phase: 'db',
      },
    ];
    expect(
      computeOutcome([{ status: 'failed', failureClass: 'required' }]),
    ).toBe('failed');
    expect(computeOutcome([{ status: 'success', failureClass: 'required' }])).toBe(
      'success',
    );
  });
});
