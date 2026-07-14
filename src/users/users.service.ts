import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuthProvider, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import {
  UpdateUserNameDto,
  UpdateUserPasswordDto,
} from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { UserRepository } from './users.repo';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';

type SafeUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  provider: AuthProvider;
  avatar: string | null;
  isVerified: boolean;
  lastLogin: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class UsersService {
  constructor(
    private userRepo: UserRepository,
    private cloudinaryService: CloudinaryService,
  ) {}

  async findAll(): Promise<SafeUser[]> {
    const users = await this.userRepo.getAllUsers();
    return users.map((user) => this.toSafeUser(user));
  }

  async findOne(id: string): Promise<SafeUser> {
    const user = await this.findUserOrThrow(id);
    return this.toSafeUser(user);
  }

  async updateName(
    id: string,
    updateUserDto: UpdateUserNameDto,
  ): Promise<SafeUser> {
    await this.findUserOrThrow(id);
    const user = await this.userRepo.updateUserName(id, updateUserDto.name);
    return this.toSafeUser(user);
  }

  async updatePassword(
    id: string,
    updateUserDto: UpdateUserPasswordDto,
  ): Promise<{ success: true }> {
    const user = await this.findUserOrThrow(id);

    if (!user.password) {
      throw new BadRequestException(
        'This account does not use local password login',
      );
    }

    const isMatch = await bcrypt.compare(updateUserDto.password, user.password);
    if (!isMatch) {
      throw new ForbiddenException('Invalid password');
    }

    const hashedPassword = await bcrypt.hash(updateUserDto.newPassword, 12);
    await this.userRepo.updatePassword(id, hashedPassword);

    return { success: true };
  }

  async removeMyAccount(id: string): Promise<{ success: true }> {
    const user = await this.findUserOrThrow(id);
    if (user.avatarPublicId) {
      await this.cloudinaryService.deleteFile(user.avatarPublicId);
    }
    await this.userRepo.deleteUser(id);
    return { success: true };
  }

  async removeByAdmin(id: string): Promise<{ success: true }> {
    const user = await this.findUserOrThrow(id);

    if (user.role === UserRole.admin) {
      throw new ForbiddenException('Admin accounts cannot be deleted here');
    }
    if (user.avatarPublicId) {
      await this.cloudinaryService.deleteFile(user.avatarPublicId);
    }
    await this.userRepo.deleteUser(id);
    return { success: true };
  }
  async uploadUserAvatar(id: string, file: Express.Multer.File) {
    const user = await this.findUserOrThrow(id);
    if (!file) throw new BadRequestException('image is required');
    const image = await this.cloudinaryService.uploadFile(
      file,
      'users/avatars',
    );
    if (user.avatar && user.avatarPublicId) {
      await this.cloudinaryService.deleteFile(user.avatarPublicId);
    }
    const userImageUrl = image.url;
    const updateUserImage = await this.userRepo.uploadUserAvatar(
      user.id,
      userImageUrl,
      image.publicId,
    );
    return this.toSafeUser(updateUserImage);
  }
  async deleteUserAvatar(id: string) {
    const user = await this.findUserOrThrow(id);
    if (!user.avatar) {
      throw new NotFoundException('avatar not found');
    }
    const avatarPublicId = user.avatarPublicId;

    await this.cloudinaryService.deleteFile(user.avatar);
    if (avatarPublicId) {
      await this.cloudinaryService.deleteFile(avatarPublicId);
    }
    const deleteUserImage = await this.userRepo.deleteUserAvatar(user.id);
    return this.toSafeUser(deleteUserImage);
  }
  private async findUserOrThrow(id: string): Promise<User> {
    const user = await this.userRepo.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  private toSafeUser(user: User): SafeUser {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      provider: user.provider,
      avatar: user.avatar,
      isVerified: user.isVerified,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
