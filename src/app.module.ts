import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { SequelizeModule } from "@nestjs/sequelize";
import { TelegrafModule } from "nestjs-telegraf";
import { BOT_NAME } from "./app.constants";
import { BotModule } from "./bot/bot.module";
import { Masters } from "./bot/models/master.model";
import { MasterCustomers } from './bot/models/master-customers.model'
import { Customer } from './bot/models/customer.model'
import { ChatWithAdmin } from './bot/models/chat-with-admin.model'
@Module({
	imports: [
		ConfigModule.forRoot({ envFilePath: ".env", isGlobal: true }),
		TelegrafModule.forRootAsync({
			botName: BOT_NAME,
			useFactory: () => ({
				token: process.env.BOT_TOKEN!,
				middlewares: [],
				include: [BotModule],
			}),
		}),
		SequelizeModule.forRoot({
			dialect: "postgres",
			host: process.env.PG_HOST,
			port: Number(process.env.PG_PORT),
			username: process.env.PG_USER,
			password: process.env.PG_PASSWORD,
			database: process.env.PG_DB,
			models: [Masters, MasterCustomers, Customer,ChatWithAdmin],
			autoLoadModels: true,
			sync: { alter: true },
			logging: false,
		}),
		BotModule,
	],
	controllers: [],
	providers: [],
})
export class AppModule {}
