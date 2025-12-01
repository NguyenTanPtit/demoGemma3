import { Database } from '@nozbe/watermelondb'
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite'

import { mySchema } from './schema'
import Work from './model/Work'

const adapter = new SQLiteAdapter({
  schema: mySchema,
  // (You might want to comment out migrations if you haven't created them yet)
  // migrations,
  // dbName: 'myapp', // optional, defaults to the app name
  jsi: true, /* Platform.OS === 'ios' */
  onSetUpError: error => {
    // Database failed to load -- offer the user to reload the app or log out
    console.log("Database failed to load", error)
  }
})

export const database = new Database({
  adapter,
  modelClasses: [
    Work,
  ],
})