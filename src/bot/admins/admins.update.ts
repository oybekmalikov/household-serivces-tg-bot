import { Action, Hears, Update } from "nestjs-telegraf";
import { Context } from "telegraf";
import { BotService } from "../bot.service";
import { AdminService } from "./admins.service";
@Update()
export class AdminUpdate {
	constructor(
		private readonly botService: BotService,
		private readonly adminService: AdminService
	) {}
	@Hears("<Services>")
	onSeriveces(ctx: Context) {
		this.adminService.onServices(ctx);
	}
	@Hears("Back>")
	onBack(ctx: Context) {
		this.adminService.onBackMain	(ctx);
	}
	@Hears("Delete Service")
	onDeleteServices(ctx: Context) {
		this.adminService.onRemoveServices(ctx);
	}
	@Hears("Add new Services")
	onAddServices(ctx: Context) {
		this.adminService.onAddServices(ctx);
	}
	@Action(/^del_([\w\s\-]+)_(\d+)$/)
	onRemovingServices(ctx: Context) {
		this.adminService.onRemovingServices(ctx);
	}
}
