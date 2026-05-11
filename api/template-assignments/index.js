import { makeCollectionHandler } from '../_lib/crud.js'
export default makeCollectionHandler({
  table: 'template_assignments',
  columns: ['student_id', 'template_id'],
  scopeColumns: ['student_id'],
  hasUpdatedAt: false,
})
