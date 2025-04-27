import 'reflect-metadata';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import hpp from 'hpp';
import morgan from 'morgan';
import { setupPassport } from './config/passport';
import passport from 'passport';
import { NODE_ENV, PORT, LOG_FORMAT, ORIGIN, CREDENTIALS } from '@config';
import { dbConnection } from '@database';
import swaggerUi from 'swagger-ui-express';
import { defaultMetadataStorage } from 'class-transformer/cjs/storage';
import { routingControllersToSpec } from 'routing-controllers-openapi';
import { ErrorMiddleware } from '@middlewares/error.middleware';
import { logger, stream } from '@utils/logger';
import { getMetadataArgsStorage, RoutingControllersOptions, useExpressServer } from 'routing-controllers';
import { validationMetadatasToSchemas } from 'class-validator-jsonschema';
import { HttpErrorHandler } from './middlewares/httpErrorHandler.middleware';
import { AuthController } from '@controllers/auth.controller';
import { UserController } from './controllers/users.controller';

export class App {
  public app: express.Application;
  public env: string;
  public port: string | number;
  public controllers: Function[];
  public middlewares: Function[];

  constructor() {
    this.app = express();
    this.env = NODE_ENV || 'development';
    this.port = PORT || 8080;
    this.controllers = [AuthController, UserController];
    this.middlewares = [HttpErrorHandler];
    this.connectToDatabase();
    this.initializeMiddlewares();
    this.initializeSwagger(this.controllers);

    useExpressServer(this.app, {
      routePrefix: '/api/v1',
      cors: {
        origin: ORIGIN,
        credentials: CREDENTIALS,
      },
      controllers: this.controllers,
      middlewares: this.middlewares,
      defaultErrorHandler: false,
    });
    this.initializeErrorHandling();
  }

  public listen() {
    this.app.listen(this.port, () => {
      logger.info(`=================================`);
      logger.info(`======= ENV: ${this.env} =======`);
      logger.info(`🚀 App listening on the port ${this.port}`);
      logger.info(`=================================`);
    });
  }

  public getServer() {
    return this.app;
  }

  private async connectToDatabase() {
    await dbConnection();
  }

  private initializeMiddlewares() {
    this.app.use(morgan(LOG_FORMAT, { stream }));
    this.app.use(cors({ origin: ORIGIN, credentials: CREDENTIALS }));
    this.app.use(hpp());
    this.app.use(helmet());
    this.app.use(compression());
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(cookieParser());
    this.app.use(passport.initialize());
    setupPassport();
  }

  private initializeSwagger(controllers: Function[]) {
    const schemas = validationMetadatasToSchemas({
      classTransformerMetadataStorage: defaultMetadataStorage,
      refPointerPrefix: '#/components/schemas/',
    });
    const routingControllersOptions: RoutingControllersOptions = {
      controllers: controllers,
      defaultErrorHandler: false,
      classTransformer: true,
      validation: true,
      development: process.env.APP_ENV === 'development',
      routePrefix: '/api/v1',
      cors: {
        origin: ORIGIN,
        credentials: CREDENTIALS,
      },
      middlewares: this.middlewares,
    };

    const storage = getMetadataArgsStorage();
    const specs = routingControllersToSpec(storage, routingControllersOptions, {
      components: {
        schemas,
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            description: 'Add `{accessToken}`',
          },
        },
      },
      servers: [
        {
          url: `http://localhost:${this.port}`,
          description: 'Local server',
        },
        {
          url: 'https://project-aman.vercel.app/',
          description: 'Prod server',
        },
      ],
      info: {
        title: 'AMAN API',
        version: '1.0.0',
        description: 'Aman API docs',
      },
    });

    this.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
  }

  private initializeErrorHandling() {
    this.app.use(ErrorMiddleware);
  }
}
