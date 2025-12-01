import { Model } from '@nozbe/watermelondb'
import { field, date, readonly, text } from '@nozbe/watermelondb/decorators'

export default class Work extends Model {
  static table = 'works'

  @field('work_id') workId!: number
  @text('work_code') workCode!: string
  @text('work_description') workDescription!: string
  @text('work_status_name') workStatusName!: string
  @text('work_staff_name') workStaffName!: string
  @text('work_created_date') workCreatedDate!: string
  @text('json_content') jsonContent!: string
}