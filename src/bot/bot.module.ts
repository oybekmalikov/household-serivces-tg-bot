import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { BotService } from "./bot.service";
import { BotUpdate } from "./bot.update";
import { MasterService } from "./masters/master.service";
import { MasterUpdate } from "./masters/master.update";
import { Masters } from "./models/master.model";

@Module({
	imports: [SequelizeModule.forFeature([Masters])],
	controllers: [],
	providers: [BotService, MasterService, MasterUpdate, BotUpdate],
})
export class BotModule {}
