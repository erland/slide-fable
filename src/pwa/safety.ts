/** Shared guard for document edits, async operations, and coordinated upgrades. */
export class UpdateSafety {
  private dirty=false;
  private operations=0;
  private locked=false;
  private listeners=new Set<()=>void>();
  private snapshot={dirty:false,busy:false,locked:false};
  subscribe=(listener:()=>void)=>{this.listeners.add(listener);return ()=>{this.listeners.delete(listener);};};
  getSnapshot=()=>this.snapshot;
  private publish(){this.snapshot={dirty:this.dirty,busy:this.operations>0,locked:this.locked};for(const listener of this.listeners)listener();}
  setDirty(value:boolean){if(this.locked&&value)return false;this.dirty=value;this.publish();return true;}
  beginOperation(){if(this.locked)throw Error('UPDATE_LOCKED');this.operations++;this.publish();let ended=false;return ()=>{if(!ended){ended=true;this.operations--;this.publish();}};}
  prepare(){if(this.dirty||this.operations>0)return false;this.locked=true;this.publish();return true;}
  release(){this.locked=false;this.publish();}
}
export const updateSafety=new UpdateSafety();
