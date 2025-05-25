import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { InjectBot } from "nestjs-telegraf";
import { Context, Markup, Telegraf } from "telegraf";
import { BOT_NAME } from "../../app.constants";
import { Admin } from "../models/admin.model";
import { Buttons } from "../models/buttons.model";
import { ChatWithAdmin } from "../models/chat-with-admin.model";
import { Masters } from "../models/master.model";

@Injectable()
export class AdminService {
	constructor(
		@InjectModel(Masters) private readonly mastersModel: typeof Masters,
		@InjectModel(Admin) private readonly adminsModel: typeof Admin,
		@InjectModel(Buttons) private readonly buttonsModel: typeof Buttons,
		@InjectModel(ChatWithAdmin)
		private readonly chatWithAdminModel: typeof ChatWithAdmin,
		@InjectBot(BOT_NAME) private readonly bot: Telegraf<Context>
	) {}
	async responseToMaster(ctx: Context) {
		const user_id = String(ctx.from?.id);
		const admin = await this.adminsModel.findOne({ where: { user_id } });
		if (
			"text" in ctx.message! &&
			String(ctx.from?.id) == String(process.env.ADMIN) &&
			admin?.actions == "writetouser"
		) {
			const user_id = await this.chatWithAdminModel.findOne({
				where: { responseContent: "not_yet" },
			});
			const text = ctx.message.text;
			user_id!.responseContent = text;
			this.bot.telegram.sendMessage(Number(user_id?.senderId), text);
		}
	}
	async onServices(ctx: Context) {
		try {
			await ctx.replyWithHTML("Choose:", {
				parse_mode: "HTML",
				...Markup.keyboard([["Add new Services", "Delete Service"], ["Back>"]])
					.oneTime()
					.resize(),
			});
		} catch (error) {
			console.log(error);
		}
	}
	async onAddServices(ctx: Context) {
		try {
			const admin_id = String(ctx.from!.id);
			await this.adminsModel.update(
				{ actions: "addingservice" },
				{ where: { user_id: admin_id } }
			);
			await ctx.replyWithHTML("Enter a new services name:", {
				parse_mode: "HTML",
				...Markup.removeKeyboard(),
			});
		} catch (error) {
			console.log(error);
		}
	}
	async onRemoveServices(ctx: Context) {
		try {
			const services = await this.buttonsModel.findAll();
			const buttons: any[] = [];
			let temp: any[] = [];
			let counter = 0;
			for (const svc of services) {
				counter++;
				temp.push({
					text: `${svc.datas}`,
					callback_data: `del_${svc.datas}_${svc.id}`,
				});
				if (counter % 2 === 0) {
					buttons.push(temp);
					temp = [];
				}
			}
			if (temp.length > 0) {
				buttons.push(temp);
			}
			await ctx.replyWithHTML("Select removing service:", {
				reply_markup: {
					inline_keyboard: buttons,
				},
			});
		} catch (error) {
			console.log(error);
		}
	}
	async onRemovingServices(ctx: Context) {
		try {
			const contextAction = ctx.callbackQuery!["data"];
			const contextMessage = ctx.callbackQuery!["message"];
			const service_id = contextAction.split("_")[2];
			const serviceName = contextAction.split("_")[1];
			ctx.deleteMessage(contextMessage?.message_id);
			await ctx.replyWithHTML(`${serviceName} removed 🗑.`, {
				parse_mode: "HTML",
				...Markup.keyboard([["Add new Services", "Delete Service"], ["Back>"]])
					.oneTime()
					.resize(),
			});
			await this.buttonsModel.destroy({ where: { id: Number(service_id) } });
		} catch (error) {
			console.log(error);
		}
	}
	async onText(ctx: Context) {
		try {
			if ("text" in ctx.message!) {
				const admin_id = String(ctx.from?.id);
				const admin = await this.adminsModel.findOne({
					where: { user_id: admin_id },
				});
				const adminInput = ctx.message.text;
				if (admin?.actions == "addingservice") {
					await this.buttonsModel.create({
						datas: adminInput,
						addedBy: String(admin_id),
					});
					admin.actions = "writetouser";
					await admin.save();
					await ctx.replyWithHTML("New services added ✅", {
						parse_mode: "HTML",
						...Markup.keyboard([
							["Add new Services", "Delete Service"],
							["Back>"],
						])
							.oneTime()
							.resize(),
					});
				}
			}
		} catch (error) {
			console.log(error);
		}
	}
	async onBackMain(ctx: Context) {
		await ctx.replyWithHTML("Menu:", {
			parse_mode: "HTML",
			...Markup.keyboard([["<Master>", "<Customer>"], ["<Services>"]])
				.oneTime()
				.resize(),
		});
	}
}
