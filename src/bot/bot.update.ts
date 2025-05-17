import { On, Start, Update } from "nestjs-telegraf";
import { Context } from "telegraf";
import { BotService } from "./bot.service";

@Update()
export class BotUpdate {
	constructor(private readonly botService: BotService) {}
	@Start()
	async onStart(ctx: Context) {
		return this.botService.start(ctx);
	}
	@On("contact")
	async onContact(ctx: Context) {
		return this.botService.onContact(ctx);
	}
	@On("location")
	async onLocation(ctx: Context) {
		return this.botService.onLocation(ctx);
	}
	@On("text")
	async onText(ctx: Context) {
		return this.botService.onText(ctx);
	}
}
