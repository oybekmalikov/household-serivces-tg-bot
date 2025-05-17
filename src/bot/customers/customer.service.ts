import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { InjectBot } from "nestjs-telegraf";
import { Context, Markup, Telegraf } from "telegraf";
import { BOT_NAME } from "../../app.constants";
import { Customer } from "../models/customer.model";

@Injectable()
export class CustomerService {
	constructor(
		@InjectModel(Customer) private readonly customersModel: typeof Customer,
		@InjectBot(BOT_NAME) private readonly bot: Telegraf<Context>
	) {}
	async registerCustomer(ctx: Context) {
		const customer_id = String(ctx.from!.id);
		const customer = await this.customersModel.findOne({
			where: { user_id: customer_id },
		});
		if (!customer) {
			await this.customersModel.create({
				user_id: String(ctx.message!.from.id),
			});
			await ctx.replyWithHTML(`Enter your name: `, {
				...Markup.removeKeyboard(),
			});
		} else {
			await this.customersModel.destroy({ where: { user_id: customer_id } });
			await ctx.replyWithHTML(`Please, click <b>start</b> button:`, {
				...Markup.keyboard([["/start"]]).resize(),
			});
		}
	}
	async onText(ctx: Context) {
		if ("text" in ctx.message!) {
			try {
				const user_id = String(ctx.from?.id);
				const customer = await this.customersModel.findOne({
					where: { user_id },
				});
				const name = ctx.message!.text;
				customer!.name = name;
				await customer?.save();
				await ctx.replyWithHTML("Enter your phone number:", {
					...Markup.keyboard([
						Markup.button.contactRequest("Send phone number"),
					]).resize(),
				});
			} catch (error) {
				console.log("Error on custommer service:", error);
			}
		}
	}
}
