import { Column, DataType, Model, Table } from "sequelize-typescript";

interface IChatWithAdminCreationAttr {
	senderId?: string;
	adminId?: string;
	requestContent?: string;
	responseContent?: string;
}

@Table({ tableName: "chat_with_admin", freezeTableName: true })
export class ChatWithAdmin extends Model<
	ChatWithAdmin,
	IChatWithAdminCreationAttr
> {
	@Column({ type: DataType.INTEGER, autoIncrement: true, primaryKey: true })
	declare id: number;
	@Column({ type: DataType.STRING })
	declare senderId: string;
	@Column({ type: DataType.STRING })
	declare adminId: string;
	@Column({ type: DataType.STRING })
	declare requestContent: string;
	@Column({ type: DataType.STRING })
	declare responseContent: string;
}
