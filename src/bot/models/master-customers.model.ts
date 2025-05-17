import { Column, DataType, Model, Table } from "sequelize-typescript";

interface MasterCustomersCreationAttr {
	user_id?: string;
	master_id?: string;
	name?: string;
	date?: string;
	time?: string;
	status?: boolean;
	mark?: number;
}
@Table({ tableName: "master_customer", freezeTableName: true })
export class MasterCustomers extends Model<
	MasterCustomers,
	MasterCustomersCreationAttr
> {
	@Column({ type: DataType.INTEGER, autoIncrement: true, primaryKey: true })
	declare id: number;
	@Column({ type: DataType.STRING })
	declare master_id: string;
	@Column({ type: DataType.STRING })
	declare user_id: string;
	@Column({ type: DataType.STRING(50) })
	declare name: string;
	@Column({ type: DataType.STRING(20) })
	declare date: string;
	@Column({ type: DataType.STRING(10) })
	declare time: string;
	@Column({ type: DataType.BOOLEAN })
	declare status: boolean;
	@Column({ type: DataType.INTEGER })
	declare mark: number;
}
