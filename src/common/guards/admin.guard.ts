import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { TelegrafException, TelegrafExecutionContext } from "nestjs-telegraf";
import { Context } from "telegraf";

@Injectable()
export class AdminGuard implements CanActivate {
	private readonly ADMIN = Number(process.env.ADMIN);
	async canActivate(context: ExecutionContext): Promise<boolean> {
		const ctx = TelegrafExecutionContext.create(context);
		const { from } = ctx.getContext<Context>();
		if (this.ADMIN != from!.id) {
			throw new TelegrafException("You are not an administrator, you do not have permission 🙅‍♂️");
		}
		return true;
	}
}
