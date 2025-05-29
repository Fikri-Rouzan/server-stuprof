import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AdminService } from './admin/admin.service';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const appCtx = await NestFactory.createApplicationContext(AppModule);
  const logger = new Logger('SeedScript');

  try {
    logger.log('Initializing seeding process...');
    const adminService = appCtx.get(AdminService);
    const configService = appCtx.get(ConfigService);

    const defaultAdminUsername = configService.get<string>(
      'DEFAULT_ADMIN_USERNAME',
    );
    const defaultAdminPassword = configService.get<string>(
      'DEFAULT_ADMIN_PASSWORD',
    );

    if (!defaultAdminUsername || !defaultAdminPassword) {
      logger.error(
        'DEFAULT_ADMIN_USERNAME or DEFAULT_ADMIN_PASSWORD is not defined in the .env file. Aborting seed.',
      );
      await appCtx.close();
      process.exit(1);
    }

    logger.log(
      `Attempting to seed admin with username: ${defaultAdminUsername}`,
    );

    const existingAdmin =
      await adminService.findByUsername(defaultAdminUsername);

    if (existingAdmin) {
      logger.log(
        `Admin user "${defaultAdminUsername}" already exists. Seeding skipped.`,
      );
    } else {
      await adminService.create({
        username: defaultAdminUsername,
        password_plain: defaultAdminPassword,
      });
      logger.log(`Admin user "${defaultAdminUsername}" created successfully.`);
    }
    logger.log('Seeding process finished.');
  } catch (error) {
    logger.error('Error during seeding process:', error.message, error.stack);
    process.exit(1);
  } finally {
    await appCtx.close();
    process.exit(0);
  }
}

bootstrap();
