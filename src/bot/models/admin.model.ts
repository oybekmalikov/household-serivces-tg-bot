import { Column, DataType, Model, Table } from "sequelize-typescript";

interface IAdminCreationAttr {
	user_id?: string;
	name?: string;
	phone_number?: string;
	status?: boolean;
}
@Table({ tableName: "admins", freezeTableName: true })
export class Admin extends Model<Admin, IAdminCreationAttr> {
	@Column({ type: DataType.INTEGER, autoIncrement: true, primaryKey: true })
	declare id: number;
	@Column({ type: DataType.STRING, unique: true })
	declare user_id: string;
	@Column({ type: DataType.STRING(50) })
	declare name: string;
	@Column({ type: DataType.STRING(20) })
	declare phone_number: string;
	@Column({ type: DataType.BOOLEAN })
	declare status: boolean;
	@Column({ type: DataType.STRING })
	declare actions: string;
}
