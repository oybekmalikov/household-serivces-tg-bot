import { InjectModel } from "@nestjs/sequelize";
import { Buttons } from "./bot/models/buttons.model";

export const BOT_NAME = "Household Services";
class ButtonsService {
	constructor(
		@InjectModel(Buttons) private readonly buttonModel: typeof Buttons
	) {}
	async addButton(forWho: string, btnName: string) {
		let btns = await this.buttonModel.findOne({
			where: { for_who: forWho },
		});
		btns!.datas += `|${btnName}`;
		await btns?.save();
	}
	async readButton(forWho: string) {
		let btns = await this.buttonModel.findOne({
			where: { for_who: forWho },
		});
		const buttons = btns?.datas.split("|");
		const filtered = buttons!.slice(1);
		const result: string[][] = [];
		for (let i = 0; i < filtered.length; i += 2) {
			result.push(filtered.slice(i, i + 2));
		}
		return result;
	}
}
var obj = new ButtonsService(Buttons);
export async function addServiceButton(name: string) {
	await obj.addButton("services", name);
}
export async function readServiceButton(name: string) {
	const btns = await obj.readButton("services");
	return btns;
}
