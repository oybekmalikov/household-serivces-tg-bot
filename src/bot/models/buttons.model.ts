import { Column, DataType, Model, Table } from "sequelize-typescript";

interface IButtonsCreationAttr {
	for_who?: string;
	datas?: string;
}
@Table({ tableName: "buttons", freezeTableName: true })
export class Buttons extends Model<Buttons, IButtonsCreationAttr> {
	@Column({ type: DataType.INTEGER, autoIncrement: true, primaryKey: true })
	declare id: number;
	@Column({ type: DataType.STRING, unique: true })
	declare for_who: string;
	@Column({ type: DataType.TEXT })
	declare datas: string;
}
