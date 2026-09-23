import { useEffect, useReducer } from 'react';

export function useControllerState(controller: EventTarget | null): void {
  const [, rerender] = useReducer((value) => value + 1, 0);
  useEffect(() => {
    if (!controller) return;
    const update = () => rerender();
    controller.addEventListener('change', update);
    return () => controller.removeEventListener('change', update);
  }, [controller]);
}
