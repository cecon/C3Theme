import { ComponentType, Suspense } from 'react';

import PageLoader from './PageLoader';

/** Envolve uma página carregada com `lazy()` mostrando a barra de carregamento enquanto o código chega. */
export default function Loadable<P extends object>(Component: ComponentType<P>) {
  return function LoadableComponent(props: P) {
    return (
      <Suspense fallback={<PageLoader />}>
        <Component {...props} />
      </Suspense>
    );
  };
}
