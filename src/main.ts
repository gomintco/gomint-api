import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // const config = new DocumentBuilder()
  //   .setTitle('GoMint API')
  //   .setDescription(
  //     'API for interacting with the Hedera Hashgraph network, including custodial key control, token creation, and transaction handling.',
  //   )
  //   .setVersion('1.0')
  //   .addTag('gomint')
  //   .build();

  // const document = SwaggerModule.createDocument(app, config);
  // SwaggerModule.setup('api', app, document);

  await app.listen(3000);
}
bootstrap();
