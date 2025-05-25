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
	@Action(/^timeformetting_(\d{2}:\d{2})-(\d{2}:\d{2})_(\d+)_(\d+)$/)
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
	@Hears("Services")
	async onServices(ctx: Context) {
		return this.customerService.onServices(ctx);
	}
	@Hears("<Shoe Workshop>")
	async onSections1(ctx: Context) {
		return this.customerService.onSections(ctx, "Shoe Workshop");
	}
	@Hears("<Hairdresser>")
	async onSections2(ctx: Context) {
		return this.customerService.onSections(ctx, "Hairdresser");
	}
	@Hears("<Beauty Salon>")
	async onSections3(ctx: Context) {
		return this.customerService.onSections(ctx, "Beauty Salon");
	}
	@Hears("<Watchmaker>")
	async onSections4(ctx: Context) {
		return this.customerService.onSections(ctx, "Watchmaker");
	}
	@Hears("<Jewelry Workshop>")
	async onSections5(ctx: Context) {
		return this.customerService.onSections(ctx, "Jewelry Workshop");
	}
	@Hears("<Back to Main>")
	async onSections6(ctx: Context) {
		return this.customerService.onSections(ctx, "Back to Main");
	}
	@Hears("<Back>")
	async onSection7(ctx: Context) {
		return this.customerService.onServices(ctx);
	}
	@Hears("< Back")
	async onBackClosestLoc(ctx: Context) {
		return this.customerService.backGetCloseLoc(ctx);
	}
	@Hears("Get closest by location")
	async getClosest(ctx: Context) {
		return this.customerService.querySendCustomerLoc(ctx);
	}
	@Hears("Get by rating")
	async getByRating(ctx: Context) {
		return this.customerService.getByRating(ctx);
	}
}
