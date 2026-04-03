import { useState, useRef, useCallback } from "react";
import type { WatchLoop } from "./watch-loop.js";
import { createTreeState } from "../tree-view/tree-state.js";
import type { TreeState } from "../tree-view/types.js";
import { toFlatTreeState } from "../tree-view/adapter.js";
import { attachTreeSubscriber } from "./watch-tree-subscriber.js";
import TreeView from "../dashboard/TreeView.js";

export interface WatchTreeAppProps {
  loop: WatchLoop;
  verbosity: number;
}

export default function WatchTreeApp({ loop }: WatchTreeAppProps) {
  const stateRef = useRef<TreeState>(createTreeState());
  const [, setRevision] = useState(0);

  const bump = useCallback(() => {
    setRevision((r) => r + 1);
  }, []);

  // Attach subscriber synchronously during first render so events
  // emitted immediately after render() are captured. useEffect would
  // defer attachment past the first paint, causing missed events in
  // synchronous test scenarios and real startup races.
  const attachedRef = useRef(false);
  if (!attachedRef.current) {
    attachTreeSubscriber(loop, stateRef.current, bump);
    attachedRef.current = true;
  }

  const flatState = toFlatTreeState(stateRef.current);
  return <TreeView state={flatState} />;
}
