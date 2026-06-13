import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

import { User, UserRole } from '../entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {}

  async create(dto: CreateUserDto): Promise<User> {
    const existing = await this.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Email already in use');
    }
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = this.usersRepo.create({
      email: dto.email,
      passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
      birthDate: dto.birthDate,
      role: dto.role ?? 'buyer',
      apiKey: uuidv4(),
    });
    return this.usersRepo.save(user);
  }

  async update(id: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.findById(id);
    if (dto.password) {
      user.passwordHash = await bcrypt.hash(dto.password, 10);
    }
    if (dto.firstName !== undefined) {
      user.firstName = dto.firstName;
    }
    if (dto.lastName !== undefined) {
      user.lastName = dto.lastName;
    }
    if (dto.birthDate !== undefined) {
      user.birthDate = dto.birthDate;
    }
    if (dto.role) {
      user.role = dto.role;
    }
    return this.usersRepo.save(user);
  }

  async findAll(): Promise<User[]> {
    return this.usersRepo.find();
  }

  async findById(id: string): Promise<User> {
    const user = await this.usersRepo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepo.findOne({ where: { email } });
  }

  async findByApiKey(apiKey: string): Promise<User | null> {
    return this.usersRepo.findOne({ where: { apiKey } });
  }

  async remove(id: string): Promise<void> {
    await this.usersRepo.delete(id);
  }

  async ensureAdminUser(): Promise<void> {
    const email = process.env.ADMIN_EMAIL ?? 'admin@example.com';
    const existing = await this.usersRepo.findOne({ where: { email } });
    const password = process.env.ADMIN_PASSWORD ?? 'admin123';
    const apiKeyOverride = process.env.ADMIN_API_KEY;
    const passwordHash = await bcrypt.hash(password, 10);

    if (existing) {
      existing.passwordHash = passwordHash;
      existing.role = 'admin' as UserRole;
      if (apiKeyOverride) {
        existing.apiKey = apiKeyOverride;
      }
      await this.usersRepo.save(existing);
      console.log(`Admin seed ensured for email: ${email}`);
      return;
    }

    const admin = this.usersRepo.create({
      email,
      passwordHash,
      role: 'admin' as UserRole,
      apiKey: apiKeyOverride || uuidv4(),
    });
    await this.usersRepo.save(admin);
    console.log(`Admin seed created for email: ${email}`);
  }
}
