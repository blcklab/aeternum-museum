export function requestPopupClose(event, host) {
  if(host.parent===host||event.repeat||event.isComposing||event.altKey||event.ctrlKey||event.metaKey||event.shiftKey||event.defaultPrevented)return false;
  const path=event.composedPath?.()??[event.target];
  if(path.some(node=>node?.isContentEditable||node?.closest?.('input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="textbox"]')))return false;
  if(event.code!=='KeyM'&&event.key!=='Escape')return false;
  event.preventDefault();host.parent.postMessage({channel:'anyo-web-popup@1',type:'close'},'*');return true;
}
