import { makeCollectionHandler } from '../_lib/crud.js'
export default makeCollectionHandler({
  table: 'homework_sheets',
  columns: ['student_id'],
  scopeColumns: ['student_id'],
})
