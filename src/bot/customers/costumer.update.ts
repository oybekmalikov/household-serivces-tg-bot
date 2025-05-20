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
	@Action(/^dateformeeting_\d{4}-\d{2}-\d{2}_\d+$/)
	async onMettingStepDate(ctx: Context) {
		return this.customerService.onMettingStepDate(ctx);
	}
	@Hears("Ignore Note for Metting")
	async onIgnoreNote(ctx: Context) {
		return this.customerService.onIgnoreNote(ctx);
	}
	@Action(/^mettingfinished_\d+$/)
	async onMettingFinished(ctx: Context) {
		return this.customerService.onMettingFinished(ctx);
	}
	@Action(/^cancelmetting_\d+$/)
	async onMettingCancled(ctx: Context) {
		return this.customerService.onCancelMetting(ctx);
	}
	@Action(/^cancelYes_\d+$/)
	async onMettingCancledYes(ctx: Context) {
		return this.customerService.onCancelMettingYes(ctx);
	}
	@Action(/^cancelNo_\d+$/)
	async onMettingCancledNo(ctx: Context) {
		return this.customerService.onCancelMettingNo(ctx);
	}
	@Action(/^markformetting_\d+_\d+$/)
	async onMettingMark(ctx: Context) {
		return this.customerService.onMarkMetting(ctx);
	}
	@Hears("Ignore Feedback")
	async onIgnoreFeedback(ctx: Context) {
		return this.customerService.onIgnoreFeefback(ctx);
	}
}
