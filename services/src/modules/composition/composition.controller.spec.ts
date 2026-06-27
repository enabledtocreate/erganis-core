import { CompositionController } from './composition.controller';

describe('CompositionController', () => {
  it('lists default UI slots', () => {
    const controller = new CompositionController();
    const result = controller.listSlots();
    expect(result.slots.length).toBeGreaterThan(0);
    expect(result.slots[0]).toHaveProperty('slotId');
  });
});
