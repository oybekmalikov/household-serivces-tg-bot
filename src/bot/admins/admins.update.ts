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
		this.adminService.onBackMain(ctx);
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
	@Hears("<Master>")
	onMaster(ctx: Context) {
		this.adminService.onMaster(ctx);
	}
	@Hears("<Customer>")
	onCustomer(ctx: Context) {
		this.adminService.onCustomer(ctx);
	}
	@Hears("Show all masters")
	onMasterList(ctx: Context) {
		this.adminService.onMasterList(ctx);
	}
	@Hears("Show all customers")
	onCustomerList(ctx: Context) {
		this.adminService.onCustomerList(ctx);
	}
	@Action(/^master_\d+$/)
	onEachMaster(ctx: Context) {
		this.adminService.onEachMaster(ctx);
	}
	@Action(/^customer_\d+$/)
	onEachCustomer(ctx: Context) {
		this.adminService.onEachCustomer(ctx);
	}
	@Action(/^disable_\d+$/)
	onDisable(ctx: Context) {
		this.adminService.onDisable(ctx);
	}
	@Action(/^dismissal_\d+$/)
	onDismissial(ctx: Context) {
		this.adminService.onDismissial(ctx);
	}
	@Action(/^sendmsg_\d+$/)
	onSendMessage(ctx: Context) {
		this.adminService.onSendMessage(ctx);
	}
	@Action(/^ban_\d+$/)
	onBanned(ctx: Context) {
		this.adminService.onBanned(ctx);
	}
	@Hears("Send message to all masters")
	onSendMessageToAllMasters(ctx: Context) {
		this.adminService.onSendMessageToAllMasters(ctx);
	}
	@Hears("Send message to all customers")
	onSendMessageToAllCustomers(ctx: Context) {
		this.adminService.onSendMessageToAllCustomers(ctx);
	}
}
