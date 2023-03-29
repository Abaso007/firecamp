import mitt from 'mitt';
import { IRequestFolder, TId, IWebSocketMessage } from '@firecamp/types';
import {
  Disposable,
  TreeDataProvider as ITreeDataProvider,
  TreeItem,
  TreeItemIndex,
} from '@firecamp/ui/src/tree';

enum ETreeEventTypes {
  itemChanged = 'itemChanged',
}
type TTreeItemData = {
  name: string;
  value: string;
  __ref: {
    id: string;
    collectionId?: string;
    isFolder?: boolean;
    isItem?: boolean;
  };
};
type TItemExtra_meta = {
  //todo: ts improvement needed
  __ref?: {
    isFolder?: boolean;
    isItem?: boolean;
  };
};

type TFolderItem = Partial<IRequestFolder & TItemExtra_meta>;
type TItem = Partial<IWebSocketMessage & TItemExtra_meta>;
type TCItem = TFolderItem | TItem;

export class TreeDataProvider<T = TTreeItemData> implements ITreeDataProvider {
  private items: Array<TCItem>;
  private rootOrders: TreeItemIndex[];
  private emitter = mitt();

  constructor(folders: TFolderItem[], items: TItem[], rootOrders: string[]) {
    this.init(folders, items, rootOrders);
  }

  public async getTreeItem(
    itemId: TreeItemIndex
  ): Promise<TreeItem<TTreeItemData>> {
    if (itemId == 'root') {
      return Promise.resolve({
        index: 'root',
        canMove: true,
        data: { name: 'Root', value: '', __ref: { id: 'root' } },
        canRename: false,
        isFolder: true,
        children: this.rootOrders,
      });
    }

    const item = this.items.find((i) => i.__ref?.id == itemId);

    // console.log(this.items, itemId);
    if (!item) {
      return Promise.resolve({
        index: null,
        data: null,
      });
    }

    const treeItem: TTreeItemData = {
      name: item.name,
      //@ts-ignore
      value: item.value,
      __ref: {
        id: item.__ref.id,
        isFolder: item.__ref.isFolder,
        isItem: item.__ref.isItem,
        collectionId: item.__ref?.collectionId,
      },
    };

    const getChildren = (item) => {
      // if (item.__ref.isLeaf) return [];
      return this.items
        .filter((i) => {
          if (item.__ref.isFolder) return i.__ref.folderId == item.__ref.id;
          return true;
        })
        .map((i) => i.__ref.id);
    };

    const children = getChildren(item);
    return Promise.resolve({
      index: item.__ref.id,
      canMove: true,
      data: treeItem,
      canRename: true,
      isFolder: item.__ref.isFolder,
      children,
    });
  }

  public async onChangeItemChildren(
    itemId: TreeItemIndex,
    newChildren: TreeItemIndex[]
  ): Promise<void> {
    if (itemId == 'root') this.rootOrders = newChildren;
    else {
      this.items = this.items.map((i) => {
        return i.__ref.id == itemId ? { ...i, children: newChildren } : i;
      });
    }
    this.emitter.emit(ETreeEventTypes.itemChanged, [itemId]);
  }

  public onDidChangeTreeData(
    listener: (changedItemIds: TreeItemIndex[]) => void
  ): Disposable {
    // console.log(listener, "listener.....onDidChangeTreeData")
    const handler = (itemIDs: TreeItemIndex[]) => listener(itemIDs);
    this.emitter.on(ETreeEventTypes.itemChanged, handler);
    return {
      dispose: () => this.emitter.off(ETreeEventTypes.itemChanged, handler),
    };
  }

  public async onRenameItem(item: TreeItem<any>, name: string): Promise<void> {
    //todo: implement
  }

  public init(folders: TFolderItem[], items: TItem[], rootOrders: string[]) {
    this.items = [
      ...folders.map((i) => ({
        ...i,
        __ref: { ...i.__ref, isFolder: true },
      })),
      ...items.map((i) => ({ ...i, __ref: { ...i.__ref, isItem: true } })),
    ];
    // this.rootOrders = this.items
    //   .filter((i) => !i.__ref.folderId)
    //   .map((i) => i.__ref.id);
    console.log(this.items, 'initial time this.item');
    this.rootOrders = rootOrders;
  }

  // extra methods of provider
  private add(item: TFolderItem | TItem) {
    this.items.push({ ...item, __ref: { ...item.__ref, isFolder: true } });
    if (!item.__ref.folderId) {
      this.rootOrders.push(item.__ref.id);
      this.emitter.emit(ETreeEventTypes.itemChanged, ['root']);
    } else {
      this.emitter.emit(ETreeEventTypes.itemChanged, [item.__ref.folderId]);
    }
  }
  public addFolder(item: TFolderItem) {
    this.items.push({ ...item, __ref: { ...item.__ref, isFolder: true } });
    this.add(item);
  }
  public addItem(item: TItem) {
    this.items.push({ ...item, __ref: { ...item.__ref, isItem: true } });
    this.add(item);
  }

  public update(item: TItem) {
    this.items = this.items.map((itm: TItem) => {
      if (itm.__ref.id == item.__ref.id) {
        // if only name is updated then even this will work, or full payload. just merging updated item with previous item
        return {
          ...itm,
          ...item,
          __ref: { ...itm.__ref, ...item.__ref }, //make sure that isFolder and isItem must be there on __ref
        };
      }
      return itm;
    });
    if (!item.__ref.folderId) {
      this.rootOrders.push(item.__ref.id);
      this.emitter.emit(ETreeEventTypes.itemChanged, ['root']);
    } else {
      this.emitter.emit(ETreeEventTypes.itemChanged, [item.__ref.folderId]);
    }
  }
  public delete(id: TId) {
    const item = this.items.find((i) => i.__ref.id == id);
    // console.log(id, item);
    if (!item) return;
    this.items = this.items.filter((i) => i.__ref.id != id);
    if (!item.__ref.folderId) {
      this.rootOrders = this.rootOrders.filter((i) => i != id);
      this.emitter.emit(ETreeEventTypes.itemChanged, ['root']);
    } else {
      this.emitter.emit(ETreeEventTypes.itemChanged, [item.__ref.folderId]);
    }
  }

  public isEmpty() {
    return !this.items.length;
  }
}
