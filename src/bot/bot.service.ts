import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { Context, Markup } from "telegraf";
import { AdminService } from "./admins/admins.service";
import { CustomerService } from "./customers/customer.service";
import { MasterService } from "./masters/master.service";
import { Customer } from "./models/customer.model";
import { Masters } from "./models/master.model";

@Injectable()
export class BotService {
	constructor(
		@InjectModel(Masters) private readonly masterModel: typeof Masters,
		@InjectModel(Customer) private readonly customerModel: typeof Customer,
		private readonly masterService: MasterService,
		private readonly customerService: CustomerService,
		private readonly adminService: AdminService
	) {}
	async start(ctx: Context) {
		try {
			await ctx.replyWithHTML("Choose your role:", {
				...Markup.keyboard([["Master", "Customer"]])
					.resize()
					.oneTime(),
			});
		} catch (error) {
			console.log("Error on start: ", error);
		}
	}
	async onContact(ctx: Context) {
		try {
			const user_id = String(ctx.from?.id);
			const masters = await this.masterModel.findAll({ where: { user_id } });
			for (const master of masters) {
				if (!master) {
					await ctx.replyWithHTML(`Please click the <b>Start</b> button.`, {
						...Markup.keyboard([[`/start`]])
							.oneTime()
							.resize(),
					});
				} else if (
					master.last_state == "phone_number" &&
					"contact" in ctx.message!
				) {
					if (String(ctx.message.contact.user_id) == user_id) {
						let phone = ctx.message.contact.phone_number;
						if (phone[0] != "+") {
							phone = "+" + phone;
						}
						master.phone_number = phone;
						master.last_state = "workshop_name";
						await master.save();
						return await ctx.replyWithHTML(`Enter your workshop name:`, {
							...Markup.keyboard([["Ignore Workshop Name"]]).resize(),
						});
					} else {
						return await ctx.reply("Enter your own phone number:", {
							parse_mode: "HTML",
							...Markup.keyboard([
								[Markup.button.contactRequest("Send Phone Number")],
							]).resize(),
						});
					}
				}
			}
			// -----------------------CUSTOMER------------------------
			const customer = await this.customerModel.findOne({ where: { user_id } });
			if (!customer) {
				await ctx.replyWithHTML(`Please click the <b>Start</b> button.`, {
					...Markup.keyboard([[`/start`]])
						.oneTime()
						.resize(),
				});
			} else if (!customer.phone_number && "contact" in ctx.message!) {
				if (String(ctx.message.contact.user_id) == user_id) {
					let phone = ctx.message.contact.phone_number;
					if (phone[0] != "+") {
						phone = "+" + phone;
					}
					customer.phone_number = phone;
					customer.status = true;
					await customer.save();
					await ctx.replyWithHTML(
						`🎉 Congratulations, you've successfully registered!`,
						{
							...Markup.keyboard([
								["My meetings", "Make an appointment"],
							]).resize(),
						}
					);
				} else {
					await ctx.reply("Enter your own phone number:", {
						parse_mode: "HTML",
						...Markup.keyboard([
							[Markup.button.contactRequest("Send Phone Number")],
						]).resize(),
					});
				}
			}
		} catch (error) {
			console.log("Error on onContact: ", error);
		}
	}
	async onLocation(ctx: Context) {
		try {
			if ("location" in ctx.message!) {
				const user_id = String(ctx.from?.id);
				const masters = await this.masterModel.findAll({ where: { user_id } });
				for (const master of masters) {
					if (!master) {
						await ctx.replyWithHTML(`Please click the <b>Start</b> button.`, {
							...Markup.keyboard([[`/start`]])
								.oneTime()
								.resize(),
						});
					} else if (master && master.last_state == "location") {
						master.location = `${ctx.message.location.latitude}|${ctx.message.location.longitude}`;
						master.last_state = "start_time";
						await master.save();
						await ctx.replyWithHTML(
							"Enter your start time:\nFor example: 08:00",
							{
								parse_mode: "HTML",
								...Markup.removeKeyboard(),
							}
						);
					}
				}
			}
		} catch (error) {
			console.log(`Error on onLocation: `, error);
		}
	}
	async onText(ctx: Context) {
		try {
			this.adminService.responseToMaster(ctx);
			this.masterService.onText(ctx, "");
			this.customerService.onText(ctx);
		} catch (error) {
			console.log(`error on onText: `, error);
		}
	}
	async adminMenu(ctx: Context, menuText = `<b>Admin Menu</b>`) {
		try {
			await ctx.replyWithHTML(menuText, {
				parse_mode: "HTML",
				...Markup.keyboard([["Master", "Customer"]])
					.oneTime()
					.resize(),
			});
		} catch (error) {
			console.log(`Error on adminMenu: `, error);
		}
	}
}
