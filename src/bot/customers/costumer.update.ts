import { Hears, Update } from "nestjs-telegraf";
import { Context } from "telegraf";
import { BotService } from "../bot.service";
import { CustomerService } from "./customer.service";
@Update()
export class CustomerUpdate {
	constructor(
		private readonly botService: BotService,
		private readonly customerService: CustomerService
	) {}
	@Hears("Customer")
	async onCostume(ctx: Context) {
		return this.customerService.registerCustomer(ctx)
	}
}
