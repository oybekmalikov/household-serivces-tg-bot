import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { Context, Markup } from "telegraf";
import { Masters } from "../models/master.model";

@Injectable()
export class MasterService {
	constructor(
		@InjectModel(Masters) private readonly mastersModel: typeof Masters
	) {}
	async onMaster(ctx: Context) {
		try {
			const master_id = ctx.from?.id;
			const master: Masters | null = await this.mastersModel.findOne({
				where: { user_id: master_id },
			});
			if (!master) {
				await this.mastersModel.create({
					user_id: ctx.message!.from.id,
				});
			} else if (master.last_state == "finish") {
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
						master!.last_state = "finish";
						master.status = true;
						await master?.save();
						await ctx.reply("🎉 Congrats you have successfully registered!", {
							parse_mode: "HTML",
							...Markup.removeKeyboard(),
						});
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
}
