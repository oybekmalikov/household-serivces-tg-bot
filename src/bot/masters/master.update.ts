import { Action, Hears, Update } from "nestjs-telegraf";
import { Context } from "telegraf";
import { BotService } from "../bot.service";
import { MasterService } from "./master.service";

@Update()
export class MasterUpdate {
	constructor(
		private readonly botService: BotService,
		private readonly masterService: MasterService
	) {}
	@Hears("Master")
	async onMaster(ctx: Context) {
		return this.masterService.showOccupation(ctx);
	}
	@Hears("Hairdresser")
	async Hairdresser(ctx: Context) {
		return this.masterService.onMaster(ctx, "Hairdresser");
	}
	@Hears("Beauty Salon")
	async beautySalon(ctx: Context) {
		return this.masterService.onMaster(ctx, "Beauty Salon");
	}
	@Hears("Jewelry Workshop")
	async jewelryWorkshop(ctx: Context) {
		return this.masterService.onMaster(ctx, "Jewelry Workshop");
	}
	@Hears("Watchmaker")
	async watchmaker(ctx: Context) {
		return this.masterService.onMaster(ctx, "Watchmaker");
	}
	@Hears("Shoe Workshop")
	async shoeWorkshop(ctx: Context) {
		return this.masterService.onMaster(ctx, "Shoe Workshop");
	}
	@Hears("Ignore Workshop Name")
	async onIgnoreWorkshopName(ctx: Context) {
		return this.masterService.onIgnoreWorkshopName(ctx);
	}
	@Hears("Ignore Workshop address")
	async onIgnoreWorkshopAddress(ctx: Context) {
		return this.masterService.onIgnoreWorkshopAddress(ctx);
	}
	@Hears("Ignore Workshop target")
	async onIgnoreWorkshopTarget(ctx: Context) {
		return this.masterService.onIgnoreWorkshopTarget(ctx);
	}
	@Hears("Check")
	async onConfirm(ctx: Context) {
		return this.masterService.onConfirm(ctx);
	}
	@Hears("Reject")
	async onReject(ctx: Context) {
		return this.masterService.onReject(ctx);
	}
	@Hears("Write to Admin")
	async onWriteToAdmin(ctx: Context) {
		return this.masterService.onWriteToAdmin(ctx);
	}
	@Action(/^confirm_+\d+/)
	async confirmMaster(ctx: Context) {
		return this.masterService.confirmMasters(ctx);
	}
	@Action(/^reject_+\d+/)
	async rejectMaster(ctx: Context) {
		return this.masterService.rejectMaster(ctx);
	}
	@Hears("Rating")
	async masterMarrks(ctx: Context) {
		return this.masterService.onMasterMarks(ctx);
	}
	@Hears("Customers")
	async showCustomers(ctx: Context) {
		return this.masterService.showCustomers(ctx);
	}
	@Hears("Time")
	async showTimes(ctx: Context) {
		return this.masterService.showCustomers(ctx);
	}
	// @On("text")
	// async onText(ctx: Context) {
	// 	console.log(ctx.callbackQuery);
	// }
	// @On("message")
	// async onMessage(ctx: Context) {
	// 	console.log(ctx.callbackQuery);
	// }
}
