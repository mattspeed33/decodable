import { makeCollectionHandler } from '../_lib/crud.js'
export default makeCollectionHandler({
  table: 'report_cards',
  columns: ['student_id', 'date'],
  orderBy: 'date',
  scopeColumns: ['student_id'],
})
