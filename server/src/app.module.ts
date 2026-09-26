import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as path from 'path';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { GroupModule } from './modules/group/group.module';
import { SampleModule } from './modules/sample/sample.module';
import { CategoryModule } from './modules/category/category.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { AdminModule } from './modules/admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', 'server/.env', '../.env'],
      ignoreEnvFile: process.env.NODE_ENV === 'production',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const rawUrl = configService.get<string>('DATABASE_URL');
        const url = rawUrl ? rawUrl.replace(/[\?&]sslmode=[^&]+/g, '').replace(/\?$/, '') : undefined;
        return {
          type: 'postgres',
          url: url || undefined,
          host: url ? undefined : configService.get<string>('DB_HOST'),
          port: url ? undefined : configService.get<number>('DB_PORT', 5432),
          username: url ? undefined : configService.get<string>('DB_USERNAME'),
          password: url ? undefined : configService.get<string>('DB_PASSWORD'),
          database: url ? undefined : configService.get<string>('DB_DATABASE'),
          autoLoadEntities: true,
          synchronize: configService.get<string>('DB_SYNCHRONIZE') === 'true',
          migrationsRun: configService.get<string>('DB_MIGRATIONS_RUN') === 'true',
          migrationsTransactionMode: 'each',
          migrations: [
            path.join(process.cwd(), 'dist/migrations/*.js'),
            path.join(process.cwd(), 'dist/src/migrations/*.js'),
            path.join(process.cwd(), 'server/dist/migrations/*.js'),
            path.join(process.cwd(), 'server/dist/src/migrations/*.js'),
            path.join(__dirname, '/migrations/*.js'),
            path.join(__dirname, '../migrations/*.js'),
          ],
          ssl: {
            rejectUnauthorized: false,
          },
        };
      },
    }),
    AuthModule,
    UserModule,
    GroupModule,
    SampleModule,
    CategoryModule,
    DashboardModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
