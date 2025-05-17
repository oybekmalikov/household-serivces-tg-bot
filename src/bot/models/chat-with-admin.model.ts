import { Column, DataType, Model, Table } from "sequelize-typescript";

interface IChatWithAdminCreationAttr {
	senderId: number;
	adminId: number;
	msgContent: string;
}

@Table({ tableName: "chat_with_admin", freezeTableName: true })
export class ChatWithAdmin extends Model<ChatWithAdmin, IChatWithAdminCreationAttr> {
	@Column({ type: DataType.INTEGER, autoIncrement: true, primaryKey: true })
	declare id: number;
	@Column({ type: DataType.INTEGER })
	declare senderId: number;
	@Column({ type: DataType.INTEGER })
	declare adminId: number;
	@Column({ type: DataType.STRING })
	declare msgContent: string;
}
