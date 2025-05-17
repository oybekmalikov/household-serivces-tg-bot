import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { InjectBot } from "nestjs-telegraf";
import { Context, Markup, Telegraf } from "telegraf";
import { BOT_NAME } from "../../app.constants";
import { ChatWithAdmin } from "../models/chat-with-admin.model";
import { Masters } from "../models/master.model";

@Injectable()
export class MasterService {
	constructor(
		@InjectModel(Masters) private readonly mastersModel: typeof Masters,
		@InjectModel(ChatWithAdmin)
		private readonly chatWithAdminModel: typeof ChatWithAdmin,
		@InjectBot(BOT_NAME) private readonly bot: Telegraf<Context>
	) {}
	async showOccupation(ctx: Context) {
		try {
			await ctx.replyWithHTML("Select the desired section:", {
				...Markup.keyboard([
					["Hairdresser", "Beauty Salon"],
					["Jewelry Workshop", "Watchmaker"],
					["Shoe Workshop"],
				]).resize(),
			});
		} catch (error) {
			console.log(`Error on show Occupation: `, error);
		}
	}
	async onMaster(ctx: Context, occup: string) {
		try {
			const master_id = String(ctx.from!.id);
			const master = await this.mastersModel.findOne({
				where: { user_id: master_id },
			});
			if (!master) {
				await this.mastersModel.create({
					user_id: String(ctx.message!.from.id),
					section: occup,
				});
			} else if (master.last_state == "finish" && master.section == occup) {
				return await ctx.reply("You are already registered", {
					...Markup.removeKeyboard(),
				});
			} else if (master.withAdmin == "rejected") {
				await this.mastersModel.destroy({ where: { user_id: master_id } });
			}
			return this.onText(ctx);
		} catch (error) {
			console.log("Error on onMaster: ", error);
		}
	}
	async onText(ctx: Context) {
		if ("text" in ctx.message!) {
			try {
				const master_id = String(ctx.from?.id);
				const master: Masters | null = await this.mastersModel.findOne({
					where: { user_id: master_id },
				});
				const userInput = ctx.message!.text;
				if (master?.isWritingToAdmin) {
					await this.chatWithAdminModel.create({
						senderId: master_id,
						adminId: String(process.env.ADMIN),
						requestContent: userInput,
						responseContent:"not_yet"
					});
					await this.bot.telegram.sendMessage(
						Number(process.env.ADMIN),
						userInput
					);
					master.isWritingToAdmin = false;
					await master.save();
					await ctx.replyWithHTML(
						"We sent your message to admin, please wait admin's response",
						{
							...Markup.removeKeyboard(),
						}
					);
				}
				switch (master?.last_state) {
					case null:
						master!.last_state = "name";
						await master?.save();
						await ctx.reply("Enter your name:", {
							parse_mode: "HTML",
							...Markup.removeKeyboard(),
						});
						break;
					case "name":
						master.name = userInput;
						master!.last_state = "phone_number";
						await master?.save();
						await ctx.reply("Enter your phone number:", {
							parse_mode: "HTML",
							...Markup.keyboard([
								[Markup.button.contactRequest("Send Phone Number")],
							]).resize(),
						});
						break;
					case "workshop_name":
						master.workshop_name = userInput;
						master!.last_state = "address";
						await master?.save();
						await ctx.reply("Enter your workshop's address:", {
							parse_mode: "HTML",
							...Markup.keyboard([["Ignore Workshop address"]]).resize(),
						});
						break;
					case "address":
						master.address = userInput;
						master!.last_state = "target";
						await master?.save();
						await ctx.reply("Enter your workshop's target:", {
							parse_mode: "HTML",
							...Markup.keyboard([["Ignore Workshop target"]]).resize(),
						});
						break;
					case "target":
						master.target_for_address = userInput;
						master!.last_state = "location";
						await master?.save();
						await ctx.reply("Enter your workshop's location:", {
							parse_mode: "HTML",
							...Markup.keyboard([
								[Markup.button.locationRequest("Send location")],
							]).resize(),
						});
						break;
					case "start_time":
						master.work_start_time = userInput;
						master!.last_state = "end_time";
						await master?.save();
						await ctx.reply("Enter your end time:\nFor example: 18:00", {
							parse_mode: "HTML",
							...Markup.removeKeyboard(),
						});
						break;
					case "end_time":
						master.work_end_time = userInput;
						master!.last_state = "avg_time";
						await master?.save();
						await ctx.reply(
							"Enter the average time spent per customer:\nFor example: 30 min",
							{
								parse_mode: "HTML",
								...Markup.removeKeyboard(),
							}
						);
						break;
					case "avg_time":
						master.avgtime_for_custommer = userInput;
						master!.last_state = "pending";
						master!.withAdmin = "pending";
						await master?.save();
						await this.bot.telegram.sendMessage(
							Number(process.env.ADMIN),
							`<b>New master registred, confirm this?</b>
1. Name - ${master.name}
2. Phone number - ${master.phone_number}
3. Workshop name - ${master.workshop_name ? master.workshop_name : "Ignored"}
4. Workshop address - ${master.address ? master.address : "Ignored"}
5. Workshop target - ${master.target_for_address ? master.target_for_address : "Ignored"}
6. Location - ${master.location}
7. Time to start work - ${master.work_start_time}
8. Time to finish work - ${master.work_end_time}
9. Avarage time spent per customer - ${master.avgtime_for_custommer}
<b>Confirm this information?</b>`,
							{
								reply_markup: {
									inline_keyboard: [
										[
											{
												text: "Confirm",
												callback_data: `confirm_${master_id}`,
											},
											{
												text: "Reject",
												callback_data: `reject_${master_id}`,
											},
										],
									],
								},
							}
						);
						await ctx.replyWithHTML(
							`1. Name - ${master.name}
2. Phone number - ${master.phone_number}
3. Workshop name - ${master.workshop_name ? master.workshop_name : "Ignored"}
4. Workshop address - ${master.address ? master.address : "Ignored"}
5. Workshop target - ${master.target_for_address ? master.target_for_address : "Ignored"}
6. Location - ${master.location}
7. Time to start work - ${master.work_start_time}
8. Time to finish work - ${master.work_end_time}
9. Avarage time spent per customer - ${master.avgtime_for_custommer}
<b>We sent your data to admin please wait a little or click Check</b>
							`,
							{
								parse_mode: "HTML",
								...Markup.keyboard([
									["Check", "Reject"],
									["Write to Admin"],
								]).resize(),
							}
						);
						break;
				}
			} catch (error) {
				console.log("Error on onMaster: ", error);
			}
		}
	}
	async onIgnoreWorkshopName(ctx: Context) {
		try {
			const master_id = String(ctx.from?.id);
			const master = await this.mastersModel.findOne({
				where: { user_id: master_id },
			});
			master!.workshop_name = null!;
			master!.last_state = "address";
			await master?.save();
			await ctx.reply("Enter your workshop's address:", {
				parse_mode: "HTML",
				...Markup.keyboard([["Ignore Workshop address"]]).resize(),
			});
		} catch (error) {
			console.log(`Error on onIgnoreWorkshopName: `, error);
		}
	}
	async onIgnoreWorkshopAddress(ctx: Context) {
		try {
			const master_id = String(ctx.from?.id);
			const master = await this.mastersModel.findOne({
				where: { user_id: master_id },
			});
			master!.address = null!;
			master!.last_state = "target";
			await master?.save();
			await ctx.reply("Enter your workshop's target:", {
				parse_mode: "HTML",
				...Markup.keyboard([["Ignore Workshop target"]]).resize(),
			});
		} catch (error) {
			console.log(`Error on onIgnoreWorkshopAddress: `, error);
		}
	}
	async onIgnoreWorkshopTarget(ctx: Context) {
		try {
			const master_id = String(ctx.from?.id);
			const master = await this.mastersModel.findOne({
				where: { user_id: master_id },
			});
			master!.target_for_address = null!;
			master!.last_state = "location";
			await master?.save();
			await ctx.reply("Enter your workshop's location:", {
				parse_mode: "HTML",
				...Markup.keyboard([
					[Markup.button.locationRequest("Send location")],
				]).resize(),
			});
		} catch (error) {
			console.log(`Error on onIgnoreWorkshopAddress: `, error);
		}
	}
	async onConfirm(ctx: Context) {
		try {
			const user_id = String(ctx.from?.id);
			const master = await this.mastersModel.findOne({ where: { user_id } });
			if (!master) {
				await ctx.replyWithHTML(`Please click the <b>Start</b> button.`, {
					...Markup.keyboard([[`/start`]])
						.oneTime()
						.resize(),
				});
			} else if (
				master.last_state == "pending" &&
				master.withAdmin == "pending"
			) {
				await ctx.replyWithHTML(
					"The admin has not yet verified your information, please wait until the admin verifies your information or contact the admin.",
					{
						parse_mode: "HTML",
						...Markup.keyboard([
							["Check", "Reject"],
							["Write to Admin"],
						]).resize(),
					}
				);
			} else if (
				master.last_state == "pending" &&
				master.withAdmin == "confirmed"
			) {
				master.withAdmin = "confirmed";
				await master.save();
				await ctx.replyWithHTML(
					`🎉 Congratulations, you've successfully registered!`,
					{
						...Markup.keyboard([
							["Customers", "Time", "Rating"],
							["Edit my data"],
						]).resize(),
					}
				);
			} else if (
				master.last_state == "pending" &&
				master.withAdmin == "rejected"
			) {
				master.withAdmin = "rejected";
				await master.save();
				await ctx.replyWithHTML(
					`Admin rejected your data, please click <b>start</b> to register again or contact with admin`,
					{
						...Markup.keyboard([[`/start`]]).resize(),
					}
				);
			}
		} catch (error) {
			console.log(`Error on confirm: `, error);
		}
	}
	async onReject(ctx: Context) {
		try {
			const user_id = String(ctx.from?.id);
			const master = await this.mastersModel.findOne({ where: { user_id } });
			if (!master) {
				await ctx.replyWithHTML(`Please click the <b>Start</b> button.`, {
					...Markup.keyboard([[`/start`]])
						.oneTime()
						.resize(),
				});
			} else if (master.last_state == "pending") {
				await this.mastersModel.destroy({ where: { user_id: master.user_id } });
				await ctx.replyWithHTML(
					`Your information was not verified, click <b>start</b> to register again.`,
					{
						...Markup.keyboard([[`/start`]])
							.oneTime()
							.resize(),
					}
				);
			}
		} catch (error) {
			console.log(`Error on reject: `, error);
		}
	}
	async confirmMasters(ctx: Context) {
		const contextAction = ctx.callbackQuery!["data"];
		// const contextMessage = ctx.callbackQuery!["message"];
		const masterId = contextAction.split("_")[1];
		await this.mastersModel.update(
			{ withAdmin: "confirmed" },
			{ where: { user_id: masterId } }
		);
		await ctx.editMessageText(`Confirmed, user_id=${masterId}`);
	}
	async rejectMaster(ctx: Context) {
		const contextAction = ctx.callbackQuery!["data"];
		// const contextMessage = ctx.callbackQuery!["message"];
		const masterId = contextAction.split("_")[1];
		await this.mastersModel.update(
			{ withAdmin: "rejected" },
			{ where: { user_id: masterId } }
		);
		await ctx.editMessageText(`Rejected, user_id=${masterId}`);
	}
	async onWriteToAdmin(ctx: Context) {
		try {
			const user_id = ctx.message?.from.id;
			await this.mastersModel.update(
				{ isWritingToAdmin: true },
				{ where: { user_id } }
			);
			await ctx.replyWithHTML(`Write your problem, we will send it to Admin:`, {
				...Markup.removeKeyboard(),
			});
		} catch (error) {
			console.log(error);
		}
	}
}
