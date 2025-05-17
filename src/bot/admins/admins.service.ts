import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { InjectBot } from "nestjs-telegraf";
import { Context, Telegraf } from "telegraf";
import { BOT_NAME } from "../../app.constants";
import { ChatWithAdmin } from "../models/chat-with-admin.model";
import { Masters } from "../models/master.model";

@Injectable()
export class AdminService {
	constructor(
		@InjectModel(Masters) private readonly mastersModel: typeof Masters,
		@InjectModel(ChatWithAdmin)
		private readonly chatWithAdminModel: typeof ChatWithAdmin,
		@InjectBot(BOT_NAME) private readonly bot: Telegraf<Context>
	) {}
	async responseToMaster(ctx: Context) {
		if (
			"text" in ctx.message! &&
			String(ctx.from?.id) == String(process.env.ADMIN)
		) {
			const user_id = await this.chatWithAdminModel.findOne({
				where: { responseContent: "not_yet" },
			});
			const text = ctx.message.text;
			user_id!.responseContent = text;
			this.bot.telegram.sendMessage(Number(user_id?.senderId), text);
		}
	}
}
