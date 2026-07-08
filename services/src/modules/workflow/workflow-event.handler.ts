import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { EventDispatcherService } from '../events/event-dispatcher.service';
import { WorkflowService } from './workflow.service';

@Injectable()
export class WorkflowEventHandler implements OnApplicationBootstrap {
  constructor(
    private readonly dispatcher: EventDispatcherService,
    private readonly workflows: WorkflowService,
  ) {}

  onApplicationBootstrap(): void {
    this.dispatcher.register('operation.completed', async (payload) => {
      await this.workflows.handleOperationCompleted(payload);
    });
  }
}
