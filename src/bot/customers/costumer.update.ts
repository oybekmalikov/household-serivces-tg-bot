import { Action, Hears, Update } from "nestjs-telegraf";
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
		return this.customerService.registerCustomer(ctx);
	}
	@Hears("My meetings")
	async onMyMetting(ctx: Context) {
		return this.customerService.onMyMettings(ctx);
	}
	@Hears("Make an appointment")
	async onMakeMetting(ctx: Context) {
		return this.customerService.onMakeMetting(ctx);
	}
	@Action(/^makeapp_\d+_\d+$/)
	async onMettingStepWithWho(ctx: Context) {
		return this.customerService.onMettingStepWithWho(ctx);
	}
	@Action(/^timeformetting_\d{2}:\d{2}_\d+$/)
	async onMettingStepTime(ctx: Context) {
		return this.customerService.onMettingStepTime(ctx);
	}
}
