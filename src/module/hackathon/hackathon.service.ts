import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../lib/database/prisma.service';
import { CreateHackathonDto } from './dto/create-hackathon.dto';
import { UpdateHackathonDto } from './dto/update-hackathon.dto';

@Injectable()
export class HackathonService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateHackathonDto, authorId: string) {
    return this.prisma.hackathon.create({
      data: {
        name: dto.name,
        description: dto.description,
        startDate: dto.startsAt,
        endDate: dto.endsAt,
        isActive: dto.isActive ?? true,
        authorId,
      },
      include: {
        author: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  async findAll() {
    return this.prisma.hackathon.findMany({
      include: {
        author: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: { participants: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const hackathon = await this.prisma.hackathon.findUnique({
      where: { id },
      include: {
        author: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: { participants: true },
        },
      },
    });

    if (!hackathon) {
      throw new NotFoundException(`Hackathon with ID "${id}" not found`);
    }

    return hackathon;
  }

  async update(id: string, dto: UpdateHackathonDto) {
    await this.findOne(id);

    return this.prisma.hackathon.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.startsAt && { startDate: dto.startsAt }),
        ...(dto.endsAt && { endDate: dto.endsAt }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
      include: {
        author: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.hackathon.delete({
      where: { id },
    });
  }

  async join(hackathonId: string, userId: string) {
    const hackathon = await this.prisma.hackathon.findUnique({
      where: { id: hackathonId },
    });

    if (!hackathon) {
      throw new NotFoundException(`Hackathon with ID "${hackathonId}" not found`);
    }

    if (!hackathon.isActive) {
      throw new BadRequestException('Hackathon is not active');
    }

    if (new Date() > hackathon.endDate) {
      throw new BadRequestException('Hackathon has already ended');
    }

    const existingParticipant = await this.prisma.hackathonParticipant.findUnique({
      where: {
        hackathonId_userId: {
          hackathonId,
          userId,
        },
      },
    });

    if (existingParticipant) {
      throw new BadRequestException('You have already joined this hackathon');
    }

    return this.prisma.hackathonParticipant.create({
      data: {
        hackathonId,
        userId,
      },
      include: {
        hackathon: {
          select: { id: true, name: true, startDate: true, endDate: true },
        },
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }
}
