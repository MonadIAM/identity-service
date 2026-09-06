import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";
import { MicroserviceOptions } from "@nestjs/microservices";
import { ConfigService } from "@nestjs/config";
import { RequestMethod } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import cookie from "@fastify/cookie";
import { Logger } from "nestjs-pino";

import { BootstrapReference, BootstrapSecurity, BootstrapPipes, BootstrapMetrics } from "~bootstrap";
import { KAFKA_CONFIG } from "~infrastructure/kafka";

import { MainModule } from "./main.module";
import "./extensions";

async function bootstrap(): Promise<void> {
    const fastifyAdapter = new FastifyAdapter({
        bodyLimit: Number(process.env.BODY_LIMIT_BYTES),
        trustProxy: true,
        logger: false,
    });

    const application = await NestFactory.create<NestFastifyApplication>(MainModule, fastifyAdapter, { bufferLogs: true });

    await application.register(cookie);

    application.useLogger(application.get(Logger));
    const configService = application.get(ConfigService);

    const version: number = configService.getOrThrow<number>("API_VERSION");

    application.setGlobalPrefix(`api/v${version}`, {
        exclude: [
            { path: ".well-known/oauth-authorization-server", method: RequestMethod.GET },
            { path: ".well-known/openid-configuration", method: RequestMethod.GET },
            { path: ".well-known/jwks.json", method: RequestMethod.GET },
        ],
    });

    BootstrapPipes.applyGlobalPipes(application);
    BootstrapMetrics.registerMetricsHooks(application);
    await BootstrapReference.registerReference(application);
    await BootstrapSecurity.registerSecurityPlugins(application);

    const kafkaConfig = application.get<MicroserviceOptions>(KAFKA_CONFIG);

    application.connectMicroservice(kafkaConfig);

    application.enableShutdownHooks();

    const port: number = configService.getOrThrow<number>("APP_PORT");
    const host: string = configService.getOrThrow<string>("APP_HOST");

    await application.init();
    await application.startAllMicroservices();
    await application.listen({ port, host });
}
bootstrap();
