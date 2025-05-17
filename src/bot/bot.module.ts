import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { AdminService } from "./admins/admins.service";
import { BotService } from "./bot.service";
import { BotUpdate } from "./bot.update";
import { CustomerUpdate } from "./customers/costumer.update";
import { CustomerService } from "./customers/customer.service";
import { MasterService } from "./masters/master.service";
import { MasterUpdate } from "./masters/master.update";
import { ChatWithAdmin } from "./models/chat-with-admin.model";
import { Customer } from "./models/customer.model";
import { MasterCustomers } from "./models/master-customers.model";
import { Masters } from "./models/master.model";

@Module({
	imports: [
		SequelizeModule.forFeature([
			Masters,
			MasterCustomers,
			Customer,
			ChatWithAdmin,
		]),
		BotModule,
	],
	controllers: [],
	providers: [
		BotService,
		MasterService,
		CustomerService,
		AdminService,
		CustomerUpdate,
		MasterUpdate,
		BotUpdate,
	],
})
export class BotModule {}
