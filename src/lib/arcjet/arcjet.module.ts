import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import {
  ArcjetGuard,
  ArcjetModule as ArcjetNestModule,
  createRemoteClient,
  fixedWindow,
  shield,
} from '@arcjet/nest';

@Global()
@Module({
  imports: [
    ArcjetNestModule.forRootAsync({
      isGlobal: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const key = configService.get<string>('ARCJET_KEY');
        const envMode = configService.get<string>('ARCJET_MODE', 'LIVE');
        const mode = envMode === 'DRY_RUN' ? 'DRY_RUN' : 'LIVE';
        const timeout = configService.get<number>('ARCJET_TIMEOUT') || 5000;

        return {
          key: key || '',
          mode,
          client: createRemoteClient({ timeout }),
          characteristics: ['ip.src'],
          rules: [
            shield({
              mode,
            }),
            fixedWindow({
              mode,
              characteristics: ['ip.src'],
              window: '1m',
              max: 100,
            }),
          ],
        };
      },
    }),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ArcjetGuard,
    },
  ],
  exports: [ArcjetNestModule],
})
export class ArcjetModule {}
