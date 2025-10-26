import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import qs from 'qs';
import { AppModule } from './app.module';

async function bootstrap() {
    const app = await NestFactory.create<NestExpressApplication>(AppModule, {
        rawBody: true,
    });
    app.use(cookieParser());

    app.set('query parser', (str: string) => qs.parse(str));

    const config = new DocumentBuilder()
        .setTitle('My App API')
        .setDescription('API documentation for my NestJS project')
        .setVersion('1.0.0')
        .addBearerAuth(
            {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
                name: 'Authorization',
                description: 'Enter JWT token as: **Bearer <your_token_here>**',
                in: 'header',
            },
            'access-token'
        )
        .build();

    const document = SwaggerModule.createDocument(app, config);

    SwaggerModule.setup('api-docs', app, document, {
        swaggerOptions: {
            persistAuthorization: true,
            docExpansion: 'none',
        },
    });

    const port = process.env.PORT ?? 3000;
    await app.listen(port);
    console.log(`Server running on http://localhost:${port}`);
    console.log(`Swagger docs available at http://localhost:${port}/api-docs`);
}
void bootstrap();
