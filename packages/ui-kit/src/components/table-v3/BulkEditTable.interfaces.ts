import { ITableOptions } from './primitive/table.interfaces';

export interface IBulkEditTable {
  /**
   * Bulk-edit row values
   */
  rows: Array<IRowCellMeta>;

  /**
   * Whether row is disable or not. If true then no one can modify data
   */
  disabled?: boolean;

  /**
   * Table title
   */
  title: string;

  /**
   * Updated table values
   */
  onChange: (updatedRows: Array<IRowCellMeta>) => void;

  /** on mount table callback to expose table api */
  onMount: (tApi) => void;

  /**
   * Table meta data
   */
  options?: ITableOptions;
}
