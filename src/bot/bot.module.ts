import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { BotService } from "./bot.service";
import { BotUpdate } from "./bot.update";
import { CustomerUpdate } from "./customers/costumer.update";
import { CustomerService } from "./customers/customer.service";
import { MasterService } from "./masters/master.service";
import { MasterUpdate } from "./masters/master.update";
import { ChatWithAdmin } from "./models/chat-with-admin.model";
import { Masters } from "./models/master.model";
import { MasterCustomers } from './models/master-customers.model'
import { Customer } from './models/customer.model'

@Module({
	imports: [
		SequelizeModule.forFeature([
			Masters,
			ChatWithAdmin,
			MasterCustomers,
			Customer,
		]),
		BotModule,
	],
	controllers: [],
	providers: [
		BotService,
		MasterService,
		CustomerService,
		CustomerUpdate,
		MasterUpdate,
		BotUpdate,
	],
})
export class BotModule {}
