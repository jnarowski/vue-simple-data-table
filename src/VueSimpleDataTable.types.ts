export interface iVueDataTableState {
  checkAll: boolean
  limit: number
  offset: number
  order: string
  page: number
  pageSize: number
  reset: () => void
  selected: string[]
  sort: string
}

export interface iVueDataTableColumn {
  columnClasses?: string[]
  columnStyles?: any
  display?: ({ row, value }) => string
  field: string
  headerClasses?: string[]
  iconClass?: string
  label?: string
  rowClass?: string
  sortable?: boolean
  tooltip?: string
  width?: string
}

export interface iVueDataTablePropsTheme {
  actionsTd: string
  actionsTh: string
  checkboxInput: string
  checkboxTd: string
  checkboxTh: string
  emptyPlaceholder: string
  table: string
  tableWrapper: string
  tableWrapperInner: string
  tableWrapperOuter: string
  tbody: string
  td: string
  th: string
  thead: string
  trActive: string
}
