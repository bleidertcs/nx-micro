import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from 'libs/prisma-client/src/lib/generated/prisma-client-lib';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }
}
