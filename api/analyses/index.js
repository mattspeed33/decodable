import { makeCollectionHandler } from '../_lib/crud.js'
export default makeCollectionHandler({
  table: 'analyses',
  columns: ['student_id', 'date'],
  orderBy: 'date',
  scopeColumns: ['student_id'],
})
