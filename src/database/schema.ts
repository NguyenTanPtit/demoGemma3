import { appSchema, tableSchema } from '@nozbe/watermelondb'

export const mySchema = appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: 'works',
      columns: [
        { name: 'work_id', type: 'number' },
        { name: 'work_code', type: 'string' },
        { name: 'work_description', type: 'string' },
        { name: 'work_status_name', type: 'string' },
        { name: 'work_staff_name', type: 'string' },
        { name: 'work_created_date', type: 'string' },
        { name: 'json_content', type: 'string' },
      ],
    }),
  ],
})