import {NestFactory} from '@nestjs/core';
import {AppModule} from './app.module';
import {NestExpressApplication} from "@nestjs/platform-express";
import * as dotenv from 'dotenv';

async function bootstrap() {
    dotenv.config();
    const app = await NestFactory.create<NestExpressApplication>(AppModule);
    await app.listen(3000);


}

bootstrap();
