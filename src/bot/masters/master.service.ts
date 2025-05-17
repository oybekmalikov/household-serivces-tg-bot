import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { Context, Markup } from "telegraf";
import { Masters } from "../models/master.model";

@Injectable()
export class MasterService {
	constructor(
		@InjectModel(Masters) private readonly mastersModel: typeof Masters
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
			const master_id = ctx.from!.id;
			const master: Masters | null = await this.mastersModel.findOne({
				where: { user_id: master_id },
			});
			if (!master) {
				await this.mastersModel.create({
					user_id: ctx.message!.from.id,
					section: occup,
				});
			} else if (master.last_state == "finish" && master.section == occup) {
				return await ctx.reply("You are already registered", {
					...Markup.removeKeyboard(),
				});
			}
			return this.onText(ctx);
		} catch (error) {
			console.log("Error on onMaster: ", error);
		}
	}
	async onText(ctx: Context) {
		if ("text" in ctx.message!) {
			try {
				const master_id = ctx.from?.id;
				const master: Masters | null = await this.mastersModel.findOne({
					where: { user_id: master_id },
				});

				const userInput = ctx.message!.text;
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
						await master?.save();
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
<b>Confirm this information?</b>
							`,
							{
								parse_mode: "HTML",
								...Markup.keyboard([["Confirm", "Reject"]]).resize(),
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
			const master_id = ctx.from?.id;
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
			const master_id = ctx.from?.id;
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
			const master_id = ctx.from?.id;
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
			const user_id = ctx.from?.id;
			const master = await this.mastersModel.findOne({ where: { user_id } });
			if (!master) {
				await ctx.replyWithHTML(`Please click the <b>Start</b> button.`, {
					...Markup.keyboard([[`/start`]])
						.oneTime()
						.resize(),
				});
			} else if (master.last_state == "pending") {
				master.last_state = "finish";
				master.status = true;
				await master.save();
				await ctx.replyWithHTML(
					`🎉 Congratulations, you've successfully registered!`,
					{
						...Markup.removeKeyboard(),
					}
				);
			}
		} catch (error) {
			console.log(`Error on confirm: `, error);
		}
	}
	async onReject(ctx: Context) {
		try {
			const user_id = ctx.from?.id;
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
}
