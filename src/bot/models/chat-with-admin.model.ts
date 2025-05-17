import { Column, DataType, Model, Table } from "sequelize-typescript";

interface IMastersCreationAttr {
	senderId: number;
	adminId: number;
	msgContent: string;
}

@Table({ tableName: "masters", freezeTableName: true })
export class Masters extends Model<Masters, IMastersCreationAttr> {
	@Column({ type: DataType.INTEGER, autoIncrement: true, primaryKey: true })
	declare id: number;
	@Column({ type: DataType.INTEGER })
	declare senderId: number;
	@Column({ type: DataType.INTEGER })
	declare adminId: number;
	@Column({ type: DataType.STRING })
	declare msgContent: string;
}
