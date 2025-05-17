import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { Context, Markup } from "telegraf";
import { MasterService } from "./masters/master.service";
import { Masters } from "./models/master.model";

@Injectable()
export class BotService {
	constructor(
		@InjectModel(Masters) private readonly masterModel: typeof Masters,
		private readonly masterService: MasterService
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
			const user_id = ctx.from?.id;
			const master = await this.masterModel.findOne({ where: { user_id } });
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
				if (ctx.message.contact.user_id == user_id) {
					let phone = ctx.message.contact.phone_number;
					if (phone[0] != "+") {
						phone = "+" + phone;
					}
					master.phone_number = phone;
					master.last_state = "workshop_name";
					await master.save();
					await ctx.replyWithHTML(`Enter your workshop name:`, {
						...Markup.keyboard([["Ignore Workshop Name"]]).resize(),
					});
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
				const user_id = ctx.from?.id;
				const master = await this.masterModel.findOne({ where: { user_id } });
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
		} catch (error) {
			console.log(`Error on onLocation: `, error);
		}
	}
	async onText(ctx: Context) {
		try {
			this.masterService.onText(ctx);
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
