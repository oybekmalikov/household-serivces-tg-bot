import { Hears, Update } from "nestjs-telegraf";
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
		return this.masterService.onMaster(ctx);
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
	@Hears("Confirm")
	async onConfirm(ctx: Context) {
		return this.masterService.onConfirm(ctx);
	}
	@Hears("Reject")
	async onReject(ctx: Context) {
		return this.masterService.onReject(ctx);
	}
}
