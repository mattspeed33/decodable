import { makeCollectionHandler } from '../_lib/crud.js'
export default makeCollectionHandler({
  table: 'scheduled_sessions',
  columns: ['student_id', 'date'],
  orderBy: 'date',
  orderDir: 'asc',
  scopeColumns: ['student_id'],
})
