import { useIntl } from 'react-intl';

import DecimalField from './DecimalField';
import type { DecimalFieldProps } from './DecimalField';
import { currencySymbol } from './values';

export interface MoneyFieldProps extends Omit<DecimalFieldProps, 'prefix'> {
  /** Código ISO 4217; padrão BRL. */
  currency?: string;
}

/** Dinheiro: `DecimalField` com o símbolo da moeda e duas casas. O valor continua string com ponto ("19.90"). */
export default function MoneyField({ currency = 'BRL', scale = 2, ...rest }: MoneyFieldProps) {
  const { locale } = useIntl();
  return <DecimalField {...rest} scale={scale} prefix={currencySymbol(currency, locale)} />;
}
