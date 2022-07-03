import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { TaskStatus } from './task-status.enum';
import { CreateTaskDto } from './dto/create-task.dto';
import { GetTasksFilterDto } from './dto/get-tasks-filter.dto';
import { User, Task, Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class TasksService {
  private logger = new Logger('TasksService', { timestamp: true });

  constructor(private prisma: PrismaService) {}

  async getTasks(filterDto: GetTasksFilterDto, user: User): Promise<Task[]> {
    const { status, search } = filterDto;

    // TODO move query logic to custom repository
    const query: Prisma.TaskFindManyArgs = { where: { user } };

    if (status) {
      query.where.status = status;
    }

    if (search) {
      query.where.OR = [
        {
          title: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          description: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ];
    }

    try {
      return await this.prisma.task.findMany(query);
    } catch (error) {
      this.logger.error(
        `Failed to get tasks for user "${
          user.username
        }". Filters: ${JSON.stringify(filterDto)}`,
        error.stack,
      );
      throw new InternalServerErrorException();
    }
  }

  async getTaskById(id: string, user: User): Promise<Task> {
    const task = await this.prisma.task.findFirst({
      where: { id, user },
    });

    if (!task) {
      throw new NotFoundException(`Task with id "${id}" not found`);
    }

    return task;
  }

  createTask(createTaskDto: CreateTaskDto, user: User): Promise<Task> {
    const { title, description } = createTaskDto;

    /* TODO
      I should probably move this create logic to a custom repository
    */
    return this.prisma.task.create({
      data: { title, description, userId: user.id },
    });
  }

  async updateTaskStatus(
    id: string,
    status: TaskStatus,
    user: User,
  ): Promise<Task> {
    const task = await this.getTaskById(id, user);

    return this.prisma.task.update({
      where: { id: task.id },
      data: { status },
    });
  }

  async deleteTask(id: string, user: User): Promise<void> {
    const task = await this.getTaskById(id, user);

    await this.prisma.task.delete({
      where: { id: task.id },
    });
  }
}
