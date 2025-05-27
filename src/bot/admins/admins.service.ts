import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { InjectBot } from "nestjs-telegraf";
import { Context, Markup, Telegraf } from "telegraf";
import { BOT_NAME } from "../../app.constants";
import { Admin } from "../models/admin.model";
import { Buttons } from "../models/buttons.model";
import { ChatWithAdmin } from "../models/chat-with-admin.model";
import { Customer } from "../models/customer.model";
import { Masters } from "../models/master.model";

@Injectable()
export class AdminService {
	constructor(
		@InjectModel(Masters) private readonly mastersModel: typeof Masters,
		@InjectModel(Customer) private readonly customersModel: typeof Customer,
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
				} else if (admin?.actions.startsWith("sendmsg_")) {
					const master_id = admin.actions.split("_")[1];
					try {
						await this.bot.telegram.sendMessage(Number(master_id), adminInput);
					} catch (err) {}
					admin.actions = "writetouser";
					await admin.save();
					await ctx.replyWithHTML("Message sent", {
						parse_mode: "HTML",
						...Markup.keyboard([
							["Show all masters "],
							["Send message to all masters"],
							["Back>"],
						])
							.oneTime()
							.resize(),
					});
				} else if (admin?.actions == "sendmsgtoallmasters") {
					const masters = await this.mastersModel.findAll();
					for (const master of masters) {
						try {
							await this.bot.telegram.sendMessage(
								Number(master.user_id),
								adminInput
							);
						} catch (err) {}
					}
					admin.actions = "writetouser";
					await admin.save();
					await ctx.replyWithHTML("Message sent to all masters", {
						parse_mode: "HTML",
						...Markup.keyboard([
							["Show all masters "],
							["Send message to all masters"],
							["Back>"],
						])
							.oneTime()
							.resize(),
					});
				} else if (admin?.actions == "sendmsgtoallcustomers") {
					const customers = await this.customersModel.findAll();
					for (const customer of customers) {
						try {
							await this.bot.telegram.sendMessage(
								Number(customer.user_id),
								adminInput
							);
						} catch (err) {}
					}
					admin.actions = "writetouser";
					await admin.save();
					await ctx.replyWithHTML("Message sent to all customers", {
						parse_mode: "HTML",
						...Markup.keyboard([
							["Show all customers "],
							["Send message to all customers"],
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
	async onMaster(ctx: Context) {
		try {
			await ctx.replyWithHTML("Choose:", {
				parse_mode: "HTML",
				...Markup.keyboard([
					["Show all masters"],
					["Send message to all masters"],
					["Back>"],
				])
					.oneTime()
					.resize(),
			});
		} catch (error) {
			console.log(error);
		}
	}
	async onCustomer(ctx: Context) {
		try {
			await ctx.replyWithHTML("Choose:", {
				parse_mode: "HTML",
				...Markup.keyboard([
					["Show all customers"],
					["Send message to all customers"],
					["Back>"],
				])
					.oneTime()
					.resize(),
			});
		} catch (error) {
			console.log(error);
		}
	}
	async onMasterList(ctx: Context) {
		try {
			const masters = await this.mastersModel.findAll();
			const buttons: any = [];
			let counter = 0;
			for (const master of masters) {
				counter++;
				const tmp: any = [];
				tmp.push({
					text: `${counter}. ${master.name}, ${master.phone_number}`,
					callback_data: `master_${master.user_id}`,
				});
				buttons.push(tmp);
			}
			if (counter == 0) {
				await ctx.replyWithHTML("Masters not found.", {
					parse_mode: "HTML",
					...Markup.keyboard([
						["Show all masters "],
						["Send message to all masters"],
						["Back>"],
					])
						.oneTime()
						.resize(),
				});
			} else {
				await ctx.replyWithHTML("All masters.", {
					reply_markup: {
						inline_keyboard: buttons,
					},
				});
			}
		} catch (error) {
			console.log(error);
		}
	}
	async onCustomerList(ctx: Context) {
		try {
			const customers = await this.customersModel.findAll();
			const buttons: any = [];
			let counter = 0;
			for (const customer of customers) {
				counter++;
				const tmp: any = [];
				tmp.push({
					text: `${counter}. ${customer.name}, ${customer.phone_number}`,
					callback_data: `customer_${customer.user_id}`,
				});
				buttons.push(tmp);
			}
			if (counter == 0) {
				await ctx.replyWithHTML("Customers not found.", {
					parse_mode: "HTML",
					...Markup.keyboard([
						["Show all customers "],
						["Send message to all customers"],
						["Back>"],
					])
						.oneTime()
						.resize(),
				});
			} else {
				await ctx.replyWithHTML("All customers.", {
					reply_markup: {
						inline_keyboard: buttons,
					},
				});
			}
		} catch (error) {
			console.log(error);
		}
	}
	async onEachMaster(ctx: Context) {
		try {
			const contextAction = ctx.callbackQuery!["data"];
			const contextMessage = ctx.callbackQuery!["message"];
			const master_id = contextAction.split("_")[1];
			const master = await this.mastersModel.findOne({
				where: { user_id: master_id },
			});
			if (!master) {
				await ctx.replyWithHTML("Masters not found.", {
					parse_mode: "HTML",
					...Markup.keyboard([
						["Show all masters "],
						["Send message to all masters"],
						["Back>"],
					])
						.oneTime()
						.resize(),
				});
			} else {
				ctx.deleteMessage(contextMessage?.message_id);
				await ctx.replyWithHTML(
					`1. Name - ${master.name}
2. Phone number - ${master.phone_number}
3. Workshop name - ${master.workshop_name ? master.workshop_name : "Not included"}
4. Workshop address - ${master.address ? master.address : "Not included"}
5. Workshop target - ${master.target_for_address ? master.target_for_address : "Not included"}
6. Location - ${master.location}
7. Time to start work - ${master.work_start_time}
8. Time to finish work - ${master.work_end_time}
9. Avarage time spent per customer - ${master.avgtime_for_custommer}
10. Avarage masters mark - ${master.rating == 5 ? "⭐⭐⭐⭐⭐" : master.rating >= 4 && master.rating < 5 ? "⭐⭐⭐⭐" : master.rating > 3 && master.rating < 4 ? "⭐⭐⭐" : "⭐⭐"}, (${Number(master.rating).toFixed(2)})
							`,
					{
						reply_markup: {
							inline_keyboard: [
								[
									{
										text: `❌ Disable`,
										callback_data: `disable_${master_id}`,
									},
									{
										text: `💬 Send Message`,
										callback_data: `sendmsg_${master_id}`,
									},
								],
								[
									{
										text: `🚫 Dismissal`,
										callback_data: `dismissal_${master_id}`,
									},
								],
							],
						},
					}
				);
			}
		} catch (error) {
			console.log(error);
		}
	}
	async onEachCustomer(ctx: Context) {
		try {
			const contextAction = ctx.callbackQuery!["data"];
			const contextMessage = ctx.callbackQuery!["message"];
			const customer_id = contextAction.split("_")[1];
			const customer = await this.customersModel.findOne({
				where: { user_id: customer_id },
			});
			if (!customer) {
				await ctx.replyWithHTML("Customer not found.", {
					parse_mode: "HTML",
					...Markup.keyboard([
						["Show all customers "],
						["Send message to all customers"],
						["Back>"],
					])
						.oneTime()
						.resize(),
				});
			} else {
				ctx.deleteMessage(contextMessage?.message_id);
				await ctx.replyWithHTML(
					`1. Name - ${customer.name}
2. Phone number - ${customer.phone_number}
3. Status - ${customer.status}
							`,
					{
						reply_markup: {
							inline_keyboard: [
								[
									{
										text: `🚫 BAN Customer`,
										callback_data: `ban_${customer_id}`,
									},
								],
							],
						},
					}
				);
			}
		} catch (error) {
			console.log(error);
		}
	}
	async onDisable(ctx: Context) {
		try {
			const contextAction = ctx.callbackQuery!["data"];
			const contextMessage = ctx.callbackQuery!["message"];
			const master_id = contextAction.split("_")[1];
			const master = await this.mastersModel.findOne({
				where: { user_id: master_id },
			});
			master!.withAdmin = "inactive";
			await master?.save();
			ctx.deleteMessage(contextMessage?.message_id);
			await ctx.replyWithHTML("Master has been deactivated.");
		} catch (error) {
			console.log(error);
		}
	}
	async onDismissial(ctx: Context) {
		try {
			const contextAction = ctx.callbackQuery!["data"];
			const contextMessage = ctx.callbackQuery!["message"];
			const master_id = contextAction.split("_")[1];
			await this.mastersModel.destroy({
				where: { user_id: master_id },
			});
			ctx.deleteMessage(contextMessage?.message_id);
			await ctx.replyWithHTML("Master was fired.");
		} catch (error) {
			console.log(error);
		}
	}
	async onSendMessage(ctx: Context) {
		try {
			const admin_id = String(ctx.from!.id);
			const contextAction = ctx.callbackQuery!["data"];
			const contextMessage = ctx.callbackQuery!["message"];
			const master_id = contextAction.split("_")[1];
			await this.adminsModel.update(
				{ actions: `sendmsg_${master_id}` },
				{ where: { user_id: admin_id } }
			);
			ctx.deleteMessage(contextMessage?.message_id);
			await ctx.replyWithHTML("💬 Send message:", {
				...Markup.removeKeyboard(),
			});
		} catch (error) {
			console.log(error);
		}
	}
	async onSendMessageToAllMasters(ctx: Context) {
		try {
			const admin_id = String(ctx.from!.id);
			await this.adminsModel.update(
				{ actions: `sendmsgtoallmasters` },
				{ where: { user_id: admin_id } }
			);
			await ctx.replyWithHTML("💬 Send message:", {
				...Markup.removeKeyboard(),
			});
		} catch (error) {
			console.log(error);
		}
	}
	async onSendMessageToAllCustomers(ctx: Context) {
		try {
			const admin_id = String(ctx.from!.id);
			await this.adminsModel.update(
				{ actions: `sendmsgtoallcustomers` },
				{ where: { user_id: admin_id } }
			);
			await ctx.replyWithHTML("💬 Send message:", {
				...Markup.removeKeyboard(),
			});
		} catch (error) {
			console.log(error);
		}
	}
	async onBanned(ctx: Context) {
		try {
			const contextAction = ctx.callbackQuery!["data"];
			const contextMessage = ctx.callbackQuery!["message"];
			const customer_id = contextAction.split("_")[1];
			await this.customersModel.destroy({
				where: { user_id: customer_id },
			});
			ctx.deleteMessage(contextMessage?.message_id);
			await ctx.replyWithHTML("Customer was Banned.");
		} catch (error) {
			console.log(error);
		}
	}
}
