<script setup lang="ts">
import { computed, useSlots, reactive, ref, watch, toRefs } from "vue";
import {
  iVueDataTableColumn,
  iVueDataTablePropsTheme,
  iVueDataTableState,
} from "./VueSimpleDataTable.types";

export interface iVueDataTableProps {
  columns?: iVueDataTableColumn[];
  emptyPlaceholder?: string;
  loading?: boolean;
  theme?: iVueDataTablePropsTheme;
  page?: number;
  pageSize?: number;
  rows?: any[];
  rowKey?: string;
  showActions?: boolean;
  showCheckboxes?: boolean;
  sortable?: {
    order: string;
    sort: string;
  };
  total?: number;
}

const props = withDefaults(defineProps<iVueDataTableProps>(), {
  columns: () => [],
  emptyPlaceholder: "",
  loading: false,
  theme: () => ({
    actionsTd: "vtd-actions-td",
    actionsTh: "vtd-actions-th",
    checkboxInput: "vdt-checkbox-input",
    checkboxTd: "vdt-td",
    checkboxTh: "vtd-th-checkbox",
    emptyPlaceholder: "vtd-empty-placeholder",
    table: "vtd-table",
    tableWrapper: "vdt-table-wrapper",
    tableWrapperInner: "vdt-table-wrapper-inner",
    tableWrapperOuter: "vtd-table-wrapper-outer",
    tbody: "vtd-tbody",
    td: "vdt-td",
    th: "vtd-th",
    thead: "vtd-thead",
    trActive: "vdt-active",
  }),
  page: 1,
  pageSize: 50,
  rows: () => [],
  rowKey: "id",
  showActions: false,
  showCheckboxes: false,
  sortable: () => ({
    sort: "id",
    order: "asc",
  }),
  total: 0,
});

const { page, pageSize, total } = toRefs(props);

const emit = defineEmits([
  "check-one",
  "check-all",
  "do-search",
  "is-finished",
]);
const localTable = ref<HTMLElement | null>(null);
const slots = useSlots();
const state: iVueDataTableState = reactive({
  checkAll: false,
  limit: computed(() => {
    const limit = state.page * state.pageSize;
    return total.value >= limit ? limit : total.value;
  }),
  order: props.sortable.order,
  offset: computed(() => {
    return (state.page - 1) * state.pageSize + 1;
  }),
  page: page.value,
  pageSize: pageSize.value,
  reset: () => {
    state.selected = [];
    clearCheckAll();
  },
  selected: ref<string[]>([]),
  sort: props.sortable.sort,
  // ---------------------------
  // local non-api data (unused until we restore local paging without api access)
  // ---------------------------
  // maxPage: computed(() => {
  //   if (total.value <= 0) {
  //     return 0
  //   }

  //   let maxPage = Math.floor(total.value / state.pageSize)
  //   const mod = total.value % state.pageSize

  //   if (mod > 0) {
  //     maxPage++
  //   }

  //   return maxPage
  // }),
  // paging: computed(() => {
  //   let startPage = state.page - 2 <= 0 ? 1 : state.page - 2

  //   if (state.maxPage - state.page <= 2) {
  //     startPage = state.maxPage - 4
  //   }

  //   startPage = startPage <= 0 ? 1 : startPage

  //   const pages: number[] = []

  //   for (let i = startPage; i <= state.maxPage; i++) {
  //     if (pages.length < 5) {
  //       pages.push(i)
  //     }
  //   }

  //   return pages
  // }),
});

watch(page, (value) => (state.page = value));
watch(pageSize, (value) => (state.pageSize = value));

const handleSort = (col: any) => {
  if (!col.sortable) return;

  const sort = col.field;
  const order = state.order === "asc" ? "desc" : "asc";
  const offset = (state.page - 1) * state.pageSize;
  const limit = state.pageSize;

  state.order = order;
  state.sort = sort;

  search({ offset, limit, order, sort, page: state.page });
};

const search = ({ limit, offset, order, page, sort }) => {
  clearCheckAll();
  emit("do-search", { limit, offset, order, page, sort });
};

// -------------------------------------
// PAGINATION
// -------------------------------------

const movePage = (page: number) => {
  state.page = page;

  const { offset, order, sort } = state;
  const limit = state.pageSize;

  search({ limit, offset, order, page, sort });
};

// -------------------------------------
// CHECKBOXES
// -------------------------------------

const rowCheckbox = ref<HTMLInputElement[]>([]);

const clearChecked = () => {
  state.selected = [];

  rowCheckbox.value.forEach((val: any) => {
    if (val) val.checked = false;
  });

  emit("check-all", { selected: state.selected, checkedAll: false, state });
};

const clearCheckAll = () => {
  if (!props.showCheckboxes) {
    return;
  }

  state.checkAll = false;
  clearChecked();
};

const handleCheckOne = ($event) => {
  const value = $event.target.value;
  const checked = $event.target.checked;

  if (checked) {
    state.selected.push(value);
  } else {
    state.selected = state.selected.filter((id) => id !== value);
  }

  emit("check-one", { selected: value, checked, state });
  emitCheckAll($event);
};

const emitCheckAll = ($event) => {
  let checkedAll = false;

  if (props.pageSize === state.selected.length) {
    checkedAll = true;
  }

  if (total.value < props.pageSize && total.value === state.selected.length) {
    checkedAll = true;
  }

  emit("check-all", { selected: state.selected, checkedAll, $event, state });
};

const handleCheckAll = ($event) => {
  state.selected = [] as string[];

  rowCheckbox.value.forEach((val: any, i: number) => {
    if (val) {
      val.checked = $event.target.checked;
      if (val.checked) state.selected.push(val.value);
    }
  });

  emitCheckAll($event);
};

const isRowChecked = (row) => {
  let key = row[props.rowKey];

  if (typeof key !== "string") {
    key = (key || "").toString();
  }

  return !!state.selected.find((item) => item === key);
};

// -------------------------------------
// COLUMNS & STYLE
// -------------------------------------

const buildTableDataClass = (col) => {
  let classes: string[] = [];

  if (col.columnClasses) {
    classes = classes.concat(col.columnClasses);
  }

  if (col.rowClass) {
    return classes.concat(col.rowClass);
  }

  classes = classes.concat(props.theme.td);

  return classes;
};

const buildTableDataActionsClass = (row) => {
  let classes: string[] = [];

  classes = classes.concat(props.theme.td, props.theme.actionsTd);

  return classes;
};

const buildTableDataCheckboxClass = (row) => {
  let classes: string[] = [];

  classes = classes.concat(props.theme.td, props.theme.checkboxTd);

  return classes;
};

const buildTableRowClass = (row) => {
  const classes: string[] = [];

  if (isRowChecked(row)) classes.push(props.theme.trActive);

  return classes;
};

const buildTableHeaderStyle = (col) => {
  return Object.assign(
    { width: col.width ? col.width : "auto" },
    col.headerStyles
  );
};

const buildTableHeaderClass = (col) => {
  let classes: string[] = [];

  classes = classes.concat(props.theme.th);

  if (col.headerClasses) {
    classes.concat(col.headerClasses);
  }

  return classes;
};

const buildTableHeaderInnerClass = (col) => {
  return {
    "vtl-sortable": col.sortable,
    "vtl-both": col.sortable,
    "vtl-asc": state.order === col.field && state.sort === "asc",
    "vtl-desc": state.order === col.field && state.sort === "desc",
  };
};

const columnLength = computed(() => {
  let length = props.columns.length;

  if (props.showActions) length++;
  if (props.showCheckboxes) length++;

  return length;
});
</script>

<template>
  <div class="vtl" :class="theme.tableWrapper">
    <div :class="theme.tableWrapperOuter">
      <div :class="theme.tableWrapperInner">
        <table ref="localTable" class="vtl-table" :class="theme.table" data-cy="data-table">
          <thead class="vtl-thead" :class="theme.thead">
            <tr class="vtl-thead-tr" data-cy="data-table-tr">
              <th v-if="showCheckboxes" class="vtl-thead-th vtl-checkbox-th" :class="theme.th + theme.checkboxTh || []">
                <div>
                  <input v-model="state.checkAll" type="checkbox" :class="theme.checkboxInput"
                    @click="handleCheckAll" />
                </div>
              </th>
              <th v-for="(col, index) in columns" :key="index" class="vtl-thead-th" :class="buildTableHeaderClass(col)"
                :style="buildTableHeaderStyle(col)">
                <slot name="header" :col="col" :handleSort="handleSort" :order="state.order" :sort="state.sort">
                  <div class="vtl-thead-column" :class="buildTableHeaderInnerClass(col)" @click="handleSort(col)">
                    {{ col.label }}
                  </div>
                </slot>
              </th>
              <th v-if="showActions" :class="theme.actionsTh"></th>
            </tr>
          </thead>
          <tbody v-if="rows.length > 0" class="vtl-tbody" :class="theme.tbody">
            <tr v-for="(row, i) in rows" :key="i" :class="buildTableRowClass(row)" :data-key="row[props.rowKey]"
              class="vtl-tbody-tr">
              <td v-if="showCheckboxes" class="vtl-tbody-td" :class="buildTableDataCheckboxClass(row)">
                <div>
                  <div v-if="isRowChecked(row)" class="bg-sp-light-blue-600 absolute inset-y-0 left-0 w-0.5"></div>
                  <input :ref="(el) => (rowCheckbox[i] = el as any)" :value="row[rowKey]" type="checkbox"
                    :class="theme.checkboxInput" @change="handleCheckOne" />
                </div>
              </td>
              <td v-for="(col, j) in columns" :key="j" class="vtl-tbody-td" :class="buildTableDataClass(col)"
                :style="col.columnStyles">
                <!-- eslint-disable-next-line vue/no-v-html -->
                <div v-if="col.display" v-html="col.display({ row, value: row[col.field] })"></div>
                <div v-else>
                  <div v-if="slots[col.field]">
                    <slot :col="col" :name="col.field" :value="row[col.field]" :row="row" />
                  </div>
                  <span v-else>
                    <template v-if="row[col.field]">
                      {{ row[col.field] }}
                    </template>
                    <span v-if="!row[col.field]" :class="props.theme.emptyPlaceholder">
                      {{ emptyPlaceholder }}
                    </span>
                  </span>
                </div>
              </td>
              <td v-if="showActions" class="vtl-tbody-td" :class="buildTableDataActionsClass(row)">
                <slot name="actions" :row="row"></slot>
              </td>
            </tr>
          </tbody>
          <tbody v-if="!rows.length || rows.length === 0 || loading">
            <tr>
              <td :colspan="columnLength">
                <slot v-if="!loading" name="no-results">No Results</slot>
                <slot v-if="loading" name="loading">Loading...</slot>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
  <div v-if="rows.length > 0" class="vtl-paging">
    <slot name="pagination" :page="state.page" :page-size="state.pageSize" :offset="state.offset" :move-page="movePage"
      :limit="state.limit" :total="total"></slot>
  </div>
</template>

<style scoped>
.vtl-sortable {
  cursor: pointer;
  background-position: right;
  background-repeat: no-repeat;
  padding-right: 30px !important;
}

.vtl-asc {
  background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABMAAAATCAYAAAByUDbMAAAAZ0lEQVQ4y2NgGLKgquEuFxBPAGI2ahhWCsS/gDibUoO0gPgxEP8H4ttArEyuQYxAPBdqEAxPBImTY5gjEL9DM+wTENuQahAvEO9DMwiGdwAxOymGJQLxTyD+jgWDxCMZRsEoGAVoAADeemwtPcZI2wAAAABJRU5ErkJggg==);
}

.vtl-desc {
  background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABMAAAATCAYAAAByUDbMAAAAZUlEQVQ4y2NgGAWjYBSggaqGu5FA/BOIv2PBIPFEUgxjB+IdQPwfC94HxLykus4GiD+hGfQOiB3J8SojEE9EM2wuSJzcsFMG4ttQgx4DsRalkZENxL+AuJQaMcsGxBOAmGvopk8AVz1sLZgg0bsAAAAASUVORK5CYII=);
}

.vtl-loading-mask {
  position: absolute;
  z-index: 9998;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  flex-flow: column;
  transition: opacity 0.3s ease;
}
</style>
