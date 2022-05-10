import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TasksModule } from './tasks/tasks.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    TasksModule,
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'localdev',
      database: 'task-management',
      autoLoadEntities: true,
      // do not use on production environment or you could lose data
      synchronize: true,
    }),
    AuthModule,
  ],
})
export class AppModule {}
