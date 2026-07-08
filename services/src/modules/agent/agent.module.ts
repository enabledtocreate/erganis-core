import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { LoaderModule } from '../loader/loader.module';
import { AgentCapabilitiesService } from './agent-capabilities.service';
import { AgentController } from './agent.controller';

@Module({
  imports: [AuthModule, LoaderModule],
  controllers: [AgentController],
  providers: [AgentCapabilitiesService],
  exports: [AgentCapabilitiesService],
})
export class AgentModule {}
