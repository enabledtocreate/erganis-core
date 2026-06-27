import {
  Controller,
  Get,
  Param,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { AuthenticatedRequest, SessionGuard } from '../auth/guards/session.guard';
import { OrgRepository } from '../auth/infrastructure/org.repository';
import { LocalFileStoreService } from './local-file-store.service';

@Controller('files')
@UseGuards(SessionGuard)
export class FilesController {
  constructor(
    private readonly files: LocalFileStoreService,
    private readonly orgs: OrgRepository,
  ) {}

  @Post(':orgSlug/upload')
  async upload(
    @Param('orgSlug') orgSlug: string,
    @Req() req: AuthenticatedRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    const org = await this.orgs.findBySlug(orgSlug);
    if (!org) {
      res.status(404);
      return { message: 'Organization not found' };
    }
    const body = req.body as { fileName?: string; contentType?: string; dataBase64?: string };
    const data = Buffer.from(body.dataBase64 ?? '', 'base64');
    const stored = await this.files.store({
      orgId: org.id,
      namespace: 'uploads',
      fileName: body.fileName ?? 'file.bin',
      contentType: body.contentType ?? 'application/octet-stream',
      data,
    });
    res.status(201);
    return stored;
  }

  @Get(':orgSlug/*')
  async download(
    @Param('orgSlug') orgSlug: string,
    @Param('0') relativePath: string,
    @Res() res: Response,
  ) {
    const org = await this.orgs.findBySlug(orgSlug);
    if (!org) {
      return res.status(404).send('Organization not found');
    }
    const data = await this.files.read(org.id, relativePath);
    return res.type('application/octet-stream').send(data);
  }
}
