import { useEffect, useState, type ComponentType } from 'react';

/**
 * Componente controlado (`value` + `onChange`) com estado próprio: a história deixa digitar e escolher, e o painel
 * de Controles continua mandando no valor inicial. O `onChange` original segue sendo chamado (aparece em Ações).
 */
export function stateful<P extends { value: any; onChange: (...args: any[]) => void }>(Component: ComponentType<P>) {
  function Stateful(props: P) {
    const [value, setValue] = useState(props.value);
    useEffect(() => setValue(props.value), [props.value]);
    const onChange = (next: P['value'], ...rest: unknown[]) => {
      setValue(next);
      props.onChange(next, ...rest);
    };
    return <Component {...props} value={value} onChange={onChange} />;
  }
  Stateful.displayName = `Stateful(${Component.displayName ?? Component.name})`;
  return Stateful;
}
