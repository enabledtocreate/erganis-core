import { Controller, Get } from '@nestjs/common';

const DEFAULT_SLOTS = [
  { slotId: 'shell.header', region: 'header', description: 'Top navigation bar' },
  { slotId: 'shell.sidebar', region: 'sidebar', description: 'Primary navigation' },
  { slotId: 'shell.main', region: 'main', description: 'Primary content area' },
  { slotId: 'dashboard.widget', region: 'dashboard', description: 'Dashboard widgets' },
];

@Controller('composition')
export class CompositionController {
  @Get('slots')
  listSlots() {
    return { slots: DEFAULT_SLOTS };
  }
}
