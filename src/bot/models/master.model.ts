import { Column, DataType, Model, Table } from "sequelize-typescript";

interface IMastersCreationAttr {
	name?: string;
	phone_number?: string;
	workshop_name?: string;
	address?: string;
	target_for_address?: string;
	location?: string;
	work_start_time?: string;
	work_end_time?: string;
	avgtime_for_custommer?: string;
	user_id?: string;
	section?: string;
	last_state?: string;
}
@Table({ tableName: "masters", freezeTableName: true })
export class Masters extends Model<Masters, IMastersCreationAttr> {
	@Column({ type: DataType.INTEGER, autoIncrement: true, primaryKey: true })
	declare id: number;
	@Column({ type: DataType.STRING, unique: true })
	declare user_id: string;
	@Column({ type: DataType.STRING(50) })
	declare name: string;
	@Column({ type: DataType.STRING(20) })
	declare phone_number: string;
	@Column({ type: DataType.STRING(50) })
	declare workshop_name: string;
	@Column({ type: DataType.STRING(100) })
	declare address: string;
	@Column({ type: DataType.STRING(100) })
	declare target_for_address: string;
	@Column({ type: DataType.STRING })
	declare location: string;
	@Column({ type: DataType.STRING(10) })
	declare work_start_time: string;
	@Column({ type: DataType.STRING(10) })
	declare work_end_time: string;
	@Column({ type: DataType.STRING(10) })
	declare avgtime_for_custommer: string;
	@Column({ type: DataType.STRING(20) })
	declare last_state: string;
	@Column({
		type: DataType.ENUM("pending", "confirmed", "rejected", "inactive"),
	})
	declare withAdmin: string;
	@Column({ type: DataType.STRING(50) })
	declare section: string;
	@Column({ type: DataType.BOOLEAN, defaultValue: false })
	declare isWritingToAdmin: boolean;
	@Column({ type: DataType.TEXT })
	declare times: string;
	@Column({ type: DataType.DECIMAL, defaultValue: 0 })
	declare rating: number;
	@Column({ type: DataType.STRING(100) })
	declare other_actions: string;
}
