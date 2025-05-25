import { Column, DataType, Model, Table } from "sequelize-typescript";

interface IButtonsCreationAttr {
	datas?: string;
	addedBy?: string;
}
@Table({ tableName: "buttons", freezeTableName: true })
export class Buttons extends Model<Buttons, IButtonsCreationAttr> {
	@Column({ type: DataType.INTEGER, autoIncrement: true, primaryKey: true })
	declare id: number;
	@Column({ type: DataType.TEXT })
	declare datas: string;
	@Column({ type: DataType.STRING })
	declare addedBy: string;
}

