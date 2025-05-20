import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { InjectBot } from "nestjs-telegraf";
import { Op } from "sequelize";
import { Context, Markup, Telegraf } from "telegraf";
import { BOT_NAME } from "../../app.constants";
import { Customer } from "../models/customer.model";
import { MasterCustomers } from "../models/master-customers.model";
import { Masters } from "../models/master.model";

@Injectable()
export class CustomerService {
	constructor(
		@InjectModel(Customer) private readonly customersModel: typeof Customer,
		@InjectModel(Masters) private readonly mastersModel: typeof Masters,
		@InjectModel(MasterCustomers)
		private readonly masterCustomerModel: typeof MasterCustomers,
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
		} else if (customer.status) {
			await ctx.replyWithHTML(`Welcome ${customer.name}`, {
				...Markup.keyboard([
					["My meetings", "Make an appointment"],
					["Services"],
				]).resize(),
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
				if (!customer?.status) {
					const name = ctx.message!.text;
					customer!.name = name;
					await customer?.save();
					await ctx.replyWithHTML("Enter your phone number:", {
						...Markup.keyboard([
							Markup.button.contactRequest("Send phone number"),
						]).resize(),
					});
				}
				const metting = await this.masterCustomerModel.findOne({
					where: { user_id },
				});
				if (metting?.last_state == "note") {
					metting.note = ctx.message.text;
					metting.status = "pending";
					metting.last_state = "finish";
					await metting.save();
					await ctx.replyWithHTML(`Metting Saved!`, {
						...Markup.keyboard([
							["My meetings", "Make an appointment"],
							["Services"],
						]).resize(),
					});
				}
				const customerF = await this.masterCustomerModel.findOne({
					where: { user_id: user_id },
				});
				if (customerF!.status == "feedback") {
					customerF!.feedback = ctx.message.text;
					customerF!.status = "complated";
					await customerF!.save();
					await ctx.replyWithHTML(`Thanks for your feedback:`, {
						...Markup.keyboard([
							["My meetings", "Make an appointment"],
							["Services"],
						]).resize(),
					});
				}
			} catch (error) {
				console.log("Error on custommer service:", error);
			}
		}
	}
	async onMyMettings(ctx: Context) {
		try {
			const user_id = String(ctx.message?.from.id);
			const meetings = await this.masterCustomerModel.findAll({
				where: { user_id },
			});
			if (!meetings.length) {
				await ctx.replyWithHTML(`You don't have any meetings yet.`, {
					...Markup.keyboard([
						["My meetings", "Make an appointment"],
						["Services"],
					]).resize(),
				});
			} else {
				let counter = 0;
				meetings.forEach(async (meeting) => {
					const master = await this.mastersModel.findOne({
						where: { user_id: meeting.master_id },
					});
					counter++;
					if (meeting.last_state == "finish") {
						await ctx.replyWithHTML(
							`<b>${counter}-Metting</b>
Master - ${master?.name}
Master's phone - ${master?.phone_number} 
Metting date - ${meeting.date}
Metting time - ${meeting.time}
Note for metting - ${meeting.note}
Metting status - ${meeting.status}
						`,
							{
								reply_markup: {
									inline_keyboard: [
										[
											{
												text: "Metting finished ✅",
												callback_data: `mettingfinished_${meeting.id}`,
											},
										],
										[
											{
												text: "Cancel the meeting ❌",
												callback_data: `cancelmetting_${meeting.id}`,
											},
										],
									],
								},
							}
						);
					} else {
						await ctx.replyWithHTML(`You don't have any meetings yet.`, {
							...Markup.keyboard([
								["My meetings", "Make an appointment"],
								["Services"],
							]).resize(),
						});
					}
				});
			}
		} catch (error) {
			console.log(error);
		}
	}
	async onMakeMetting(ctx: Context) {
		try {
			const user_id = String(ctx.from!.id);
			await this.masterCustomerModel.destroy({
				where: { user_id, last_state: { [Op.ne]: "finish" } },
			});
			await this.masterCustomerModel.create({
				user_id,
				last_state: "withwho",
			});
			const masters = await this.mastersModel.findAll();
			const buttons: any = [];
			let counter = 0;
			masters.forEach(async (master) => {
				counter++;
				const arr: any = [
					{
						text: `${counter} - ${master.name}, ${master.section}, ${master.phone_number}`,
						callback_data: `makeapp_${master.user_id}_${user_id}`,
					},
				];
				buttons.push(arr);
			});
			await ctx.replyWithHTML(`Choose the right master:`, {
				reply_markup: {
					inline_keyboard: buttons,
				},
			});
		} catch (error) {
			console.log(error);
		}
	}
	generateTimeSlots(
		startTime: string,
		endTime: string,
		stepMinutes: number,
		user_id: string
	) {
		const main: any[] = [];
		const times: any[] = [];
		const [startHour, startMinute] = startTime.split(":").map(Number);
		const [endHour, endMinute] = endTime.split(":").map(Number);
		let current = new Date();
		current.setHours(startHour, startMinute, 0, 0);
		const end = new Date();
		end.setHours(endHour, endMinute, 0, 0);
		while (current <= end) {
			const hours = current.getHours().toString().padStart(2, "0");
			const minutes = current.getMinutes().toString().padStart(2, "0");
			times.push({
				text: `${hours}:${minutes}`,
				callback_data: `timeformetting_${hours}:${minutes}_${user_id}`,
			});
			if (times.length === 4) {
				main.push([...times]);
				times.length = 0;
			}
			current.setMinutes(current.getMinutes() + stepMinutes);
		}
		if (times.length > 0) {
			main.push([...times]);
		}
		return main;
	}

	async onMettingStepWithWho(ctx: Context) {
		try {
			const contextAction = ctx.callbackQuery!["data"];
			const contextMessage = ctx.callbackQuery!["message"];
			const user_id = contextAction.split("_")[2];
			const master_id = contextAction.split("_")[1];
			const makker = await this.masterCustomerModel.findOne({
				where: { user_id, last_state: "withwho" },
			});
			if (makker) {
				makker.master_id = master_id;
				makker.last_state = "time";
				await makker.save();
				await ctx.deleteMessage(contextMessage?.message_id);
				const master = await this.mastersModel.findOne({
					where: { user_id: master_id },
				});
				const startTime = master?.work_start_time!;
				const endTime = master?.work_end_time!;
				const step = Number(master?.avgtime_for_custommer.split(" ")[0]);
				const buttons = this.generateTimeSlots(
					startTime,
					endTime,
					step + 20,
					user_id
				);
				await ctx.replyWithHTML(`Choose the metting time:`, {
					reply_markup: {
						inline_keyboard: buttons,
					},
				});
			}
		} catch (error) {
			console.log(error);
		}
	}
	getNext7Days(startDate: Date, user_id: string): object[] {
		const result: object[] = [];
		for (let i = 0; i < 7; i++) {
			const date = new Date(startDate);
			date.setDate(startDate.getDate() + i);

			const year = date.getFullYear();
			const month = String(date.getMonth() + 1).padStart(2, "0");
			const day = String(date.getDate()).padStart(2, "0");

			result.push({
				text: `${year}-${month}-${day}`,
				callback_data: `dateformeeting_${year}-${month}-${day}_${user_id}`,
			});
		}

		return result;
	}

	async onMettingStepTime(ctx: Context) {
		try {
			const contextAction = ctx.callbackQuery!["data"];
			const contextMessage = ctx.callbackQuery!["message"];
			const user_id = contextAction.split("_")[2];
			const time = contextAction.split("_")[1];
			const makker = await this.masterCustomerModel.findOne({
				where: { user_id, last_state: "time" },
			});
			if (makker) {
				makker.time = time;
				makker.last_state = "date";
				await makker.save();
				await ctx.deleteMessage(contextMessage?.message_id);
				const datas = this.getNext7Days(new Date(), user_id);
				const buttons: any = [];
				buttons.push([datas[0], datas[1]]);
				buttons.push([datas[2], datas[3]]);
				buttons.push([datas[4], datas[5]]);
				buttons.push([datas[6]]);
				await ctx.replyWithHTML(`Choose the metting date:`, {
					reply_markup: {
						inline_keyboard: buttons,
					},
				});
			}
		} catch (error) {
			console.log(error);
		}
	}
	async onMettingStepDate(ctx: Context) {
		try {
			const contextAction = ctx.callbackQuery!["data"];
			const contextMessage = ctx.callbackQuery!["message"];
			const user_id = contextAction.split("_")[2];
			const date = contextAction.split("_")[1];
			const makker = await this.masterCustomerModel.findOne({
				where: { user_id, last_state: "date" },
			});
			if (makker) {
				makker.date = date;
				makker.last_state = "note";
				makker.status = "pending";
				await makker.save();
				await ctx.deleteMessage(contextMessage?.message_id);
				await ctx.replyWithHTML(`Now, you can add not for this metting:`, {
					...Markup.keyboard([["Ignore Note for Metting"]]).resize(),
				});
			}
		} catch (error) {
			console.log(error);
		}
	}
	async onIgnoreNote(ctx: Context) {
		try {
			const user_id = String(ctx.from?.id);
			const customers = await this.masterCustomerModel.findAll({
				where: { user_id: user_id },
			});
			customers.forEach(async (customer) => {
				if (customer?.last_state == "note" && customer.status != "complated") {
					customer.note = "Ignored";
					customer.status = "pending";
					customer.last_state = "finish";
					await customer.save();
					await ctx.replyWithHTML(`Metting Saved!`, {
						...Markup.keyboard([
							["My meetings", "Make an appointment"],
							["Services"],
						]).resize(),
					});
				}
			});
		} catch (error) {
			console.log(error);
		}
	}
	async onMettingFinished(ctx: Context) {
		try {
			const contextAction = ctx.callbackQuery!["data"];
			const contextMessage = ctx.callbackQuery!["message"];
			const metting_id = contextAction.split("_")[1];
			const makker = await this.masterCustomerModel.findOne({
				where: { id: metting_id },
			});
			if (makker) {
				makker.status = "complated";
				await makker.save();
				await ctx.deleteMessage(contextMessage?.message_id);
				await ctx.replyWithHTML(`Rate the meeting:`, {
					reply_markup: {
						inline_keyboard: [
							[
								{
									text: "⭐",
									callback_data: `markformetting_${1}_${metting_id}`,
								},
								{
									text: "⭐⭐",
									callback_data: `markformetting_${2}_${metting_id}`,
								},
							],
							[
								{
									text: "⭐⭐⭐",
									callback_data: `markformetting_${3}_${metting_id}`,
								},
								{
									text: "⭐⭐⭐⭐",
									callback_data: `markformetting_${4}_${metting_id}`,
								},
							],
							[
								{
									text: "⭐⭐⭐⭐⭐",
									callback_data: `markformetting_${5}_${metting_id}`,
								},
							],
						],
					},
				});
			}
		} catch (error) {
			console.log(error);
		}
	}
	async onCancelMetting(ctx: Context) {
		try {
			const contextAction = ctx.callbackQuery!["data"];
			const contextMessage = ctx.callbackQuery!["message"];
			const metting_id = contextAction.split("_")[1];
			const makker = await this.masterCustomerModel.findOne({
				where: { id: metting_id },
			});
			if (makker) {
				await ctx.deleteMessage(contextMessage?.message_id);
				await ctx.replyWithHTML(
					`Are you sure you want to cancel the meeting?:`,
					{
						reply_markup: {
							inline_keyboard: [
								[
									{
										text: "Yes",
										callback_data: `cancelYes_${metting_id}`,
									},
									{
										text: "No",
										callback_data: `cancelNo_${metting_id}`,
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
	async onCancelMettingYes(ctx: Context) {
		try {
			const contextAction = ctx.callbackQuery!["data"];
			const contextMessage = ctx.callbackQuery!["message"];
			const metting_id = contextAction.split("_")[1];
			const makker = await this.masterCustomerModel.findOne({
				where: { id: metting_id },
			});
			if (makker) {
				await this.masterCustomerModel.destroy({ where: { id: metting_id } });
				await ctx.deleteMessage(contextMessage?.message_id);
				await ctx.replyWithHTML(`Metting canceled!`, {
					...Markup.keyboard([
						["My meetings", "Make an appointment"],
						["Services"],
					]).resize(),
				});
			}
		} catch (error) {
			console.log(error);
		}
	}
	async onCancelMettingNo(ctx: Context) {
		try {
			const contextAction = ctx.callbackQuery!["data"];
			const contextMessage = ctx.callbackQuery!["message"];
			const metting_id = contextAction.split("_")[1];
			const makker = await this.masterCustomerModel.findOne({
				where: { id: metting_id },
			});
			if (makker) {
				const master = await this.mastersModel.findOne({
					where: { user_id: makker.master_id },
				});
				return await ctx.editMessageText(`<b>${metting_id}-Metting</b>
Master - ${master?.name}
Master's phone - ${master?.phone_number} 
Metting date - ${makker.date}
Metting time - ${makker.time}
Note for metting - ${makker.note}
Metting status - ${makker.status}
						`);
			}
		} catch (error) {
			console.log(error);
		}
	}
	async onMarkMetting(ctx: Context) {
		try {
			const contextAction = ctx.callbackQuery!["data"];
			const contextMessage = ctx.callbackQuery!["message"];
			const metting_id = contextAction.split("_")[2];
			const mark = contextAction.split("_")[1];
			const makker = await this.masterCustomerModel.findOne({
				where: { id: metting_id },
			});
			if (makker) {
				makker.mark = Number(mark);
				makker.status = "feedback";
				await makker.save();
				await ctx.deleteMessage(contextMessage?.message_id);
				await ctx.replyWithHTML(`Now, you can give a feedback for master:`, {
					...Markup.keyboard([["Ignore Feedback"]]).resize(),
				});
			}
		} catch (error) {
			console.log(error);
		}
	}
	async onIgnoreFeefback(ctx: Context) {
		try {
			const user_id = String(ctx.from?.id);
			const customer = await this.masterCustomerModel.findOne({
				where: { user_id: user_id },
			});
			if ((customer!.status = "feedback")) {
				customer!.feedback = "Ignored";
				customer!.status = "complated";
				await customer!.save();
				await ctx.replyWithHTML(`Choose menu:`, {
					...Markup.keyboard([
						["My meetings", "Make an appointment"],
						["Services"],
					]).resize(),
				});
			}
		} catch (error) {
			console.log(error);
		}
	}
}
