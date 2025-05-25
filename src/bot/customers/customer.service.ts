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
				if (customer && !customer?.status) {
					const name = ctx.message!.text;
					customer.name = name;
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
				if (customerF && customerF!.status == "feedback") {
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
	formatTimeButtons(
		input: string,
		user_id: string
	): { text: string; callback_data: string }[][] {
		const parts = input.split("||").filter(Boolean);
		const result: { text: string; callback_data: string }[][] = [];
		const row: { text: string; callback_data: string }[] = [];
		for (const part of parts) {
			const [timeRange, status] = part.split("|");
			// let emoji = status === "t" ? "✅" : "❌";
			let emoji = "";
			let tmp = "";
			if (status == "t") {
				emoji = "✅";
				tmp = "1";
			} else {
				emoji = "❌";
				tmp = "0";
			}
			const button = {
				text: `${timeRange} ${emoji}`,
				callback_data: `timeformetting_${timeRange}_${user_id}_${tmp}`,
			};
			row.push(button);
			if (row.length === 2) {
				result.push([...row]);
				row.length = 0;
			}
		}
		if (row.length) {
			result.push([...row]);
		}
		return result;
	}

	updateTimeSlotStatus(
		input: string,
		fromTime: string,
		toTime: string,
		newStatus: "t" | "f"
	): string {
		const parts = input.split("||").filter(Boolean);
		const updated = parts.map((part) => {
			const [timeRange, status] = part.split("|");
			if (timeRange === `${fromTime}-${toTime}`) {
				return `${timeRange}|${newStatus}`;
			}
			return part;
		});
		return updated.join("||");
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
				const buttons = this.formatTimeButtons(master!.times, user_id);
				await ctx.replyWithHTML(`Choose the metting time:`, {
					reply_markup: {
						inline_keyboard: buttons,
					},
				});
			} else {
				await this.masterCustomerModel.create({
					user_id,
					master_id,
					last_state: "withwho",
				});
				this.onMettingStepWithWho(ctx)
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
	isTimeSlotBusy(busyRanges: string, checkRange: string): boolean {
		if (!busyRanges || busyRanges == "") {
			return false;
		}
		const checkStart = checkRange.split("-")[0];
		const checkEnd = checkRange.split("-")[1];

		const busyList = busyRanges.split("||").filter(Boolean);

		for (const range of busyList) {
			const [start, end] = range.split("-");

			if (
				(checkStart >= start && checkStart < end) ||
				(checkEnd > start && checkEnd <= end) ||
				(checkStart <= start && checkEnd >= end)
			) {
				return true;
			}
		}

		return false;
	}

	async onMettingStepTime(ctx: Context) {
		try {
			const contextAction = ctx.callbackQuery!["data"];
			const contextMessage = ctx.callbackQuery!["message"];
			const user_id = contextAction.split("_")[2];
			const time = contextAction.split("_")[1];
			const st = contextAction.split("_")[3];
			const makker = await this.masterCustomerModel.findOne({
				where: { user_id, last_state: "time" },
			});
			const master = await this.mastersModel.findOne({
				where: { user_id: makker?.master_id },
			});
			const customer = await this.customersModel.findOne({
				where: { user_id },
			});
			if (st == "0") {
				const buttons = this.formatTimeButtons(master!.times, user_id);
				await ctx.replyWithHTML(
					`Master is busy on this time, please choose another metting time:`,
					{
						reply_markup: {
							inline_keyboard: buttons,
						},
					}
				);
			} else if (
				makker &&
				!this.isTimeSlotBusy(
					customer!.times,
					`${time.split(":")[0] - time.split(":")[1]}`
				)
			) {
				makker.time = time;
				let cstTime = customer!.times;
				cstTime += `||${time.split(":")[0] - time.split(":")[1]}`;
				customer!.times = cstTime;
				await customer?.save();
				const inputs = master!.times;
				master!.times = this.updateTimeSlotStatus(
					inputs,
					time.split("-")[0],
					time.split("-")[1],
					"f"
				);
				await master?.save();
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
			} else {
				const buttons = this.formatTimeButtons(master!.times, user_id);
				await ctx.replyWithHTML(
					`You have a metting on this time, please choose another metting time:`,
					{
						reply_markup: {
							inline_keyboard: buttons,
						},
					}
				);
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
	async onServices(ctx: Context) {
		try {
			await ctx.replyWithHTML("Select the desired section:", {
				...Markup.keyboard([
					["<Hairdresser>", "<Beauty Salon>"],
					["<Jewelry Workshop>", "<Watchmaker>"],
					["<Shoe Workshop>"],
					["<Back to Main>"],
				]).resize(),
			});
		} catch (error) {
			console.log(error);
		}
	}
	async onSections(ctx: Context, section: string) {
		try {
			if (section == "Back to Main") {
				await ctx.replyWithHTML(`Choose menu:`, {
					...Markup.keyboard([
						["My meetings", "Make an appointment"],
						["Services"],
					]).resize(),
				});
				return;
			}
			const masters = await this.mastersModel.findAll({
				where: { section },
			});
			if (!masters.length) {
				await ctx.replyWithHTML(`No masters found in section ${section}:`, {
					...Markup.keyboard([
						["<Hairdresser>", "<Beauty Salon>"],
						["<Jewelry Workshop>", "<Watchmaker>"],
						["<Shoe Workshop>"],
						["<Back to Main>"],
					]).resize(),
				});
			}
			let str = "";
			for (const master of masters) {
				str += `1. Name - ${master.name}
2. Phone number - ${master.phone_number}
3. Workshop name - ${master.workshop_name ? master.workshop_name : "Not included"}
4. Workshop address - ${master.address ? master.address : "Not included"}
5. Workshop target - ${master.target_for_address ? master.target_for_address : "Not included"}
6. Location - ${master.location}
7. Time to start work - ${master.work_start_time}
8. Time to finish work - ${master.work_end_time}
9. Avarage time spent per customer - ${master.avgtime_for_custommer}
10. Avarage masters mark - ${master.rating == 5 ? "⭐⭐⭐⭐⭐" : master.rating >= 4 && master.rating < 5 ? "⭐⭐⭐⭐" : master.rating > 3 && master.rating < 4 ? "⭐⭐⭐" : "⭐⭐"}, (${Number(master.rating).toFixed(2)})
							`;
			}
			await ctx.replyWithHTML(str, {
				...Markup.keyboard([
					["Get closest by location"],
					["Get by rating"],
					["<Back>"],
				]).resize(),
			});
		} catch (error) {
			console.log(error);
		}
	}

	deg2rad(deg: number): number {
		return deg * (Math.PI / 180);
	}
	getDistanceFromLatLonInKm(
		lat1: number,
		lon1: number,
		lat2: number,
		lon2: number
	): number {
		const R = 6371;
		const dLat = this.deg2rad(lat2 - lat1);
		const dLon = this.deg2rad(lon2 - lon1);
		const a =
			Math.sin(dLat / 2) ** 2 +
			Math.cos(this.deg2rad(lat1)) *
				Math.cos(this.deg2rad(lat2)) *
				Math.sin(dLon / 2) ** 2;
		const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
		return R * c;
	}
	async querySendCustomerLoc(ctx: Context) {
		try {
			const user_id = String(ctx.from!.id);
			await this.customersModel.update(
				{ actions: "sendlocation" },
				{ where: { user_id: String(user_id) } }
			);
			await ctx.replyWithHTML(`Send your location: `, {
				...Markup.keyboard([
					Markup.button.locationRequest("Send location"),
					"< Back",
				]).resize(),
			});
		} catch (error) {
			console.log(error);
		}
	}
	async findClosestByLocation(
		ctx: Context,
		lat: any,
		lon: any,
		userId: string
	) {
		try {
			const masters = await this.mastersModel.findAll();
			const distances: any = [];
			await this.masterCustomerModel.create({
				user_id: userId,
				last_state: "withwho",
			});

			let counter = 0;
			for (const master of masters) {
				const dist = this.getDistanceFromLatLonInKm(
					lat,
					lon,
					Number(master.location.split("|")[0]),
					Number(master.location.split("|")[1])
				);
				counter++;
				const distance: any = [];
				distance.push({
					text: `${counter}. ${master.name} ${master.section} ${(dist * 1000).toFixed(2)} m.`,
					callback_data: `makeapp_${master.user_id}_${userId}`,
				});
				distances.push(distance);
			}
			await ctx.replyWithHTML("Closest masters:", {
				reply_markup: {
					inline_keyboard: distances,
				},
			});
		} catch (error) {
			console.log(error);
		}
	}
	async backGetCloseLoc(ctx: Context) {
		await this.customersModel.update(
			{ actions: "" },
			{ where: { user_id: String(ctx.from!.id) } }
		);
		await ctx.replyWithHTML(`Choose:`, {
			...Markup.keyboard([
				["Get closest by location"],
				["Get by rating"],
				["<Back>"],
			]).resize(),
		});
	}
	async getByRating(ctx: Context) {
		try {
			const userId = String(ctx.from!.id);
			const masters = await this.mastersModel.findAll();
			for (let i = 0; i < masters.length - 1; i++) {
				for (let j = 0; j < masters.length - i - 1; j++) {
					if (masters[j].rating < masters[j + 1].rating) {
						[masters[j], masters[j + 1]] = [masters[j + 1], masters[j]];
					}
				}
			}
			const btns: any = [];
			let counter = 0;
			for (const master of masters) {
				counter++;
				const tmp: any = [];
				tmp.push({
					text: `${counter}. ${master.name} ${master.section} ${master.rating == 5 ? "⭐⭐⭐⭐⭐" : master.rating >= 4 && master.rating < 5 ? "⭐⭐⭐⭐" : master.rating > 3 && master.rating < 4 ? "⭐⭐⭐" : "⭐⭐"}, (${Number(master.rating).toFixed(2)})`,
					callback_data: `makeapp_${master.user_id}_${userId}`,
				});
				btns.push(tmp);
			}
			await ctx.replyWithHTML("Choose:", {
				reply_markup: {
					inline_keyboard: btns,
				},
			});
		} catch (error) {
			console.log(error);
		}
	}
}
