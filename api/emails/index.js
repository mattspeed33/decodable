import { makeCollectionHandler } from '../_lib/crud.js'
export default makeCollectionHandler({
  table: 'emails',
  columns: ['student_id', 'date_sent'],
  orderBy: 'date_sent',
  scopeColumns: ['student_id'],
  hasUpdatedAt: false,
})
