import {
  createOperationId,
  computeOutcome,
  resolveStepsForOperation,
  LOCKABLE_ACTIONS,
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
    expect(
      computeOutcome([{ status: 'failed', failureClass: 'required' }]),
    ).toBe('failed');
    expect(computeOutcome([{ status: 'success', failureClass: 'required' }])).toBe(
      'success',
    );
  });

  it('computeOutcome returns partial when optional step fails', () => {
    expect(
      computeOutcome([{ status: 'failed', failureClass: 'optional' }]),
    ).toBe('partial');
  });

  it('LOCKABLE_ACTIONS includes save but not load', () => {
    expect(LOCKABLE_ACTIONS.has('save')).toBe(true);
    expect(LOCKABLE_ACTIONS.has('load')).toBe(false);
  });
});
