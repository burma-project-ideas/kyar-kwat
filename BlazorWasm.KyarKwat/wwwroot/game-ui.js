let listeners;

export function initialize(component) {
    listeners = new AbortController();
    document.querySelectorAll('dialog').forEach(dialog => dialog.addEventListener('cancel', event => {
        event.preventDefault();
        component.invokeMethodAsync('DismissDialog');
    }, { signal: listeners.signal }));
    document.querySelector('#board').addEventListener('keydown', event => {
        if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) event.preventDefault();
    }, { signal: listeners.signal });
}

export function show(id) {
    document.querySelectorAll('dialog[open]').forEach(dialog => { if (dialog.id !== id) dialog.close(); });
    const dialog = document.getElementById(id);
    if (!dialog.open) dialog.showModal();
}

export function close(id) { document.getElementById(id).close(); }
export function focusSquare(index) { document.querySelector(`[data-index="${index}"]`)?.focus({ preventScroll: true }); }
export function dispose() { listeners?.abort(); }
